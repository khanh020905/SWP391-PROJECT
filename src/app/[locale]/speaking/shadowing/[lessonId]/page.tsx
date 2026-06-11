"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import "./player.css";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Play, Pause, Mic, SkipBack, SkipForward,
  Settings, CheckCircle2, RotateCcw, Volume2,
  ExternalLink, Subtitles, ListStart, 
  Eye, Type, XCircle, Search, Plus, Check
} from "lucide-react";
import { useSaveVocab } from "@/hooks/useSaveVocab";
import { Link } from "@/i18n/navigation";

// Types
interface Subtitle {
  id: number;
  text: string;
  ipa: string;
  start_time: number;
  duration: number;
  vietnamese_text: string | null;
}

interface VideoData {
  id: string;
  youtube_id: string;
  title: string;
  segments: number;
}

export default function ShadowingPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const lessonId = params.lessonId as string;
  const isSaved = searchParams.get("saved") === "true";
  const isCommunity = searchParams.get("community") === "true";
  const isCustom = searchParams.get("custom") === "true";
  const yid = searchParams.get("yid");

  const [video, setVideo] = useState<VideoData | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Modals state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [savedProgressIdx, setSavedProgressIdx] = useState(0);
  const [savedResults, setSavedResults] = useState<Record<number, any>>({});

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // --- NEW UI STATES ---
  const [mode, setMode] = useState<"shadowing" | "dictation">("shadowing");
  const [showIpa, setShowIpa] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showWordClick, setShowWordClick] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true); // video subtitles UI toggle
  const [playbackRate, setPlaybackRate] = useState(1);
  const [dictPos, setDictPos] = useState(0);
  const [wrongLetterIdx, setWrongLetterIdx] = useState(-1);
  const [revealedHints, setRevealedHints] = useState<Record<number, number>>({});
  const [showDictationAnswer, setShowDictationAnswer] = useState(false);
  const [wordDetails, setWordDetails] = useState<{
    word: string;
    translation?: string;
    ipa?: string;
    definition?: string;
    example?: string;
    audio?: string;
  } | null>(null);
  const [dictCompleted, setDictCompleted] = useState<Record<number, boolean>>({});

  const { collections, isSaved: isVocabSaved, saveWord, isLoading: isVocabLoading } = useSaveVocab();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isSavingVocab, setIsSavingVocab] = useState(false);
  const [vocabToast, setVocabToast] = useState<{ message: string; type: 'success' | 'error' | 'warning', showLink?: boolean } | null>(null);

  const showVocabToast = (message: string, type: 'success' | 'error' | 'warning', showLink = false) => {
    setVocabToast({ message, type, showLink });
    setTimeout(() => setVocabToast(null), 4000);
  };

  const handleSaveVocab = async () => {
    if (!wordDetails || !wordDetails.word) return;

    setIsSavingVocab(true);
    const result = await saveWord({
      word: wordDetails.word,
      ipa: wordDetails.ipa,
      definition: wordDetails.definition || '',
      translation: wordDetails.translation || '',
      exampleSentence: wordDetails.example,
      partOfSpeech: 'noun'
    }, selectedCollection || null);
    setIsSavingVocab(false);

    if (result === 'saved') {
      showVocabToast(`Đã lưu '${wordDetails.word}' vào sổ từ vựng`, 'success', true);
    } else if (result === 'duplicate') {
      showVocabToast('Từ này đã có trong sổ từ vựng', 'warning', true);
    } else {
      showVocabToast('Lỗi khi lưu từ vựng', 'error');
    }
  };

  const parsedDictation = React.useMemo(() => {
    const text = subtitles[currentIdx]?.text || "";
    const words: any[] = [];
    let currentWordChars: any[] = [];
    const letters: any[] = [];
    let letterIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char.match(/\s/)) {
        if (currentWordChars.length > 0) {
          words.push({ isSpace: false, chars: currentWordChars });
          currentWordChars = [];
        }
        words.push({ isSpace: true, chars: [{ raw: char, isLetter: false, letterIndex: -1 }] });
      } else {
        const isLetter = /[a-z0-9À-ỹ]/i.test(char);
        const lIdx = isLetter ? letterIndex++ : -1;
        const charObj = { raw: char, isLetter, letterIndex: lIdx };
        currentWordChars.push(charObj);
        if (isLetter) {
          letters.push({ char: char.toLowerCase(), raw: char, index: lIdx });
        }
      }
    }
    if (currentWordChars.length > 0) {
      words.push({ isSpace: false, chars: currentWordChars });
    }

    return { words, totalLetters: letters.length, letters };
  }, [subtitles, currentIdx]);

  const handleWordClick = async (word: string) => {
    try {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (!cleanWord) return;
      
      setWordDetails({ word: cleanWord, definition: "Loading..." });

      const [dictRes, transRes] = await Promise.all([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`).catch(() => null),
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`).catch(() => null)
      ]);

      let ipa = "", definition = "", example = "", audio = "";
      let translation = "";

      if (dictRes && dictRes.ok) {
        const dictData = await dictRes.json();
        if (dictData && dictData.length > 0) {
          const entry = dictData[0];
          ipa = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || "";
          audio = (entry.phonetics && entry.phonetics.find((p: any) => p.audio)?.audio) || "";
          const meaning = entry.meanings?.[0];
          if (meaning) {
            const def = meaning.definitions?.[0];
            if (def) {
              definition = def.definition;
              example = def.example || "";
            }
          }
        }
      }

      if (transRes && transRes.ok) {
        const transData = await transRes.json();
        if (transData.responseData?.translatedText) {
          translation = transData.responseData.translatedText;
        }
      }

      setWordDetails({ word: cleanWord, translation, ipa, definition, example, audio });
    } catch (e) {
      console.warn("Word details fetch failed", e);
      setWordDetails(null);
    }
  };

  const handleDictWordClick = (wordObj: any, wordIndex: number) => {
    if (!wordObj || wordObj.isSpace || wordObj.chars.length === 0) return;
    
    // Trigger the dictionary translation popup
    const wordStr = wordObj.chars.map((c: any) => c.raw).join('');
    handleWordClick(wordStr);

    // Find first and last valid letter indices in this word
    const letterChars = wordObj.chars.filter((c: any) => c.isLetter);
    if (letterChars.length === 0) return;
    
    const firstLetterIdx = letterChars[0].letterIndex;
    const lastLetterIdx = letterChars[letterChars.length - 1].letterIndex;
    
    setDictPos(currentPos => {
      let nextPos = currentPos;
      if (currentPos <= firstLetterIdx) {
        // Cursor is before or at the start of the word -> reveal first letter
        nextPos = firstLetterIdx + 1;
      } else if (currentPos <= lastLetterIdx) {
        // Cursor is mid-word -> reveal whole word
        nextPos = lastLetterIdx + 1;
      }
      
      if (nextPos >= parsedDictation.totalLetters && currentPos < parsedDictation.totalLetters) {
        setDictCompleted(d => ({ ...d, [currentIdx]: true }));
        playCompletionSound();
      }
      return nextPos;
    });
  };

  useEffect(() => {
    setDictPos(0);
    setWrongLetterIdx(-1);
    setShowDictationAnswer(false);
    setRecordingResult(null);
  }, [currentIdx]);

  const playCompletionSound = () => {
    if (typeof window === "undefined" || !(window as any).AudioContext) return;
    try {
      const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + startTime);
        osc.stop(audioCtx.currentTime + startTime + duration);
      };

      // C5 E5 G5 C6 (Mario fanfare)
      playNote(523.25, 0, 0.18);
      playNote(659.25, 0.13, 0.18);
      playNote(783.99, 0.26, 0.18);
      playNote(1046.50, 0.39, 0.4);
    } catch (e) {
      console.warn("Audio API failed", e);
    }
  };

  useEffect(() => {
    loadData();
    initSpeechRecognition();
    if (lessonId) {
      try {
        const results = JSON.parse(localStorage.getItem(`shadowing_results_${lessonId}`) || '{}');
        setSavedResults(results);
      } catch (e) {}
    }
  }, [lessonId]);

  const initSpeechRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              interimTranscriptRef.current += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
        };
        recognitionRef.current = recognition;
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Await getUser to ensure the session is restored from local storage
      // Otherwise the query might fire as anonymous and get blocked by RLS
      await supabase.auth.getUser();
      
      console.log("loadData started. lessonId:", lessonId, "isSaved:", isSaved, "isCustom:", isCustom, "isCommunity:", isCommunity);
      if (isCustom) {
        // Load from local storage
        const localData = localStorage.getItem(`custom_lesson_${lessonId}`);
        if (localData) {
          try {
            const segs = JSON.parse(localData);
            setSubtitles(segs);
            setVideo({
              id: lessonId,
              youtube_id: lessonId,
              title: `Custom Video ${lessonId}`,
              segments: segs.length
            });
          } catch(e) {
            console.error("Local data parse error", e);
          }
        }
      } else if (isSaved || isCommunity) {
        // Load from Supabase by UUID with retry loop for read-after-write lag
        let vData = null;
        let sData = null;
        let lastError = null;
        
        for (let attempt = 0; attempt < 4; attempt++) {
          const vRes = await supabase.from("shadowing_videos").select("*").eq("id", lessonId).single();
          vData = vRes.data;
          if (vRes.error) lastError = vRes.error;
          
          if (vData) {
            const sRes = await supabase.from("shadowing_subtitles").select("*").eq("video_id", lessonId).order("start_time", { ascending: true });
            sData = sRes.data;
            if (sData && sData.length > 0) break;
          }
          
          // Wait 500ms before retrying
          if (attempt < 3) await new Promise(r => setTimeout(r, 500));
        }
        
        if (lastError && !vData) {
          // Supabase fetch failed due to replication lag or RLS, but we will use yid fallback
          // @ts-ignore
          window.__lastSupabaseError = lastError;
        }
        console.log("Supabase fetched:", vData, "sData length:", sData?.length);
        
        if (vData) setVideo(vData);
        
        if (sData && sData.length > 0) {
          setSubtitles(sData);
        } else if (vData && vData.youtube_id) {
          const localData = localStorage.getItem(`custom_lesson_${vData.youtube_id}`);
          if (localData) {
            try {
              setSubtitles(JSON.parse(localData));
            } catch(e) { }
          }
        } else if (yid) {
          // Ultimate fallback using URL param if replication lag is extreme
          const localData = localStorage.getItem(`custom_lesson_${yid}`);
          if (localData) {
            try {
              setSubtitles(JSON.parse(localData));
              setVideo({ id: lessonId, youtube_id: yid, title: "Video của bạn", is_custom: true, user_id: "" } as any);
            } catch(e) { }
          }
        }
      } else {
        // Load by youtube_id
        const { data: vData } = await supabase.from("shadowing_videos").select("*").eq("youtube_id", lessonId).single();
        const { data: sData } = await supabase.from("shadowing_subtitles").select("*").eq("video_id", vData?.id).order("start_time", { ascending: true });
        if (vData) setVideo(vData);
        if (sData) setSubtitles(sData);
      }

    } catch (error) {
      console.error("Failed to load lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check progress
    const progress = localStorage.getItem(`shadowing_progress_${lessonId}`);
    if (progress && !loading) {
      const { currentIdx: savedIdx } = JSON.parse(progress);
      if (savedIdx > 0) {
        setSavedProgressIdx(savedIdx);
        setShowProgressModal(true);
      }
    }
  }, [loading, lessonId]);

  // Auto-translation
  useEffect(() => {
    const sub = subtitles[currentIdx];
    if (sub && !sub.vietnamese_text) {
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sub.text)}&langpair=en|vi`)
        .then(r => r.json())
        .then(d => {
          if (d.responseData?.translatedText) {
            const newText = d.responseData.translatedText;
            setSubtitles(prev => prev.map((s, i) => i === currentIdx ? { ...s, vietnamese_text: newText } : s));
            
            if (isSaved || isCommunity) {
              supabase.from("shadowing_subtitles").update({ vietnamese_text: newText }).eq("id", sub.id).then();
            } else if (isCustom) {
              const localData = localStorage.getItem(`custom_lesson_${lessonId}`);
              if (localData) {
                const parsed = JSON.parse(localData);
                parsed[currentIdx].vietnamese_text = newText;
                localStorage.setItem(`custom_lesson_${lessonId}`, JSON.stringify(parsed));
              }
            }
          }
        })
        .catch(e => console.warn("Auto-translation failed", e));
    }
  }, [currentIdx, subtitles, isSaved, isCommunity, isCustom, lessonId]);

  // History Debounce
  const historyTimeoutRef = useRef<any>(null);
  const hasPostedHistoryRef = useRef(false);
  useEffect(() => {
    if (loading || subtitles.length === 0) return;
    
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    
    historyTimeoutRef.current = setTimeout(() => {
      const method = hasPostedHistoryRef.current ? "PATCH" : "POST";
      fetch("/api/history", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          type: "shadowing",
          progress: Math.round(((currentIdx + 1) / subtitles.length) * 100)
        })
      })
      .then(() => { hasPostedHistoryRef.current = true; })
      .catch(e => console.warn("Failed to save history", e));
    }, 3000);
  }, [currentIdx, subtitles, isSaved, isCommunity, isCustom, lessonId]);
    
  const nextSentence = () => {
    if (currentIdx < subtitles.length - 1) {
      setCurrentIdx(c => c + 1);
      const sub = subtitles[currentIdx + 1];
      if (playerRef.current && sub) {
        playerRef.current.seekTo(sub.start_time);
        playerRef.current.playVideo();
      }
    }
  };

  const prevSentence = () => {
    if (currentIdx > 0) {
      setCurrentIdx(c => c - 1);
      const sub = subtitles[currentIdx - 1];
      if (playerRef.current && sub) {
        playerRef.current.seekTo(sub.start_time);
        playerRef.current.playVideo();
      }
    }
  };

  const replayCurrent = () => {
    const sub = subtitles[currentIdx];
    if (playerRef.current && sub) {
      playerRef.current.seekTo(sub.start_time);
      playerRef.current.playVideo();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          const formData = new FormData();
          formData.append('audio', blob, 'audio.webm');
          
          try {
            const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
            const data = await res.json();
            const finalTranscript = data.text || interimTranscriptRef.current;
            evaluatePronunciation(finalTranscript, subtitles[currentIdx]?.text || "", audioUrl);
          } catch (e) {
            evaluatePronunciation(interimTranscriptRef.current, subtitles[currentIdx]?.text || "", audioUrl);
          }
        };
      } else {
        evaluatePronunciation(interimTranscriptRef.current, subtitles[currentIdx]?.text || "");
      }
    } else {
      setIsRecording(true);
      setRecordingResult(null);
      interimTranscriptRef.current = "";
      if (recognitionRef.current) recognitionRef.current.start();
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.start();
        mediaRecorderRef.current = mr;
      } catch(e) {
        console.error("Mic error", e);
      }
    }
  };

  const evaluatePronunciation = (spoken: string, target: string, audioUrl?: string) => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(Boolean);
    const spokenWords = normalize(spoken);
    const targetWords = normalize(target);
    
    const memo = Array(spokenWords.length + 1).fill(0).map(() => Array(targetWords.length + 1).fill(0));
    for (let i = 1; i <= spokenWords.length; i++) {
      for (let j = 1; j <= targetWords.length; j++) {
        if (spokenWords[i-1] === targetWords[j-1]) {
          memo[i][j] = memo[i-1][j-1] + 1;
        } else {
          memo[i][j] = Math.max(memo[i-1][j], memo[i][j-1]);
        }
      }
    }
    const matched = memo[spokenWords.length][targetWords.length];
    const score = targetWords.length ? Math.round((matched / targetWords.length) * 100) : 0;
    
    const wordResults = targetWords.map(tw => ({ word: tw, correct: spokenWords.includes(tw) }));
    const result = { score, wordResults, spokenText: spoken, audioUrl };
    
    setRecordingResult(result);
    if (lessonId) {
      const results = JSON.parse(localStorage.getItem(`shadowing_results_${lessonId}`) || '{}');
      results[currentIdx] = result;
      localStorage.setItem(`shadowing_results_${lessonId}`, JSON.stringify(results));
      setSavedResults(results);
    }
  };

  const shadowKeyHandlerRef = useRef<any>(null);
  const dictKeyHandlerRef = useRef<any>(null);

  // Update refs every render to prevent stale closures
  shadowKeyHandlerRef.current = (e: KeyboardEvent) => {
    if (e.key === "Tab") { e.preventDefault(); replayCurrent(); }
    if (e.key === "Enter") { e.preventDefault(); nextSentence(); }
    if (e.key === "Control" || e.key === "Meta") { e.preventDefault(); prevSentence(); }
  };

  dictKeyHandlerRef.current = (e: any) => {
    // Navigation keys work in both modes
    if (e.key === "Tab") { e.preventDefault(); replayCurrent(); return; }
    if (e.key === "Enter") { e.preventDefault(); nextSentence(); return; }
    if (e.key === "Control" || e.key === "Meta") { e.preventDefault(); prevSentence(); return; }
    
    // Ignore meta keys and modifiers
    if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
    if (e.key === " ") { e.preventDefault(); return; } // Space is suppressed
    if (dictPos >= parsedDictation.totalLetters) return; // Done

    const targetChar = parsedDictation.letters[dictPos].char;
    if (e.key.toLowerCase() === targetChar) {
      setDictPos(prev => {
        const next = prev + 1;
        if (next >= parsedDictation.totalLetters) {
          setDictCompleted(d => ({ ...d, [currentIdx]: true }));
          playCompletionSound();
        }
        return next;
      });
      setWrongLetterIdx(-1);
    } else {
      setWrongLetterIdx(dictPos);
      setTimeout(() => setWrongLetterIdx(-1), 400);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (mode === "shadowing") {
        shadowKeyHandlerRef.current?.(e);
      } else {
        dictKeyHandlerRef.current?.(e);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [mode]);

  useEffect(() => {
    if (!video || subtitles.length === 0) return;
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
    
    function initPlayer() {
      if (playerRef.current) return;
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: video?.youtube_id,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: any) => {
            if (subtitles[currentIdx]) e.target.seekTo(subtitles[currentIdx].start_time);
            e.target.setPlaybackRate(playbackRate);
            const vData = e.target.getVideoData();
            if (vData && vData.title) {
              setVideo(prev => prev ? { ...prev, title: vData.title } : null);
            }
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
          }
        }
      });
    }
  }, [video, subtitles]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (!playerRef.current || subtitles.length === 0) return;
        const sub = subtitles[currentIdx];
        if (!sub) return;
        
        const currentTime = playerRef.current.getCurrentTime();
        const endTime = sub.start_time + sub.duration;
        
        if (currentTime >= endTime) {
          playerRef.current.pauseVideo();
          playerRef.current.seekTo(sub.start_time);
        }
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentIdx, subtitles]);

  useEffect(() => {
    const sub = subtitles[currentIdx];
    if (sub && !sub.vietnamese_text && !isCustom) {
      const cleanText = sub.text.replace(/[^\w\s.,?!]/g, '');
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|vi`)
        .then(res => res.json())
        .then(data => {
          if (data.responseData?.translatedText) {
            const viText = data.responseData.translatedText;
            setSubtitles(prev => prev.map((s, i) => i === currentIdx ? { ...s, vietnamese_text: viText } : s));
            supabase.from('shadowing_subtitles').update({ vietnamese_text: viText }).eq('id', sub.id).then();
          }
        })
        .catch(console.warn);
    }
  }, [currentIdx, subtitles, isCustom]);

  if (loading || subtitles.length === 0) return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-white">
       {loading ? (
         <>
           <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b824a] border-t-transparent mb-4"></div>
           <p>Đang tải dữ liệu...</p>
         </>
       ) : (
         <div className="text-left p-6 bg-red-900/20 rounded-xl border border-red-500/30 max-w-2xl overflow-auto text-xs">
           <h3 className="text-xl font-bold text-red-400 mb-2">Lỗi tải dữ liệu</h3>
           <p className="text-gray-300 mb-4">Không thể tải phụ đề cho video này.</p>
           <pre className="text-gray-400 mb-4 whitespace-pre-wrap">
{JSON.stringify({
  lessonId,
  isSaved,
  isCustom,
  isCommunity,
  vDataExists: !!video,
  vDataId: video?.id,
  vDataYoutubeId: video?.youtube_id,
  subLength: subtitles.length,
  localDataExists: video?.youtube_id ? !!localStorage.getItem(`custom_lesson_${video.youtube_id}`) : false
}, null, 2)}
           </pre>
           <button onClick={() => router.back()} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Quay lại</button>
         </div>
       )}
    </div>
  );

return (
    <div className={`shadowing-app app night ${mode === 'dictation' ? 'dict-mode' : ''}`}>
      {/* ============ TOP BAR ============ */}
      <header className="topbar">
        <div className="tb-left">
          <button className="icon-btn" aria-label="Back" onClick={() => router.back()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <button className="icon-btn star" aria-label="Favorite">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"></polygon></svg>
          </button>
          <span className="level-badge">C1</span>
          <span className="tb-title">{video?.title || "Loading..."}</span>
        </div>

        <div className="seg seg-glow" id="modeSeg">
          <button className={mode === "shadowing" ? "active" : ""} onClick={() => setMode("shadowing")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"></path></svg>
            Shadowing
          </button>
          <button className={mode === "dictation" ? "active" : ""} onClick={() => setMode("dictation")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"></path><path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"></path></svg>
            Dictation
          </button>
        </div>

        <div className="tb-right" style={{ display: 'flex', gap: '8px' }}>
          <button className="theme-toggle" id="themeToggle" title="Sáng / Tối" aria-label="Chuyển sáng tối" onClick={() => {
            document.querySelector('.shadowing-app')?.classList.toggle('night');
          }}>
            <span className="t-icon t-sun">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle className="core" cx="12" cy="12" r="4.4" fill="currentColor" stroke="none"></circle>
                <g className="rays">
                  <line x1="12" y1="1.5" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22.5"></line>
                  <line x1="1.5" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22.5" y2="12"></line>
                  <line x1="4.4" y1="4.4" x2="6.2" y2="6.2"></line><line x1="17.8" y1="17.8" x2="19.6" y2="19.6"></line>
                  <line x1="4.4" y1="19.6" x2="6.2" y2="17.8"></line><line x1="17.8" y1="6.2" x2="19.6" y2="4.4"></line>
                </g>
              </svg>
            </span>
            <span className="t-icon t-moon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"></path>
              </svg>
            </span>
          </button>
          
          <button className="theme-toggle flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" id="fullScreenToggle" title="Toàn màn hình" aria-label="Toàn màn hình" onClick={toggleFullScreen}>
            <span style={{ display: 'grid', placeItems: 'center', position: 'absolute', width: '24px', height: '24px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </span>
          </button>
        </div>
      </header>

      {/* ============ BODY ============ */}
      <div className="body" id="bodyRow">
        {/* ===== LEFT: video + sub ===== */}
        <aside className="side" style={{ flexBasis: '560px' }}>
            {/* VIDEO */}
            <div className="video">
              <div className="fallback"><div className="big">{video?.title || "Loading..."}</div></div>
              <div id="youtube-player" className="absolute inset-0 z-10"></div>
              {showSubtitles && (
                <div className="v-overlay pointer-events-none z-20">
                  <div className="absolute top-4 left-4 flex items-center gap-3">
                    <div className="bbc-logo">BBC<br />LEARNING<br />ENGLISH</div>
                    <div className="v-titleblock">
                      <div className="vt">{video?.title}</div>
                      <div className="vs">BBC Learning English</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          {/* ===== SUB LIST ===== */}
            <div className="side-pad">
              <div className="side-tabs" id="sideTabs">
                <button className="side-tab active" onClick={() => setShowSubtitles(!showSubtitles)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M3 12h18M3 19h12"></path></svg>
                  Phụ đề
                  {!showSubtitles && <svg className="deco" width="16" height="16" viewBox="0 0 24 24" aria-hidden={true}><circle cx="12" cy="12" r="10" fill="#E8554E"></circle><line x1="8" y1="8" x2="16" y2="16" stroke="white" strokeWidth="2"></line></svg>}
                </button>
                <div className="speeds" id="speeds">
                  {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
                    <button key={rate} className={playbackRate === rate ? "active" : ""} onClick={() => {
                      setPlaybackRate(rate);
                      if (playerRef.current) playerRef.current.setPlaybackRate(rate);
                    }}>{rate}x</button>
                  ))}
                </div>
              </div>

              <div className="prog-sticky">
                <div className="prog-head">
                  <span className="cnt" id="dictCount">{Object.keys(dictCompleted).length}/{subtitles.length}</span>
                  <div className="show-toggle">
                    Hiện
                    <div className="switch" id="showSwitch"></div>
                  </div>
                </div>
                <div className="pbar-wrap">
                  <div className="pbar"><div style={{ width: `${(currentIdx / Math.max(1, subtitles.length - 1)) * 100}%` }}></div></div>
                  <div className="road-tree" style={{left: '16%'}}></div>
                  <div className="road-cloud" style={{left: '30%'}}></div>
                  <div className="road-qblock" style={{left: '48%'}}></div>
                  <div className="road-tree" style={{left: '64%'}}></div>
                  <div className="road-bush" style={{left: '80%'}}></div>
                  <div className="goal-door"></div>
                  <div className="mario-say" id="marioSay" style={{left: `${(currentIdx / Math.max(1, subtitles.length - 1)) * 100}%`}}>{Math.round((currentIdx / Math.max(1, subtitles.length - 1)) * 100)}%</div>
                  <div className="dino" id="dinoSide" style={{left: `${(currentIdx / Math.max(1, subtitles.length - 1)) * 100}%`}}></div>
                </div>
              </div>

              <div className="slist" id="slist">
                {subtitles.map((sub, idx) => {
                  const isActive = idx === currentIdx;
                  const shouldHideText = mode === 'dictation' && !dictCompleted[idx] && !showDictationAnswer;
                  const displayText = shouldHideText ? '••••••••••' : sub.text;
                  const score = savedResults[idx]?.score;

                  return isActive ? (
                    <div key={sub.id} className="sitem active">
                      <div className="achead">
                        <div className="radio"><span className="ic"></span></div>
                        <span className="snum">#{idx + 1}</span>
                        {score !== undefined && (
                          <span className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-md ${score > 80 ? 'bg-green-500/20 text-green-400' : score > 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {score}%
                          </span>
                        )}
                        <span className="badge-learn">ĐANG HỌC</span>
                        <div className="ac-actions">
                          <button className="icon-btn" onClick={replayCurrent}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
                        </div>
                      </div>
                      <div className="stext">{displayText}</div>
                    </div>
                  ) : (
                    <div key={sub.id} className={`sitem ${dictCompleted[idx] ? 'revealed' : ''}`} onClick={() => {
                      if (mode === 'dictation') return;
                      setCurrentIdx(idx);
                      if (playerRef.current) {
                        playerRef.current.seekTo(sub.start_time);
                        playerRef.current.playVideo();
                      }
                    }}>
                      <div className="radio"></div>
                      <div>
                        <div className="flex items-center">
                          <div className="snum">#{idx + 1}</div>
                          {score !== undefined && (
                            <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${score > 80 ? 'bg-green-500/20 text-green-400' : score > 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                              {score}%
                            </span>
                          )}
                        </div>
                        <div className="stext">{displayText}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </aside>

        {/* ===== SPLITTER ===== */}
        <div className="splitter" id="splitter" role="separator" aria-orientation="vertical" title="Kéo để chỉnh">
          <span className="grip"></span>
        </div>

        {/* ===== RIGHT: INTERACTION ===== */}
        <main className="main">
          <div className="main-inner">

          {mode === "shadowing" ? (
          <>
          <div id="shadowView">
            {/* SENTENCE CARD */}
            <div className="scard">
              <svg className="deco deco-abs" style={{left: '-9px', top: '-11px', animation: 'decobob 4s ease-in-out infinite'}} width="26" height="26" viewBox="0 0 24 24" aria-hidden={true}><path d="M12 1c.5 5.5 5 10 10.5 10.5C17 12 12.5 16.5 12 22c-.5-5.5-5-10-10.5-10.5C7 11 11.5 6.5 12 1z" fill="#E9B53A"></path></svg>
              <div className="scard-tools">
                <span className="hint-item hint-tap" id="hintTranslate">
                  <span className="hint-emoji">👀</span>
                  Click the word to translate
                </span>
                <span className="tsep">|</span>
                <button className={`stool ${showIpa ? 'on' : ''}`} onClick={() => setShowIpa(!showIpa)}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 10v4"></path></svg>
                  IPA
                </button>
                <span className="tsep">|</span>
                <button className={`stool ${showTranslation ? 'on' : ''}`} onClick={() => setShowTranslation(!showTranslation)}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h10M9 3v2M11 5c0 4-3 7-7 8M7 9c0 2.5 3 4.5 6 5"></path><path d="M14 21l4-9 4 9M15.5 17h5"></path></svg>
                  Dịch nghĩa
                </button>
              </div>
              <p className="sentence" id="sentence">
                {subtitles[currentIdx]?.text.split(/\s+/).map((word, i) => {
                  let isCorrect = undefined;
                  if (recordingResult && recordingResult.wordResults) {
                    const clean = word.toLowerCase().replace(/[^\w]/g, '');
                    const match = recordingResult.wordResults.find((w: any) => w.word.toLowerCase().replace(/[^\w]/g, '') === clean);
                    if (match) isCorrect = match.correct;
                  }
                  return (
                    <span key={i} onClick={() => handleWordClick(word)} className={`w ${isCorrect === true ? 'text-green-600' : isCorrect === false ? 'text-red-500' : ''}`}>
                      {word}{" "}
                    </span>
                  );
                })}
              </p>
              
              {showIpa && <div className="ipa" id="ipaLine">{subtitles[currentIdx]?.ipa}</div>}
              {showTranslation && (
                <div className="vi-trans" id="viTrans">
                  <span className="tool-lbl"><span className="tl-dot"></span>Dịch nghĩa</span>
                  {subtitles[currentIdx]?.vietnamese_text}
                </div>
              )}
              
              {recordingResult && (
                <div className="mt-8 p-4 bg-[var(--olive-soft)] rounded-xl border border-[var(--olive-300)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[var(--olive-700)]">Độ chính xác</span>
                    <span className={`text-lg font-black ${recordingResult.score > 80 ? 'text-green-600' : recordingResult.score > 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {recordingResult.score}%
                    </span>
                  </div>
                  <div className="text-[15px] font-medium text-gray-600 mb-3">
                    <span className="font-bold text-gray-400">Bạn đã nói: </span>
                    {recordingResult.spokenText || "(Không nhận diện được giọng nói)"}
                  </div>
                  {recordingResult.audioUrl && (
                    <audio src={recordingResult.audioUrl} controls className="w-full h-10 rounded-lg outline-none" />
                  )}
                </div>
              )}
            </div>

            {/* RECORD */}
            <button className={`record ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
              <span className="mic">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"></path></svg>
              </span>
              <span className="rtxt">
                <span className="rt1">{isRecording ? "Đang ghi âm..." : "Click to start "}</span>
                {!isRecording && <span className="rt2">🤜🤛</span>}
              </span>
            </button>

            {/* WORD BLOCKS */}
            <div className="wblocks" id="wblocks">
              {subtitles[currentIdx]?.text.replace(/[.,]/g, '').split(' ').map((w, i) => (
                <div key={i} className="wb" onClick={(e) => e.currentTarget.classList.toggle('revealed')}>
                  <span className="blurw">{w}</span>
                </div>
              ))}
            </div>

            {/* PLAYBACK */}
            <div className="playback">
              <button className="pb3d pb-prev" onClick={prevSentence}>
                <span className="pbico"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5l-10 7 10 7V5z"></path></svg></span>
                <span className="pl">Câu trước</span>
                <kbd>Ctrl</kbd>
              </button>
              <button className="pb3d pb-rep" onClick={replayCurrent}>
                <span className="pbico"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg></span>
                <span className="pl">Nghe lại</span>
                <kbd>Tab</kbd>
              </button>
              <button className="pb3d pb-next" onClick={nextSentence}>
                <span className="pbico"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 5h2v14h-2zM4 5l10 7-10 7V5z"></path></svg></span>
                <span className="pl">Câu sau</span>
                <kbd>Enter</kbd>
              </button>
            </div>

          </div>
          </>
          ) : (
          <>
          {/* ===== DICTATION VIEW ===== */}
          <div id="dictView">
            <div className={`dict-card ${showDictationAnswer ? 'done' : ''}`} id="dictCard">
              <svg className="deco deco-abs" style={{right: '-8px', top: '-12px', animation: 'decobob 4.5s ease-in-out infinite'}} width="26" height="26" viewBox="0 0 24 24" aria-hidden={true}><path d="M12 1c.5 5.5 5 10 10.5 10.5C17 12 12.5 16.5 12 22c-.5-5.5-5-10-10.5-10.5C7 11 11.5 6.5 12 1z" fill="#E9B53A"></path></svg>
              <div className="dict-head">
                <span className="hint-emoji">✍️</span>
                Type what you hear
                <span className="dict-stat">{dictPos} / {parsedDictation.totalLetters}</span>
              </div>
              
              <div className="dict-sentence">
                {parsedDictation.words.map((word, wIdx) => {
                  if (word.isSpace) return <span key={wIdx} className="dspace"> </span>;
                  return (
                    <span key={wIdx} className="dword2" onClick={() => handleDictWordClick(word, wIdx)}>
                      {word.chars.map((c: any, cIdx: number) => {
                        let cls = "dchar ";
                        if (c.isLetter) {
                          cls += "letter ";
                          if (c.letterIndex < dictPos) cls += "shown";
                          else if (c.letterIndex === dictPos) cls += (wrongLetterIdx === dictPos) ? "wrong" : "cursor";
                        } else {
                          cls += "punct";
                        }
                        return <span key={cIdx} className={cls.trim()}>{c.raw}</span>;
                      })}
                    </span>
                  );
                })}
              </div>

              <div className="dbox-row">
                {parsedDictation.words.map((word, wIdx) => {
                  if (word.isSpace) return <div key={wIdx} className="dbox space" />;
                  return word.chars.map((c: any, cIdx: number) => {
                    if (!c.isLetter) return null;
                    let content = "·";
                    let cls = "dbox";
                    if (c.letterIndex < dictPos) {
                      content = c.raw;
                      cls += " filled pop";
                    } else if (c.letterIndex === dictPos) {
                      cls += " current";
                      if (wrongLetterIdx === dictPos) cls += " wrong";
                    }
                    return <div key={`${wIdx}-${cIdx}`} className={cls}>{content}</div>;
                  });
                })}
              </div>

              {showDictationAnswer && (
                <div className="mb-6 p-4 bg-[var(--olive-soft)] text-[var(--olive-700)] rounded-xl text-lg font-bold border border-[var(--olive-300)]">
                  <span className="text-gray-500 font-bold mr-2">Đáp án:</span>
                  {subtitles[currentIdx]?.text.split(/\s+/).map((word, i) => (
                    <span key={i} onClick={() => handleWordClick(word)} className="cursor-pointer hover:text-green-700 transition-colors">
                      {word}{" "}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="dict-bar-wrap mt-8">
                <div className="dict-bar"><div style={{width: `${Math.min(100, (dictPos / Math.max(1, parsedDictation.totalLetters)) * 100)}%`}}></div></div>
                <div className="road-cloud" style={{left: '20%'}}></div>
                <div className="road-cloud" style={{left: '66%'}}></div>
                <div className="road-qblock" style={{left: '46%'}}></div>
                <div className="road-tree" style={{left: '24%'}}></div>
                <div className="road-tree" style={{left: '64%'}}></div>
                <div className="road-bush" style={{left: '9%'}}></div>
                <div className="road-bush" style={{left: '82%'}}></div>
                <div className="flagpole"></div>
                <div className={`dino ${(dictPos >= parsedDictation.totalLetters) ? 'cheer' : ''}`} id="dinoDict" style={{left: `${Math.min(100, (dictPos / Math.max(1, parsedDictation.totalLetters)) * 100)}%`}}></div>
                {(dictPos >= parsedDictation.totalLetters) && <div className="yoohoo show" style={{left: '100%'}}>yoo hoo! 🇻🇳</div>}
              </div>
              <div className="dict-actions mt-4">
                <button className="dbtn" onClick={() => setShowDictationAnswer(true)}><span className="be">👀</span> Hiện đáp án</button>
                <button className="dbtn" onClick={() => {
                  setDictPos(0);
                  setWrongLetterIdx(-1);
                  setShowDictationAnswer(false);
                }}><span className="be">↻</span> Làm lại</button>
              </div>
            </div>

            {/* PLAYBACK (shared nav) */}
            <div className="playback">
              <button className="pb3d pb-prev" onClick={prevSentence}>
                <span className="pbico"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5l-10 7 10 7V5z"></path></svg></span>
                <span className="pl">Câu trước</span>
                <kbd>Ctrl</kbd>
              </button>
              <button className="pb3d pb-rep" onClick={replayCurrent}>
                <span className="pbico"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg></span>
                <span className="pl">Nghe lại</span>
                <kbd>Tab</kbd>
              </button>
              <button className="pb3d pb-next" onClick={nextSentence}>
                <span className="pbico"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 5h2v14h-2zM4 5l10 7-10 7V5z"></path></svg></span>
                <span className="pl">Câu sau</span>
                <kbd>Enter</kbd>
              </button>
            </div>
          </div>
          </>
          )}

          </div>
        </main>
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200" style={{color: 'black'}}>
            <h2 className="text-[22px] font-black mb-2">Tiếp tục bài học?</h2>
            <p className="text-gray-500 mb-8 font-medium">Bạn đang học dở bài này. Bạn có muốn tiếp tục từ vị trí đã lưu?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  localStorage.setItem(`shadowing_progress_${lessonId}`, JSON.stringify({ currentIdx: 0 }));
                }}
                className="flex-1 px-4 py-3.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] rounded-xl font-bold transition-colors"
              >
                Học lại từ đầu
              </button>
              <button
                onClick={() => {
                  setCurrentIdx(savedProgressIdx);
                  setShowProgressModal(false);
                  const sub = subtitles[savedProgressIdx];
                  if (playerRef.current && sub) {
                    playerRef.current.seekTo(sub.start_time);
                    playerRef.current.playVideo();
                  }
                }}
                className="flex-1 px-4 py-3.5 bg-[#7a8f5a] hover:bg-[#687a4c] text-white rounded-xl font-bold transition-colors"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Text Area Popup (Globally Available) */}
      {wordDetails && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-5 py-5 rounded-2xl z-[9999] shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-w-sm w-[90vw] border border-gray-700 pointer-events-auto">
          <button onClick={(e) => { e.stopPropagation(); setWordDetails(null); }} className="absolute top-3 right-3 text-gray-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div className="flex items-center mb-3 pr-6">
            <span className="font-black text-xl text-[#E9B53A]">{wordDetails.word}</span>
            <button onClick={(e) => { 
              e.stopPropagation(); 
              if (wordDetails.audio) {
                new Audio(wordDetails.audio).play(); 
              } else {
                const utterance = new SpeechSynthesisUtterance(wordDetails.word);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
              }
            }} className="ml-2 text-blue-400 hover:text-blue-300 bg-blue-400/10 p-1.5 rounded-full transition-colors" title="Nghe phát âm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07l1.41 1.41a7 7 0 0 0 0-9.9l-1.41 1.42zM19.07 4.93a10 10 0 0 1 0 14.14l1.41 1.41a12 12 0 0 0 0-16.97l-1.41 1.42z"/></svg>
            </button>
            {wordDetails.ipa && <span className="text-gray-400 font-mono text-sm ml-3">{wordDetails.ipa}</span>}
          </div>
          {wordDetails.definition === "Loading..." ? (
              <div className="text-gray-400 italic">Đang tải...</div>
          ) : (
            <div className="flex flex-col gap-2 mt-2 text-left">
              {wordDetails.definition && (
                <div className="text-gray-200 leading-snug whitespace-normal text-[15px]">
                  <span className="font-bold text-gray-400 text-xs uppercase mr-1">Def:</span>
                  {wordDetails.definition}
                </div>
              )}
              {wordDetails.example && (
                <div className="text-gray-400 italic leading-snug mt-1 whitespace-normal text-[14px]">
                  <span className="font-bold text-gray-500 text-xs uppercase mr-1">Ex:</span>
                  "{wordDetails.example}"
                </div>
              )}
              {wordDetails.translation && (
                <div className="text-green-400 font-bold mt-1 whitespace-normal text-[15px]">
                  <span className="text-gray-400 text-xs uppercase mr-1">Vi:</span>
                  {wordDetails.translation}
                </div>
              )}
              {(!wordDetails.definition && !wordDetails.translation) && (
                <div className="text-gray-400 italic">Không tìm thấy dữ liệu.</div>
              )}
            </div>
          )}

          {/* VOCAB SAVE PANEL */}
          {wordDetails.definition !== "Loading..." && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              {isVocabSaved(wordDetails.word) ? (
                <div className="flex items-center justify-center gap-2 text-green-500 font-bold py-2 bg-green-500/10 rounded-lg">
                  <Check size={16} /> Đã có trong sổ
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-medium">Lưu vào collection:</label>
                    <select 
                      className="w-full bg-[#111] border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 transition-colors"
                      value={selectedCollection}
                      onChange={e => setSelectedCollection(e.target.value)}
                      disabled={isVocabLoading}
                    >
                      <option value="">-- Mặc định (Tất cả) --</option>
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={handleSaveVocab}
                    disabled={isSavingVocab}
                    className="w-full py-2 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingVocab ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <><Plus size={16} /> Lưu vào sổ từ vựng</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Local Toast */}
      {vocabToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg z-[10000] flex items-center gap-3 animate-in slide-in-from-bottom-5 text-sm font-medium border
          ${vocabToast.type === 'success' ? 'bg-green-900/90 text-green-100 border-green-800' : 
            vocabToast.type === 'warning' ? 'bg-yellow-900/90 text-yellow-100 border-yellow-800' : 
            'bg-red-900/90 text-red-100 border-red-800'}
        `}>
          {vocabToast.type === 'success' ? <Check size={16} className="text-green-400" /> : <CheckCircle2 size={16} className="text-yellow-400" />}
          <span>{vocabToast.message}</span>
          {vocabToast.showLink && (
            <Link href="/vocab-grammar" className="ml-2 text-white hover:underline flex items-center gap-0.5 whitespace-nowrap bg-white/10 px-2 py-1 rounded-md transition-colors">
              Xem sổ ➔
            </Link>
          )}
        </div>
      )}


    </div>
  );
}
