import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Mic, Lightbulb, Flame, Volume2, Square, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';

export type VocabWord = {
  id?: number;
  word: string;
  meaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  pos?: string;
  ipa?: string;
  en?: string;
  vi?: string;
  posVi?: string;
  frequency?: number;
  category?: string;
};

interface WriteEval {
  is_correct: boolean;
  uses_word: boolean;
  band: number;
  feedback_vi: string;
  correction: string;
  errors: { type: string; issue: string; fix: string }[];
}

interface SpeakEval {
  score: number;
  wordResults: { word: string; correct: boolean }[];
  spokenText: string;
}

interface SentenceBuildExerciseProps {
  words: VocabWord[];
  onBack: () => void;
  storageKeyId: string;
  initialMode?: 'sentence_build' | 'speak_build';
  onHistoryPost?: (payload: any) => void;
  folders?: any[];
}

const normalizeString = (str: string) => {
  return str.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s']/g, "")
    .replace(/'/g, "")
    .trim();
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const evaluatePronunciation = (spoken: string, target: string) => {
  const normSpoken = normalizeString(spoken).split(/\s+/).filter(Boolean);
  const normTarget = normalizeString(target).split(/\s+/).filter(Boolean);

  // LCS implementation
  const m = normTarget.length;
  const n = normSpoken.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normTarget[i - 1] === normSpoken[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matchedCount = dp[m][n];
  const score = m === 0 ? 0 : Math.round((matchedCount / m) * 100);

  // Determine wordResults by backtracking (simplified, just checking inclusion in order)
  let i = m, j = n;
  const correctIndices = new Set<number>();
  while (i > 0 && j > 0) {
    if (normTarget[i - 1] === normSpoken[j - 1]) {
      correctIndices.add(i - 1);
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const wordResults = target.split(/\s+/).map((word, idx) => ({
    word,
    correct: correctIndices.has(idx)
  }));

  return { score, wordResults, spokenText: spoken };
};

export default function SentenceBuildExercise({ words, onBack, storageKeyId, initialMode = 'sentence_build', onHistoryPost, folders }: SentenceBuildExerciseProps) {
  const [activeMode, setActiveMode] = useState<'sentence_build' | 'speak_build'>(initialMode);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  
  // All per-word maps are keyed by a STABLE word identity (see keyOf), never by array
  // index — index keys collide across sessions/word-sets restored from localStorage.
  const [evaluationsWrite, setEvaluationsWrite] = useState<Record<string, WriteEval>>({});
  const [evaluationsSpeak, setEvaluationsSpeak] = useState<Record<string, SpeakEval>>({});
  const [speakSentences, setSpeakSentences] = useState<Record<string, string>>({});
  const [speakAudios, setSpeakAudios] = useState<Record<string, string>>({}); // base64 data URLs of the user's recordings
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speechRecRef = useRef<any>(null);
  const interimTranscriptRef = useRef('');
  const savedHistoryRef = useRef(false);

  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    loading: boolean;
    error?: string;
    viDef?: string;
    enDef?: string;
    example?: string;
    pos?: string;
    saving?: boolean;
    saved?: boolean;
    saveError?: string;
    selectedFolderId?: string;
    audioUrl?: string;
  } | null>(null);

  const handleWordClick = async (wordText: string) => {
    const cleanWord = wordText.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!cleanWord) return;
    
    setSelectedWordInfo({ word: cleanWord, loading: true });
    try {
      let enDef = '';
      let example = '';
      let pos = '';
      let audioUrl = '';
      let viDef = '';

      // 1. Fetch English definition from Dictionary API
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          const entry = dictData[0];
          if (entry) {
            // Get audio
            const phonetic = entry.phonetics?.find((p: any) => p.audio);
            if (phonetic) audioUrl = phonetic.audio;
            
            // Get meanings
            for (const m of (entry.meanings || [])) {
              if (!pos) pos = m.partOfSpeech;
              for (const d of (m.definitions || [])) {
                if (!enDef) enDef = d.definition;
                if (!example && d.example) example = d.example;
                if (enDef && example) break;
              }
              if (enDef && example) break;
            }
          }
        }
      } catch (e) {
        console.error("Dictionary API error", e);
      }

      // 2. Fetch Vietnamese translation
      try {
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(enDef || cleanWord)}`);
        if (transRes.ok) {
          const transData = await transRes.json();
          viDef = transData[0]?.[0]?.[0] || '';
        }
      } catch (e) {
        console.error("Google Translate API error", e);
      }

      setSelectedWordInfo({
        word: cleanWord,
        loading: false,
        viDef: viDef || enDef,
        example,
        pos,
        audioUrl,
        selectedFolderId: folders?.[0]?.id || ''
      });
    } catch (e) {
      setSelectedWordInfo({ word: cleanWord, loading: false, error: 'Lỗi kết nối.' });
    }
  };

  const handleSaveWord = async () => {
     if (!selectedWordInfo) return;
     setSelectedWordInfo(prev => ({ ...prev!, saving: true }));
     try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : { 'x-mock-user-id': 'usr_2' })
        };
        const payload = {
          word: selectedWordInfo.word,
          definition: selectedWordInfo.viDef,
          example: selectedWordInfo.example,
          pos: selectedWordInfo.pos,
          folder_id: selectedWordInfo.selectedFolderId || null
        };
        const res = await fetch('/api/notebook', { method: 'POST', headers, body: JSON.stringify(payload) });
        if (res.ok) {
           setSelectedWordInfo(prev => ({ ...prev!, saving: false, saved: true }));
        } else if (res.status === 409) {
           setSelectedWordInfo(prev => ({ ...prev!, saving: false, saveError: 'Từ đã có trong sổ.' }));
        } else {
           setSelectedWordInfo(prev => ({ ...prev!, saving: false, saveError: 'Lỗi lưu.' }));
        }
     } catch (e) {
        setSelectedWordInfo(prev => ({ ...prev!, saving: false, saveError: 'Lỗi mạng.' }));
     }
  };

  const wordObj = words[currentIdx];

  // Stable per-word key so results follow the word, not its position in the list.
  const keyOf = (i: number) => {
    const w = words[i];
    return w?.id != null ? `id:${w.id}` : `w:${(w?.word || '').toLowerCase()}`;
  };
  const curKey = keyOf(currentIdx);

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem(`tid_sentence_prog_v2_${storageKeyId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.currentIdx !== undefined) setCurrentIdx(data.currentIdx);
        if (data.userInput !== undefined) setUserInput(data.userInput);
        if (data.evaluationsWrite) setEvaluationsWrite(data.evaluationsWrite);
        if (data.evaluationsSpeak) setEvaluationsSpeak(data.evaluationsSpeak);
        if (data.speakAudios) setSpeakAudios(data.speakAudios);
        if (data.completed) setIsCompleted(true);
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, [storageKeyId]);

  useEffect(() => {
    // Save to local storage on change
    if (currentIdx === 0 && !userInput && Object.keys(evaluationsWrite).length === 0 && Object.keys(evaluationsSpeak).length === 0) return;
    const data = {
      currentIdx,
      userInput,
      evaluationsWrite,
      evaluationsSpeak,
      speakAudios,
      completed: isCompleted
    };
    const key = `tid_sentence_prog_v2_${storageKeyId}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // Recordings (base64 audio) can exceed the localStorage quota — retry without them
      // so the rest of the session progress still persists.
      console.warn("localStorage quota exceeded, saving without audio recordings", e);
      try {
        localStorage.setItem(key, JSON.stringify({ ...data, speakAudios: {} }));
      } catch {}
    }
  }, [currentIdx, userInput, evaluationsWrite, evaluationsSpeak, speakAudios, isCompleted, storageKeyId]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    playSuccessSound();
  };

  const handleWriteSubmit = async () => {
    if (!userInput.trim()) return;
    setErrorMsg('');
    
    // Simple client-side stem check (very basic)
    const normalizedInput = userInput.toLowerCase();
    const targetWord = wordObj.word.toLowerCase();
    const stem = targetWord.slice(0, Math.max(4, targetWord.length - 2)); // Simple stem
    
    if (!normalizedInput.includes(stem) && !normalizedInput.includes(targetWord)) {
      setErrorMsg(`Vui lòng sử dụng từ "${wordObj.word}" trong câu của bạn.`);
      return;
    }

    setIsEvaluating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      if (!token) {
        setErrorMsg('Vui lòng đăng nhập để sử dụng tính năng này.');
        setIsEvaluating(false);
        return;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: 'vocab_sentence',
          payload: {
            word: wordObj.word,
            definition: wordObj.vi || wordObj.meaning,
            pos: wordObj.pos || wordObj.posVi,
            sentence: userInput
          }
        })
      });
      const data = await res.json();
      if (data.evaluation) {
        setEvaluationsWrite(prev => ({ ...prev, [curKey]: data.evaluation }));
        if (data.evaluation.is_correct) {
          triggerConfetti();
        }
      } else {
        setErrorMsg('Có lỗi xảy ra khi chấm điểm.');
      }
    } catch (error) {
      setErrorMsg('Lỗi kết nối.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const ensureTargetSentence = async () => {
    if (speakSentences[curKey]) return speakSentences[curKey];
    let target = wordObj.exampleEn;
    if (target) {
      setSpeakSentences(prev => ({ ...prev, [curKey]: target! }));
      return target;
    }

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      if (!token) {
        setIsProcessing(false);
        return wordObj.word;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: 'vocab_generate_sentence',
          payload: {
            word: wordObj.word,
            definition: wordObj.vi || wordObj.meaning,
            pos: wordObj.pos || wordObj.posVi
          }
        })
      });
      const data = await res.json();
      if (data.evaluation?.sentence) {
        setSpeakSentences(prev => ({ ...prev, [curKey]: data.evaluation.sentence }));
        target = data.evaluation.sentence;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
    return target || wordObj.word;
  };

  useEffect(() => {
    if (activeMode === 'speak_build') {
      ensureTargetSentence();
    }
  }, [activeMode, currentIdx]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      speechRecRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recKey = curKey;
    const targetSentence = speakSentences[curKey] || wordObj.exampleEn || wordObj.word;
    setErrorMsg('');
    interimTranscriptRef.current = '';
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Persist the user's recording so they can play it back (survives reload via localStorage).
        if (blob.size > 0) {
          try {
            const dataUrl = await blobToDataUrl(blob);
            setSpeakAudios(prev => ({ ...prev, [recKey]: dataUrl }));
          } catch (e) {
            console.error("Failed to store recording", e);
          }
        }

        // Give the speech recognizer a moment to deliver its final onresult before reading.
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Use speech recognition transcript first
        let transcript = interimTranscriptRef.current;
        let evalResult = evaluatePronunciation(transcript, targetSentence);

        // Fallback to whisper if score is low or transcript empty
        if (evalResult.score < 80 || transcript.trim() === '') {
          try {
            const formData = new FormData();
            formData.append('audio', blob, 'audio.webm');
            formData.append('hint', targetSentence);
            
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';
            if (!token) {
              setErrorMsg('Vui lòng đăng nhập để sử dụng tính năng này.');
              throw new Error('Unauthorized');
            }
            
            const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
            
            const res = await fetch('/api/speech-to-text', {
              method: 'POST',
              headers,
              body: formData
            });
            const data = await res.json();
            if (data.transcript) {
              const whisperEval = evaluatePronunciation(data.transcript, targetSentence);
              if (whisperEval.score > evalResult.score) {
                evalResult = whisperEval;
              }
            }
          } catch (e) {
             console.error("Transcription fallback failed", e);
          }
        }

        setEvaluationsSpeak(prev => ({ ...prev, [recKey]: evalResult }));
        if (evalResult.score >= 80) triggerConfetti();
        setIsProcessing(false);
      };

      // Init SpeechRecognition
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          // Rebuild the full transcript from all results (final AND interim) on every
          // event, so short utterances that never get flagged isFinal are not lost.
          let combined = '';
          for (let i = 0; i < event.results.length; ++i) {
            combined += event.results[i][0].transcript + ' ';
          }
          interimTranscriptRef.current = combined.trim();
        };
        
        speechRecRef.current = recognition;
        try {
          recognition.start();
        } catch(e) {}
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setErrorMsg('Vui lòng cấp quyền micro để sử dụng tính năng này.');
    }
  };

  const handleNext = () => {
    if (currentIdx < words.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setUserInput('');
      setShowHint(false);
      setErrorMsg('');
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    if (!savedHistoryRef.current && onHistoryPost) {
      savedHistoryRef.current = true;
      
      const writeScores = Object.values(evaluationsWrite).map(e => e.band);
      const speakScores = Object.values(evaluationsSpeak).map(e => e.score);
      
      if (writeScores.length > 0) {
        const avgBand = writeScores.reduce((a, b) => a + b, 0) / writeScores.length;
        onHistoryPost({
          exam_id: storageKeyId,
          score: Math.round(avgBand * 10),
          total: writeScores.length,
          category: "sentence_build",
          testName: "Luyện Đặt Câu",
          avgBand: avgBand.toFixed(1)
        });
      }
      
      if (speakScores.length > 0) {
        const avgScore = speakScores.reduce((a, b) => a + b, 0) / speakScores.length;
        onHistoryPost({
          exam_id: storageKeyId,
          score: Math.round(avgScore),
          total: speakScores.length,
          category: "speak_build",
          testName: "Luyện Nói",
          avgScore: Math.round(avgScore)
        });
      }
    }
  };

  if (isCompleted) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#6A8042', color: '#FFF8EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ background: '#FFFDF8', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '90%', position: 'relative', zIndex: 1, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '40px' }}>
            🔥
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: '900', color: '#1F2937' }}>Làm tốt lắm!</h2>
          <p style={{ margin: '0 0 30px', color: '#6B7280' }}>Bạn đã hoàn thành bài tập Tidians.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
             <div style={{ background: '#F3F4F6', padding: '15px', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Số câu đã viết</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>{Object.keys(evaluationsWrite).length}</div>
             </div>
             <div style={{ background: '#F3F4F6', padding: '15px', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Số câu đã nói</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>{Object.keys(evaluationsSpeak).length}</div>
             </div>
          </div>

          <button onClick={onBack} style={{ width: '100%', padding: '16px', background: '#A9B889', color: '#FFFDF8', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
            Quay lại màn hình chính
          </button>
          
          <button onClick={() => {
            setIsCompleted(false);
            setCurrentIdx(0);
            setUserInput('');
            setEvaluationsWrite({});
            setEvaluationsSpeak({});
            setSpeakAudios({});
            savedHistoryRef.current = false;
            localStorage.removeItem(`tid_sentence_prog_v2_${storageKeyId}`);
          }} style={{ width: '100%', padding: '16px', background: 'transparent', color: '#6B7280', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
            Làm lại từ đầu
          </button>
        </div>
      </div>
    );
  }

  const writeEval = evaluationsWrite[curKey];
  const speakEval = evaluationsSpeak[curKey];
  const isWriteDone = !!writeEval;
  const isSpeakDone = !!speakEval;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#6A8042', color: '#FFF8EB', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>
      {/* Background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 30px', position: 'relative', zIndex: 1 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#FFF8EB', cursor: 'pointer', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <ChevronLeft size={20} /> Đặt câu <span style={{ opacity: 0.7, fontWeight: 600, fontSize: '12px', marginLeft: '4px' }}>THE IELTS DICTIONARY</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="hidden md:flex">
           {words.map((_, i) => (
             <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === currentIdx ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
           ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '800' }}>
          Từ {currentIdx + 1}/{words.length}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px 20px', gap: '20px' }}>
        {/* Sidebar */}
        <div style={{ width: '300px', background: '#FFFDF8', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} className="hidden md:flex">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #F3F4F6' }}>
             <span style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', letterSpacing: '0.1em' }}>DANH SÁCH TỪ</span>
             <span style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF' }}>{currentIdx + 1}/{words.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {words.map((w, i) => (
              <div key={i} onClick={() => setCurrentIdx(i)} style={{ padding: '12px', borderRadius: '12px', background: i === currentIdx ? '#F3F6E7' : 'transparent', cursor: 'pointer', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === currentIdx ? '#46531F' : '#E5E7EB', color: i === currentIdx ? '#FFFDF8' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                  {i + 1}
                </div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#374151', flex: 1 }}>{w.word}</div>
                {(evaluationsWrite[keyOf(i)] || evaluationsSpeak[keyOf(i)]) && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A9B889' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div style={{ flex: 1, background: '#FFFDF8', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          {/* Top Half */}
          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
             <span style={{ border: '1px solid #D1D5DB', color: '#6B7280', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               {wordObj.pos || wordObj.posVi || 'vocab'}
             </span>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '40px', fontWeight: '900', margin: 0, color: '#1F2937', letterSpacing: '-0.02em' }}>{wordObj.word}</h1>
                <button onClick={() => speakText(wordObj.word)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', transition: 'all 0.2s' }}>
                  <Volume2 size={18} />
                </button>
             </div>
             
             <div style={{ fontSize: '16px', color: '#9CA3AF', fontFamily: 'monospace', marginBottom: '12px' }}>{wordObj.ipa}</div>
             <p style={{ fontSize: '20px', color: '#374151', margin: 0, fontWeight: '700' }}>{wordObj.vi || wordObj.meaning}</p>
             
             <button onClick={() => setShowHint(!showHint)} style={{ marginTop: '24px', background: 'transparent', color: '#E0A52E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '800' }}>
               <Lightbulb size={16} /> Xem ví dụ mẫu
             </button>

             {showHint && wordObj.exampleEn && (
               <div style={{ background: '#FFF7ED', padding: '16px 24px', borderRadius: '12px', marginTop: '20px', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                  <p style={{ fontStyle: 'italic', margin: 0, fontSize: '16px', color: '#9A3412' }}>"{wordObj.exampleEn}"</p>
                  {wordObj.exampleVi && <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#C2410C' }}>{wordObj.exampleVi}</p>}
               </div>
             )}
          </div>

          <div style={{ height: '1px', background: '#F3F4F6', margin: '0 40px' }} />

          {/* Bottom Half */}
          <div style={{ padding: '30px 40px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <div style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', letterSpacing: '0.1em' }} className="hidden sm:block">ĐẶT CÂU TIẾNG ANH VỚI TỪ NÀY:</div>
               <div style={{ display: 'flex', background: '#F3F4F6', padding: '4px', borderRadius: '20px', marginLeft: 'auto' }}>
                 <button onClick={() => setActiveMode('sentence_build')} style={{ padding: '6px 24px', background: activeMode === 'sentence_build' ? '#FFF' : 'transparent', color: activeMode === 'sentence_build' ? '#1F2937' : '#6B7280', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeMode === 'sentence_build' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                   Viết
                 </button>
                 <button onClick={() => setActiveMode('speak_build')} style={{ padding: '6px 24px', background: activeMode === 'speak_build' ? '#FFF' : 'transparent', color: activeMode === 'speak_build' ? '#1F2937' : '#6B7280', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeMode === 'speak_build' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                   Nói
                 </button>
               </div>
            </div>

            {/* Write Tab */}
            {activeMode === 'sentence_build' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {!isWriteDone ? (
                  <>
                    <textarea 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={`Hãy viết một câu hoàn chỉnh có chứa từ "${wordObj.word}"...`}
                      style={{ flex: 1, width: '100%', minHeight: '150px', padding: '24px', borderRadius: '20px', border: '1px solid #E5E7EB', background: '#FFF', color: '#1F2937', fontSize: '18px', fontFamily: "'Nunito', sans-serif", resize: 'none', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleWriteSubmit();
                        }
                      }}
                    />
                    {errorMsg && <div style={{ color: '#EF4444', fontWeight: '600', padding: '12px 0 0' }}>{errorMsg}</div>}
                    <button 
                      onClick={handleWriteSubmit}
                      disabled={isEvaluating}
                      style={{ marginTop: '20px', width: '100%', padding: '18px', background: '#A9B889', color: '#FFF', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '800', letterSpacing: '0.05em', cursor: isEvaluating ? 'not-allowed' : 'pointer', opacity: isEvaluating ? 0.7 : 1, transition: 'all 0.2s' }}
                    >
                      {isEvaluating ? 'ĐANG CHẤM ĐIỂM...' : 'NỘP BÀI (ENTER)'}
                    </button>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#374151' }}>Câu của bạn:</h3>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#A9B889', color: '#FFF', padding: '6px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '16px' }}>
                           Band {writeEval.band.toFixed(1)}
                        </div>
                      </div>
                      <p style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', background: '#F9FAFB', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB', margin: 0 }}>{userInput}</p>
                      
                      <div style={{ marginTop: '24px' }}>
                        <h4 style={{ color: '#4B5563', fontWeight: '800', marginBottom: '12px', fontSize: '16px' }}>Nhận xét:</h4>
                        <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                          <ReactMarkdown>{writeEval.feedback_vi}</ReactMarkdown>
                        </div>
                      </div>

                      {writeEval.correction && (
                        <div style={{ marginTop: '24px', background: '#F0FDF4', padding: '20px', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
                          <h4 style={{ color: '#15803D', margin: '0 0 8px 0', fontWeight: '800' }}>Gợi ý sửa đổi (Band cao hơn):</h4>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#166534' }}>{writeEval.correction}</p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
                       <button onClick={() => {
                          const newEvals = {...evaluationsWrite};
                          delete newEvals[curKey];
                          setEvaluationsWrite(newEvals);
                          setUserInput('');
                       }} style={{ flex: 1, padding: '16px', background: '#FFF', border: '2px solid #E5E7EB', color: '#6B7280', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                         Viết lại câu khác
                       </button>
                       <button onClick={handleNext} style={{ flex: 1, padding: '16px', background: '#A9B889', color: '#FFF', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                         {currentIdx < words.length - 1 ? 'Từ tiếp theo (Enter) →' : 'Hoàn thành bài tập ✓'}
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Speak Tab */}
            {activeMode === 'speak_build' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <div style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
                   <div style={{ fontSize: '12px', fontWeight: '800', color: '#9CA3AF', marginBottom: '16px', letterSpacing: '0.1em' }}>CÂU MẪU ĐỂ ĐỌC</div>
                   {isProcessing && !speakSentences[curKey] ? (
                     <div style={{ fontSize: '18px', color: '#9CA3AF' }}>Đang tạo câu...</div>
                   ) : (
                     <div style={{ fontSize: '24px', fontWeight: '700', lineHeight: 1.4, color: '#1F2937' }}>
                       {(speakSentences[curKey] || wordObj.exampleEn || wordObj.word).split(' ').map((w, i) => (
                         <span key={i} onClick={() => handleWordClick(w)} style={{cursor:'pointer', marginRight:'6px', display:'inline-block', transition:'color 0.1s'}} onMouseEnter={e => e.currentTarget.style.color='#5D6B2D'} onMouseLeave={e => e.currentTarget.style.color='#1F2937'}>{w}</span>
                       ))}
                     </div>
                   )}
                   <button onClick={() => speakText(speakSentences[curKey] || wordObj.exampleEn || wordObj.word)} style={{ marginTop: '24px', background: '#FFF', border: '1px solid #E5E7EB', color: '#4B5563', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                     <Volume2 size={18} /> Nghe phát âm mẫu
                   </button>
                 </div>

                 {isSpeakDone ? (
                   <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, marginTop: '20px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                       <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#374151' }}>Kết quả:</h3>
                       <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: speakEval.score >= 80 ? '#10B981' : '#F59E0B', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '16px' }}>
                          Độ chính xác: {speakEval.score}%
                       </div>
                     </div>
                     
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                       {speakEval.wordResults.map((w, idx) => (
                         <span key={idx} onClick={() => handleWordClick(w.word)} style={{ padding: '8px 14px', borderRadius: '10px', background: w.correct ? '#D1FAE5' : '#FEE2E2', color: w.correct ? '#065F46' : '#991B1B', fontWeight: '700', fontSize: '18px', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
                           {w.word}
                         </span>
                       ))}
                     </div>
                     
                     <div style={{ fontSize: '15px', color: '#6B7280', background: '#F3F4F6', padding: '16px', borderRadius: '12px' }}>
                       <b>Bạn đã đọc:</b> {speakEval.spokenText || "(Không nhận diện được giọng nói)"}
                     </div>

                     {speakAudios[curKey] && (
                       <button onClick={() => { new Audio(speakAudios[curKey]).play(); }} style={{ marginTop: '16px', alignSelf: 'flex-start', background: '#FFF', border: '1px solid #E5E7EB', color: '#4B5563', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                         <Volume2 size={18} /> Nghe lại giọng của bạn
                       </button>
                     )}

                     <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '30px' }}>
                       <button onClick={() => {
                          const newEvals = {...evaluationsSpeak};
                          delete newEvals[curKey];
                          setEvaluationsSpeak(newEvals);
                          setSpeakAudios(prev => { const next = { ...prev }; delete next[curKey]; return next; });
                       }} style={{ flex: 1, padding: '16px', background: '#FFF', border: '2px solid #E5E7EB', color: '#6B7280', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                         Thu âm lại
                       </button>
                       <button onClick={handleNext} style={{ flex: 1, padding: '16px', background: '#A9B889', color: '#FFF', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                         {currentIdx < words.length - 1 ? 'Từ tiếp theo (Enter) →' : 'Hoàn thành bài tập ✓'}
                       </button>
                    </div>
                   </div>
                 ) : (
                   <div style={{ marginTop: '40px', textAlign: 'center' }}>
                     {errorMsg && <div style={{ color: '#EF4444', fontWeight: '600', marginBottom: '16px' }}>{errorMsg}</div>}
                     <button 
                       onClick={toggleRecording} 
                       disabled={isProcessing}
                       style={{ width: '90px', height: '90px', borderRadius: '50%', background: isRecording ? '#EF4444' : '#A9B889', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', boxShadow: isRecording ? '0 0 0 12px rgba(239,68,68,0.2)' : '0 8px 0 #8A9A6A', transition: 'all 0.2s', animation: isRecording ? 'pulse 1.5s infinite' : 'none' }}
                     >
                       {isRecording ? <Square size={36} fill="currentColor" /> : <Mic size={40} />}
                     </button>
                     <style>{`
                       @keyframes pulse {
                         0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
                         70% { box-shadow: 0 0 0 24px rgba(239,68,68,0); }
                         100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
                       }
                     `}</style>
                     <div style={{ marginTop: '24px', fontSize: '16px', fontWeight: '700', color: '#9CA3AF' }}>
                       {isProcessing ? 'Đang xử lý...' : isRecording ? 'Nhấn để dừng ghi âm' : 'Nhấn để bắt đầu ghi âm'}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Popover logic goes above this or below this */}
      {selectedWordInfo && (
        <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',background:'rgba(0,0,0,0.5)'}} onClick={() => setSelectedWordInfo(null)}>
          <div style={{background:'#FFFDF8',padding:'24px',borderRadius:'20px',width:'90%',maxWidth:'400px',position:'relative',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}} onClick={e=>e.stopPropagation()}>
             <button onClick={() => setSelectedWordInfo(null)} style={{position:'absolute',top:'16px',right:'16px',background:'transparent',border:'none',cursor:'pointer',color:'#9CA3AF'}}>
                <X size={24} />
             </button>
             
             <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
               <h3 style={{margin:0,fontSize:'24px',fontWeight:'800',color:'#2A3114',textTransform:'capitalize'}}>
                 {selectedWordInfo.word}
               </h3>
               {selectedWordInfo.audioUrl && (
                 <button onClick={() => new Audio(selectedWordInfo.audioUrl!).play()} style={{background:'#F3F4F6',border:'none',borderRadius:'50%',width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#4B5563'}}>
                   <Volume2 size={18} />
                 </button>
               )}
             </div>

             {selectedWordInfo.loading ? (
               <div style={{color:'#6B7280'}}>Đang tra từ...</div>
             ) : selectedWordInfo.error ? (
               <div style={{color:'#EF4444'}}>{selectedWordInfo.error}</div>
             ) : (
               <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {selectedWordInfo.pos && <div style={{background:'#E5E7EB',padding:'4px 8px',borderRadius:'6px',fontSize:'12px',fontWeight:'700',color:'#4B5563',alignSelf:'flex-start'}}>{selectedWordInfo.pos}</div>}
                  {selectedWordInfo.viDef && <div style={{fontSize:'16px',color:'#374151',fontWeight:'600'}}>{selectedWordInfo.viDef}</div>}
                  {selectedWordInfo.example && <div style={{fontSize:'15px',color:'#6B7280',fontStyle:'italic'}}>VD: {selectedWordInfo.example}</div>}

                  <div style={{marginTop:'20px',display:'flex',flexDirection:'column',gap:'8px'}}>
                     <label style={{fontSize:'13px',fontWeight:'700',color:'#4B5563'}}>Lưu vào bộ từ:</label>
                     <select 
                       value={selectedWordInfo.selectedFolderId || ''} 
                       onChange={e => setSelectedWordInfo(prev => ({...prev!, selectedFolderId: e.target.value}))}
                       style={{padding:'10px',borderRadius:'8px',border:'1px solid #E5E7EB',background:'#fff',fontSize:'15px',color:'#374151',outline:'none',cursor:'pointer'}}
                     >
                       <option value="">Không chọn (Tủ từ chung)</option>
                       {folders?.map(f => (
                         <option key={f.id} value={f.id}>{f.name}</option>
                       ))}
                     </select>
                     
                     {selectedWordInfo.saveError && <div style={{color:'#EF4444',fontSize:'13px',fontWeight:'600'}}>{selectedWordInfo.saveError}</div>}
                     
                     <button 
                       onClick={handleSaveWord} 
                       disabled={selectedWordInfo.saving || selectedWordInfo.saved}
                       style={{marginTop:'8px',padding:'12px',borderRadius:'10px',background:selectedWordInfo.saved ? '#10B981' : '#A9B889',color:'#fff',fontWeight:'800',border:'none',cursor:selectedWordInfo.saved ? 'default' : 'pointer',opacity:selectedWordInfo.saving ? 0.7 : 1}}
                     >
                       {selectedWordInfo.saving ? 'Đang lưu...' : selectedWordInfo.saved ? 'Đã lưu ✓' : 'Lưu từ này'}
                     </button>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
