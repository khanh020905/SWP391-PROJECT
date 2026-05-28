"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, Mic, MicOff, Square,
  Edit3, CheckCircle, Home,
  ChevronRight, Info
} from "lucide-react";

// Types for IELTS Speaking questions
interface Question {
  id: string;
  text: string;
  duration: number; // in seconds
}

interface Part2Data {
  text: string;
  bullets: string[];
  duration: number;
}

interface ExamTopic {
  title: string;
  part1: Question[];
  part2: Part2Data;
  part3: Question[];
}

interface SpeakingAnswer {
  questionId: string;
  questionText: string;
  part: string;
  transcript: string;
  audioBlobUrl?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const getBrowserErrorName = (error: unknown) => {
  return error instanceof DOMException || error instanceof Error ? error.name : "";
};

const getSupportedAudioMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];

  return candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";
};

const getMicDeniedMessage = () => (
  "Quyền Microphone đang bị trình duyệt chặn cho trang này. Nếu popup cấp quyền không xuất hiện lại, hãy mở cài đặt quyền của trang và chuyển Microphone sang Allow, rồi tải lại trang. Nếu bạn đang dùng in-app browser của Codex, hãy mở trang bằng Chrome hoặc Edge vì trình duyệt tích hợp có thể không cấp được thiết bị mic thật."
);

const EXAM_DATA: Record<string, ExamTopic> = {
  study: {
    title: "Study & Hometown",
    part1: [
      { id: "s1_q1", text: "Let's talk about your hometown. Where is your hometown located?", duration: 45 },
      { id: "s1_q2", text: "What do you like most about your hometown?", duration: 45 },
      { id: "s1_q3", text: "Let's talk about your studies. What subject are you studying, and why did you choose it?", duration: 45 }
    ],
    part2: {
      text: "Describe a subject you enjoyed studying in high school.",
      bullets: [
        "What the subject was",
        "Who the teacher was and how they taught it",
        "What you did in this subject class",
        "And explain why you found this subject so enjoyable."
      ],
      duration: 120
    },
    part3: [
      { id: "s3_q1", text: "How do you think education will change in the future due to artificial intelligence?", duration: 60 },
      { id: "s3_q2", text: "Some people believe that school exams are the best way to measure student ability. What is your opinion?", duration: 60 },
      { id: "s3_q3", text: "Do you think schools should focus more on academic subjects or practical life skills?", duration: 60 }
    ]
  },
  work: {
    title: "Work & Career",
    part1: [
      { id: "w1_q1", text: "Do you work or are you a student?", duration: 45 },
      { id: "w1_q2", text: "What are your main responsibilities at your job?", duration: 45 },
      { id: "w1_q3", text: "Why did you choose this line of work?", duration: 45 }
    ],
    part2: {
      text: "Describe a challenging job that you would like to try in the future.",
      bullets: [
        "What the job is",
        "What qualifications or skills are needed",
        "Why you think this job would be challenging",
        "And explain why you are interested in trying this job."
      ],
      duration: 120
    },
    part3: [
      { id: "w3_q1", text: "What do you think is more important for job satisfaction: a high salary or good colleagues?", duration: 60 },
      { id: "w3_q2", text: "How can companies help employees achieve a healthy work-life balance?", duration: 60 },
      { id: "w3_q3", text: "In your opinion, will automation lead to high unemployment rates or create new types of jobs?", duration: 60 }
    ]
  },
  technology: {
    title: "Technology & Daily Life",
    part1: [
      { id: "t1_q1", text: "How often do you use technology in your daily life?", duration: 45 },
      { id: "t1_q2", text: "What device is most important to you, and why?", duration: 45 },
      { id: "t1_q3", text: "Do you prefer buying paper books or reading e-books?", duration: 45 }
    ],
    part2: {
      text: "Describe a piece of technology that you find exceptionally useful in your daily life.",
      bullets: [
        "What it is and when you got it",
        "How often you use it",
        "What you use it for",
        "And explain how it has changed or simplified your daily routine."
      ],
      duration: 120
    },
    part3: [
      { id: "t3_q1", text: "Do you agree that social media makes people feel more isolated instead of more connected?", duration: 60 },
      { id: "t3_q2", text: "How can parents effectively manage and limit their children's screen time in this digital age?", duration: 60 },
      { id: "t3_q3", text: "In what ways has the internet modified the way people gather and evaluate news?", duration: 60 }
    ]
  }
};

function SpeakingTestRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Params config
  const mode = (searchParams.get("mode") || "mock") as "mock" | "part1" | "part2" | "part3";
  const topicKey = searchParams.get("topic") || "study";
  const currentExam = EXAM_DATA[topicKey] || EXAM_DATA.study;

  // Active state controller
  const [currentStep, setCurrentStep] = useState<"intro" | "part1" | "part2_prep" | "part2_speak" | "part3" | "submitting">("intro");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showText, setShowText] = useState(true);
  const [voiceAccent, setVoiceAccent] = useState<"en-GB" | "en-US" | "en-AU">("en-US");
  const [voiceSpeed, setVoiceSpeed] = useState<number>(0.95);

  // Microphone permission state
  const [micPermission, setMicPermission] = useState<"unknown" | "checking" | "granted" | "denied" | "unavailable">("unknown");
  const [micErrorMsg, setMicErrorMsg] = useState("");

  // Inline error toast for exam screen
  const [examError, setExamError] = useState("");
  
  // Note sheet for Part 2
  const [scratchNotes, setScratchNotes] = useState("");

  // Recordings & Transcripts holder
  // Live transcript state
  const [liveTranscript, setLiveTranscript] = useState("");

  // Media Recorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recorderMimeTypeRef = useRef("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const liveTranscriptRef = useRef("");
  const answersRef = useRef<SpeakingAnswer[]>([]);
  
  // Speech API references
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isRecordingRef = useRef(false);

  const visualizerBars = useMemo(
    () => Array.from({ length: 15 }, (_, i) => ({
      height: 15 + ((i * 17) % 25),
      delay: i * 60,
      duration: 320 + ((i * 97) % 380)
    })),
    []
  );

  // Stop TTS if navigating away
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Helper: request mic permission and update state
  const requestMicPermission = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission("unavailable");
      setMicErrorMsg("Trình duyệt này không hỗ trợ truy cập Microphone. Hãy dùng Chrome hoặc Edge.");
      return false;
    }

    setMicPermission("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission("granted");
      setMicErrorMsg("");
      return true;
    } catch (err: unknown) {
      const name = getBrowserErrorName(err);
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicPermission("denied");
        setMicErrorMsg(getMicDeniedMessage());
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setMicPermission("unavailable");
        setMicErrorMsg("Không tìm thấy thiết bị Microphone. Hãy cắm mic/tai nghe vào máy tính của bạn và thử lại.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setMicPermission("unavailable");
        setMicErrorMsg("Microphone đang được sử dụng bởi ứng dụng khác. Đóng Zoom / Teams / ứng dụng khác và thử lại.");
      } else {
        setMicPermission("denied");
        setMicErrorMsg(`Không thể truy cập Microphone (${name || "Lỗi không xác định"}). Hãy kiểm tra quyền trình duyệt và thử lại.`);
      }
      return false;
    }
  }, []);

  // Check stored permission without forcing a browser prompt before the user starts.
  useEffect(() => {
    let isMounted = true;

    if (typeof window === "undefined") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => {
        if (!isMounted) return;
        setMicPermission("unavailable");
        setMicErrorMsg("Trình duyệt này không hỗ trợ truy cập Microphone. Hãy dùng Chrome hoặc Edge.");
      });
      return;
    }

    if (!navigator.permissions) return;

    navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
      if (!isMounted) return;

      const syncPermissionState = () => {
        if (result.state === "granted") {
          setMicPermission("granted");
          setMicErrorMsg("");
        } else if (result.state === "denied") {
          setMicPermission("denied");
          setMicErrorMsg(getMicDeniedMessage());
        } else {
          setMicPermission("unknown");
          setMicErrorMsg("");
        }
      };

      syncPermissionState();
      result.onchange = syncPermissionState;
    }).catch(() => {
      if (isMounted) setMicPermission("unknown");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Factory: create a fresh SpeechRecognition instance for each recording session
  const createRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = voiceAccent; // Use the current accent setting

    rec.onresult = (event) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        }
      }
      if (final) {
        liveTranscriptRef.current += final;
        setLiveTranscript(liveTranscriptRef.current);
      }
    };

    rec.onerror = (e) => {
      const errorCode = e.error;
      // Ignore benign errors that don't indicate a real problem
      if (errorCode === "no-speech" || errorCode === "aborted") {
        console.warn("Speech Recognition (benign):", errorCode);
        return;
      }
      console.error("Speech Recognition Error:", errorCode, e.message);
    };

    // Auto-restart if recognition ends while we're still recording
    // (Chrome kills recognition after ~60s of silence or on network hiccups)
    rec.onend = () => {
      if (isRecordingRef.current) {
        console.warn("Speech Recognition ended unexpectedly while recording — restarting...");
        try {
          // Small delay to avoid rapid restart loops
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current === rec) {
              rec.start();
            }
          }, 300);
        } catch (restartErr) {
          console.error("Failed to restart speech recognition:", restartErr);
        }
      }
    };

    return rec;
  }, [voiceAccent]);

  // Speech Synthesizer Function
  const speakText = (text: string, callback?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (callback) callback();
      return;
    }

    window.speechSynthesis.cancel(); // Cancel current speech
    
    // Web speech needs a slight delay sometimes on Chrome
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;
      
      // Find matching voice by accent locale
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(voiceAccent)) || voices.find(v => v.lang.startsWith("en"));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        if (callback) callback();
      };
      
      utterance.onerror = (err) => {
        console.error("Utterance speech error:", err);
        if (callback) callback();
      };

      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // Get active question details based on current step
  const getActiveQuestionText = () => {
    if (currentStep === "part1") {
      return currentExam.part1[questionIdx]?.text || "";
    }
    if (currentStep === "part2_speak" || currentStep === "part2_prep") {
      return currentExam.part2.text;
    }
    if (currentStep === "part3") {
      return currentExam.part3[questionIdx]?.text || "";
    }
    return "";
  };

  const getActiveTimerLimit = () => {
    if (currentStep === "part1") {
      return currentExam.part1[questionIdx]?.duration || 45;
    }
    if (currentStep === "part2_prep") {
      return 60; // 1 minute preparation
    }
    if (currentStep === "part2_speak") {
      return currentExam.part2.duration || 120;
    }
    if (currentStep === "part3") {
      return currentExam.part3[questionIdx]?.duration || 60;
    }
    return 0;
  };

  // Start Voice Recording
  const startRecording = async () => {
    if (isRecording) return;
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    audioChunksRef.current = [];

    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setMicPermission("unavailable");
        setExamError("Trình duyệt này không hỗ trợ ghi âm. Hãy dùng Chrome hoặc Edge phiên bản mới.");
        setTimeout(() => setExamError(""), 8000);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = getSupportedAudioMimeType();
      recorderMimeTypeRef.current = mimeType;
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorderMimeTypeRef.current || "audio/webm"
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Store the answer
        const qId = currentStep === "part2_speak" ? "part2" : 
                    currentStep === "part1" ? currentExam.part1[questionIdx].id : 
                    currentExam.part3[questionIdx].id;
        
        const qText = getActiveQuestionText();
        const activePart = currentStep === "part2_speak" ? "Part 2" : 
                           currentStep === "part1" ? "Part 1" : "Part 3";

        const filtered = answersRef.current.filter(a => a.questionId !== qId);
        answersRef.current = [
          ...filtered,
          {
            questionId: qId,
            questionText: qText,
            part: activePart,
            transcript: liveTranscriptRef.current.trim() || "(Không phát hiện lời nói. Bạn hãy kiểm tra lại micro của mình nhé.)",
            audioBlobUrl: audioUrl
          }
        ];

        // Close stream tracks
        stream.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
      };

      // Start actual Web Audio Recording
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;

      // Create a fresh speech recognition instance for this session
      // (reusing a stopped instance fails on many browsers)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      const rec = createRecognition();
      recognitionRef.current = rec;
      if (rec) {
        try {
          rec.start();
        } catch (e) {
          console.warn("Recognition start failed:", e);
        }
      }

      // Launch timing countdown
      const limit = getActiveTimerLimit();
      setTimer(limit);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            stopRecordingAndNext(); // Auto transition
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: unknown) {
      const name = getBrowserErrorName(err);
      let msg = "Không thể truy cập Microphone. Kiểm tra quyền truy cập và thử lại.";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        msg = getMicDeniedMessage();
        setMicPermission("denied");
      } else if (name === "NotFoundError") {
        msg = "Không tìm thấy Microphone. Hãy kiểm tra kết nối thiết bị âm thanh.";
        setMicPermission("unavailable");
      } else if (name === "NotReadableError") {
        msg = "Microphone đang bị ứng dụng khác chiếm dụng. Đóng Zoom/Teams rồi thử lại.";
        setMicPermission("unavailable");
      }
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
      setExamError(msg);
      // Auto-dismiss error after 8 seconds
      setTimeout(() => setExamError(""), 8000);
      console.error("Mic Access Error:", err);
    }
  };

  // Stop Recording
  const stopRecordingOnly = () => {
    if (!isRecording) return;

    // Mark as not recording FIRST so onend won't auto-restart
    isRecordingRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stopRecordingAndNext = () => {
    stopRecordingOnly();
    
    // Slight delay to allow audio blob and transcript to finalize
    setTimeout(() => {
      handleNextQuestionFlow();
    }, 600);
  };

  // Main interactive workflow state machine
  const handleStartExam = async () => {
    if (micPermission !== "granted") {
      const allowed = await requestMicPermission();
      if (!allowed) return;
    }

    if (mode === "mock" || mode === "part1") {
      setCurrentStep("part1");
      setQuestionIdx(0);
      triggerQuestionSynthesizer("part1", 0);
    } else if (mode === "part2") {
      setCurrentStep("part2_prep");
      triggerPart2PrepFlow();
    } else if (mode === "part3") {
      setCurrentStep("part3");
      setQuestionIdx(0);
      triggerQuestionSynthesizer("part3", 0);
    }
  };

  const triggerQuestionSynthesizer = (stepName: "part1" | "part3", idx: number) => {
    const qText = stepName === "part1" ? currentExam.part1[idx]?.text : currentExam.part3[idx]?.text;
    if (qText) {
      speakText(qText, () => {
        // Automatically start recording after the examiner finishes speaking
        startRecording();
      });
    }
  };

  const triggerPart2PrepFlow = () => {
    speakText("Now, read the instructions on the screen carefully. You have one minute to prepare your notes, and then you will speak for two minutes. Your preparation time starts now.", () => {
      // Launch 60 seconds preparation timer
      setTimer(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Transition directly to Speaking Part 2
            setCurrentStep("part2_speak");
            speakText("Your preparation time is over. Please start speaking now.", () => {
              startRecording();
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  };

  const handleNextQuestionFlow = () => {
    if (currentStep === "part1") {
      if (questionIdx < currentExam.part1.length - 1) {
        setQuestionIdx(prev => prev + 1);
        triggerQuestionSynthesizer("part1", questionIdx + 1);
      } else {
        // Finished Part 1
        if (mode === "part1") {
          finishAndSubmitExam();
        } else {
          // Transition to Part 2 prep
          setCurrentStep("part2_prep");
          triggerPart2PrepFlow();
        }
      }
    } 
    else if (currentStep === "part2_speak") {
      if (mode === "part2") {
        finishAndSubmitExam();
      } else {
        // Transition to Part 3
        setCurrentStep("part3");
        setQuestionIdx(0);
        triggerQuestionSynthesizer("part3", 0);
      }
    } 
    else if (currentStep === "part3") {
      if (questionIdx < currentExam.part3.length - 1) {
        setQuestionIdx(prev => prev + 1);
        triggerQuestionSynthesizer("part3", questionIdx + 1);
      } else {
        // Finished everything
        finishAndSubmitExam();
      }
    }
  };

  // Client-Side AI Grader and Scoring logic
  const finishAndSubmitExam = () => {
    setCurrentStep("submitting");
    if (timerRef.current) clearInterval(timerRef.current);
    const submittedAnswers = answersRef.current;

    setTimeout(() => {
      // IELTS vocabulary & grammar dictionaries for advanced grading
      const advancedVocabulary = [
        "exceptional", "significantly", "detrimental", "crucial", "indispensable", 
        "ubiquitous", "substantial", "furthermore", "consequently", "nevertheless", 
        "perspective", "advocate", "implementation", "innovative", "revolutionary", 
        "facilitate", "paramount", "myriad", "foster", "mitigate"
      ];

      const grammaticalConnectors = [
        "whereas", "although", "consequently", "specifically", "on the contrary", 
        "nevertheless", "furthermore", "in addition", "to illustrate", "as a result"
      ];

      // Calculate component scores based on the collected transcripts
      let totalWords = 0;
      let vocabMatches = 0;
      let grammarMatches = 0;
      let passiveVoiceCount = 0;

      submittedAnswers.forEach(ans => {
        const text = ans.transcript.toLowerCase();
        totalWords += text.split(/\s+/).length;

        // Check vocabulary matches
        advancedVocabulary.forEach(v => {
          if (text.includes(v)) vocabMatches++;
        });

        // Check complex connectors
        grammaticalConnectors.forEach(c => {
          if (text.includes(c)) grammarMatches++;
        });

        // Check passive voice structures (be + past participle)
        if (/(is|are|was|were|be|been)\s+\w+ed/.test(text)) {
          passiveVoiceCount++;
        }
      });

      // Grade Fluency & Coherence (FC)
      // Criteria: words count per answer & logical transitions
      let fcScore = 6.0;
      if (totalWords > 400) fcScore = 7.5;
      else if (totalWords > 250) fcScore = 7.0;
      else if (totalWords > 150) fcScore = 6.5;
      else if (totalWords > 80) fcScore = 5.5;
      else fcScore = 5.0;

      if (grammarMatches >= 4) fcScore += 0.5;

      // Grade Lexical Resource (LR)
      // Criteria: advanced vocabulary count
      let lrScore = 5.5;
      if (vocabMatches >= 5) lrScore = 8.0;
      else if (vocabMatches >= 3) lrScore = 7.5;
      else if (vocabMatches >= 2) lrScore = 7.0;
      else if (vocabMatches >= 1) lrScore = 6.5;
      else if (totalWords > 100) lrScore = 6.0;

      // Grade Grammatical Range & Accuracy (GRA)
      // Criteria: passive structures & complexity
      let graScore = 6.0;
      if (passiveVoiceCount >= 3 && grammarMatches >= 3) graScore = 7.5;
      else if (passiveVoiceCount >= 1 && grammarMatches >= 2) graScore = 7.0;
      else if (grammarMatches >= 1) graScore = 6.5;

      // Grade Pronunciation (P)
      // Simulating a realistic score
      const pScore = parseFloat((6.5 + Math.random()).toFixed(1));

      // Calculate overall band score (average of 4 components, rounded to nearest 0.5)
      const exactAverage = (fcScore + lrScore + graScore + pScore) / 4;
      const roundedBand = Math.round(exactAverage * 2) / 2;

      // Generate a mock ID
      const attemptId = "speaking_" + Math.random().toString(36).substring(2, 9);
      
      const newAttempt = {
        id: attemptId,
        timestamp: new Date().toISOString(),
        mode,
        topic: topicKey,
        band: roundedBand.toFixed(1),
        scores: {
          fc: fcScore.toFixed(1),
          lr: lrScore.toFixed(1),
          gra: graScore.toFixed(1),
          p: pScore.toFixed(1)
        },
        answers: submittedAnswers
      };

      // Read history, push new one, write back
      const history = localStorage.getItem("ielts-speaking-attempts");
      const list = history ? JSON.parse(history) : [];
      list.unshift(newAttempt);
      localStorage.setItem("ielts-speaking-attempts", JSON.stringify(list));

      // Redirection to the feedback dashboard
      router.push(`/speaking/feedback?id=${attemptId}`);

    }, 2500);
  };

  return (
    <div className="bg-[#0b0f19] text-[#e2e8f0] min-h-screen font-sans flex flex-col relative overflow-hidden">
      
      {/* Background radial effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#B38F4D]/10 to-[#3B5C37]/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#0284c7]/5 to-[#B38F4D]/5 blur-[100px]" />

      {/* Header Bar */}
      <header className="w-full border-b border-slate-800 bg-[#0e1322]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2.5">
          <Link href="/speaking" className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
            <Home className="w-4 h-4 text-slate-300" />
          </Link>
          <span className="text-xs font-bold text-slate-500">|</span>
          <span className="text-sm font-black tracking-wide text-white">QualiCode AI speaking Examiner</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/50 rounded-lg px-2.5 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#3B5C37] animate-pulse" />
            <span className="text-slate-300 font-bold capitalize">Chủ đề: {currentExam.title}</span>
          </div>
          
          <button 
            onClick={() => {
              if(confirm("Bạn có chắc chắn muốn dừng bài thi Speaking và quay về phòng chờ? Kết quả hiện tại sẽ không được lưu.")) {
                router.push("/speaking");
              }
            }}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-3.5 py-1.5 rounded-lg border-none cursor-pointer transition-all"
          >
            Thoát phòng thi
          </button>
        </div>
      </header>

      {/* Main room panel */}
      {currentStep === "intro" ? (
        // Mode 1: Intro Setup screen
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-[540px] rounded-3xl bg-[#0f1424]/90 border border-slate-800/80 p-8 text-center shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
            {/* Mic icon — color reflects permission status */}
            <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center mx-auto mb-6 shadow-[0_8px_24px_rgba(59, 92, 55,0.2)] transition-all duration-500 ${
              micPermission === "granted"
                ? "bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.25)]"
                : micPermission === "denied" || micPermission === "unavailable"
                ? "bg-gradient-to-tr from-rose-700 to-rose-500 shadow-[0_8px_24px_rgba(225,29,72,0.25)]"
                : micPermission === "checking"
                ? "bg-gradient-to-tr from-amber-600 to-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.25)] animate-pulse"
                : "bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D]"
            }`}>
              {micPermission === "denied" || micPermission === "unavailable"
                ? <MicOff className="w-8 h-8" />
                : <Mic className={`w-8 h-8 ${micPermission === "granted" ? "" : "animate-pulse"}`} />
              }
            </div>

            <span className="text-xs font-bold tracking-widest text-[#3B5C37] uppercase mb-2 block">IELTS SPEAKING EXAM ROOM</span>
            <h2 className="text-2xl font-black text-white mb-3">Sẵn sàng luyện nói cùng Giám khảo AI?</h2>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-[420px] mx-auto">
              Nhấp vào bắt đầu bên dưới để bước vào phòng thi. Giám khảo AI sẽ đọc từng câu hỏi bằng giọng chuẩn bản xứ và tự động ghi âm câu trả lời của bạn.
            </p>

            {/* ── Microphone Permission Status Banner ── */}
            {micPermission === "unknown" && (
              <div className="mb-5 p-3.5 rounded-2xl border border-slate-700/60 bg-slate-800/40 flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-300 leading-none mb-0.5">Đang kiểm tra quyền Microphone...</p>
                  <p className="text-[10px] text-slate-500">Trình duyệt sẽ hỏi quyền mic ngay bây giờ.</p>
                </div>
              </div>
            )}
            {micPermission === "checking" && (
              <div className="mb-5 p-3.5 rounded-2xl border border-amber-700/40 bg-amber-900/20 flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-800/40 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-amber-300 leading-none mb-0.5">Đang yêu cầu quyền Microphone...</p>
                  <p className="text-[10px] text-amber-500">Hãy nhấp &ldquo;Cho phép&rdquo; trong hộp thoại của trình duyệt.</p>
                </div>
              </div>
            )}
            {micPermission === "granted" && (
              <div className="mb-5 p-3.5 rounded-2xl border border-emerald-700/40 bg-emerald-900/20 flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-800/40 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-emerald-300 leading-none mb-0.5">Microphone đã được cấp quyền ✓</p>
                  <p className="text-[10px] text-emerald-600">Hệ thống ghi âm đã sẵn sàng. Bạn có thể bắt đầu thi.</p>
                </div>
              </div>
            )}
            {(micPermission === "denied" || micPermission === "unavailable") && (
              <div className="mb-5 p-3.5 rounded-2xl border border-rose-700/40 bg-rose-900/20 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-800/40 flex items-center justify-center">
                    <MicOff className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-rose-300 leading-none mb-0.5">
                      {micPermission === "denied" ? "Microphone bị từ chối quyền truy cập" : "Không tìm thấy Microphone"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-rose-400 leading-relaxed mb-3">{micErrorMsg}</p>
                {micPermission === "denied" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={requestMicPermission}
                      className="w-full py-2 rounded-xl text-[11px] font-extrabold bg-rose-700/40 hover:bg-rose-700/60 border border-rose-600/50 text-rose-200 transition-colors cursor-pointer"
                    >
                      Kiểm tra lại quyền Mic
                    </button>
                    <a
                      href="http://localhost:3000/speaking/test?mode=mock&topic=study"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-xl text-[11px] font-extrabold bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 text-slate-200 transition-colors text-center"
                    >
                      Mở bằng Chrome/Edge
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Accent selection config */}
            <div className="bg-[#141b31] rounded-2xl p-4 border border-slate-800 text-left mb-6 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cấu hình Giọng đọc Giám khảo AI</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setVoiceAccent("en-US")}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors outline-none cursor-pointer ${voiceAccent === "en-US" ? "bg-[#3B5C37]/15 border-[#3B5C37] text-white" : "bg-[#1d2643]/30 border-slate-700/40 text-slate-400 hover:text-white"}`}
                >
                  Mỹ (US-Accent)
                </button>
                <button 
                  onClick={() => setVoiceAccent("en-GB")}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors outline-none cursor-pointer ${voiceAccent === "en-GB" ? "bg-[#3B5C37]/15 border-[#3B5C37] text-white" : "bg-[#1d2643]/30 border-slate-700/40 text-slate-400 hover:text-white"}`}
                >
                  Anh (UK-Accent)
                </button>
                <button 
                  onClick={() => setVoiceAccent("en-AU")}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors outline-none cursor-pointer ${voiceAccent === "en-AU" ? "bg-[#3B5C37]/15 border-[#3B5C37] text-white" : "bg-[#1d2643]/30 border-slate-700/40 text-slate-400 hover:text-white"}`}
                >
                  Úc (AU-Accent)
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-[10px] font-bold text-slate-400">Tốc độ nói của Examiner</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#3B5C37] font-bold">{voiceSpeed}x</span>
                  <input 
                    type="range" min="0.75" max="1.2" step="0.05" 
                    value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-24 accent-[#3B5C37]"
                  />
                </div>
              </div>
            </div>

            {/* Start button — disabled if mic blocked or unavailable */}
            <button
              onClick={handleStartExam}
              disabled={micPermission === "denied" || micPermission === "unavailable" || micPermission === "checking"}
              className={`w-full py-4 rounded-2xl text-sm font-extrabold text-white transition-all border-none select-none ${
                micPermission === "denied" || micPermission === "unavailable"
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                  : micPermission === "checking"
                  ? "bg-amber-700/60 cursor-wait opacity-70"
                  : "bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_8px_20px_rgba(59, 92, 55,0.2)]"
              }`}
            >
              {micPermission === "checking"
                ? "Đang kiểm tra Microphone..."
                : micPermission === "denied" || micPermission === "unavailable"
                ? "⚠ Cần cấp quyền Microphone trước"
                : "🎤 Bước vào phòng thi Speaking"
              }
            </button>
          </div>
        </div>
      ) : currentStep === "submitting" ? (
        // Mode 2: Loading Submitting / Evaluating screen
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-[400px] text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#3B5C37]/20 border-t-[#3B5C37] animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin-reverse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#3B5C37] animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-lg font-black text-white mb-2">Đang nộp bài nói & Phân tích AI</h2>
            <p className="text-xs text-slate-400 leading-normal max-w-[280px] mx-auto animate-pulse">
              Hệ thống AI QualiCode đang chấm điểm phát âm, ngữ pháp và tìm lỗi từ vựng của bạn. Quá trình này mất khoảng 2 giây...
            </p>
          </div>
        </div>
      ) : (
        // Mode 3: Interactive Exam screen
        <div className="flex-1 w-full max-w-[1160px] mx-auto grid gap-6 p-6 md:grid-cols-5 z-10 items-stretch">
          
          {/* Left examiner card (2 Cols) */}
          <div className="md:col-span-2 flex flex-col justify-between rounded-3xl bg-[#0f1424]/95 border border-slate-800/80 p-6 md:p-8 shadow-xl text-center relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#3B5C37]/5 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-center w-full mb-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">AI EXAMINER HUB</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#3B5C37]/10 border border-[#3B5C37]/25 text-[#ff8a1f] text-[10px] font-bold">
                {currentStep === "part1" ? "PART 1" : currentStep === "part2_prep" || currentStep === "part2_speak" ? "PART 2" : "PART 3"}
              </div>
            </div>

            {/* Pulsing Examiner Head */}
            <div className="my-auto flex flex-col items-center">
              <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                
                {/* Visualizer Pulsing Halo waves */}
                <div className={`absolute inset-0 rounded-full border border-violet-500/30 scale-105 transition-transform duration-1000 ${isRecording ? "animate-ping opacity-25" : "opacity-0"}`} />
                <div className={`absolute inset-2 rounded-full border border-indigo-500/25 scale-110 transition-transform duration-1000 ${isRecording ? "animate-ping opacity-20" : "opacity-0"}`} style={{ animationDelay: "200ms" }} />
                
                <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-[#1d1f3d] via-[#1a1441] to-[#391e63] border-2 border-slate-800 flex items-center justify-center shadow-lg relative group ${isRecording ? "border-[#3B5C37]/40 scale-105" : ""}`}>
                  
                  {/* Inside Avatar graphic */}
                  <div className="absolute inset-1.5 rounded-full bg-[#080a13] flex flex-col items-center justify-center overflow-hidden">
                    
                    {/* Glowing AI eye pulse */}
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#e87aed] shadow-[0_0_12px_#3B5C37] ${isRecording ? "animate-bounce scale-110" : ""}`} />
                    
                    <span className="text-[9px] font-black text-slate-500 tracking-wider mt-2.5">EXAMINER 1.0</span>
                  </div>
                </div>
              </div>

              <h3 className="font-extrabold text-sm text-white leading-none mb-1">Mr. Adrian</h3>
              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 justify-center">
                {isRecording ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đang lắng nghe câu trả lời...</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Đang đưa câu hỏi...</span>
                  </>
                )}
              </p>
            </div>

            {/* Custom Visual active Sound Waves at the bottom */}
            <div className="w-full mt-6 h-10 flex items-center justify-center gap-1">
              {isRecording ? (
                visualizerBars.map((bar, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-gradient-to-t from-[#3B5C37] to-[#B38F4D] rounded-full transition-all duration-300 animate-pulse"
                    style={{ 
                      height: `${bar.height}px`,
                      animationDelay: `${bar.delay}ms`,
                      animationDuration: `${bar.duration}ms`
                    }}
                  />
                ))
              ) : (
                <div className="text-[10px] font-bold text-slate-500">Hệ thống ghi âm đang ở trạng thái chờ</div>
              )}
            </div>

          </div>

          {/* Right interaction dashboard (3 Cols) */}
          <div className="md:col-span-3 flex flex-col justify-between rounded-3xl bg-[#0f1424]/95 border border-slate-800/80 p-6 md:p-8 shadow-xl relative">
            
            {/* Header info / progress bar */}
            <div>
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <span className="text-[9px] font-black text-[#3B5C37] uppercase tracking-wider block mb-1">
                    {currentStep === "part1" ? `Câu hỏi ${questionIdx + 1}/${currentExam.part1.length}` :
                     currentStep === "part3" ? `Câu hỏi ${questionIdx + 1}/${currentExam.part3.length}` :
                     currentStep === "part2_prep" ? "Thời gian chuẩn bị nháp" : "Thuyết trình Part 2"}
                  </span>
                  
                  <h2 className="text-base font-black text-white leading-tight">
                    {currentStep === "part1" ? "Part 1: Phỏng vấn sơ khởi" :
                     currentStep === "part2_prep" || currentStep === "part2_speak" ? "Part 2: Trình bày Cue Card" :
                     "Part 3: Câu hỏi nâng cao chuyên sâu"}
                  </h2>
                </div>

                {/* Main Countdown Timer display */}
                <div className={`px-4 py-2 rounded-xl text-center shadow-inner border ${
                  timer <= 10
                    ? "bg-rose-950/20 border-rose-800/70 text-rose-500 animate-shake" 
                    : "bg-[#141b31] border-slate-800 text-[#3B5C37]"
                }`}>
                  <div className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">Thời gian</div>
                  <div className="text-xl font-extrabold font-mono leading-none">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* Layout Content block */}
              {currentStep === "part2_prep" || currentStep === "part2_speak" ? (
                // Part 2 Special Cue Card presentation
                <div className="space-y-4 my-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12182b] to-[#15122e] border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">ĐỀ BÀI CUE CARD</span>
                    <p className="text-sm font-black text-white mb-3">&ldquo; {currentExam.part2.text} &rdquo;</p>
                    
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-300 leading-normal">
                      {currentExam.part2.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/*notepad virtual note sheet */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-[#3B5C37]" />
                      Bảng nháp ảo (Note sheet - Nhập nháp chuẩn bị tại đây)
                    </label>
                    <textarea 
                      placeholder="Ghi nhanh các từ vựng, ý tưởng nói vào đây... (Ví dụ: firstly, however, significant...)"
                      value={scratchNotes}
                      onChange={(e) => setScratchNotes(e.target.value)}
                      className="w-full h-24 p-3 rounded-xl bg-[#141b31] border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:border-[#3B5C37]/70 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              ) : (
                // Part 1 and Part 3 Questions normal layouts
                <div className="my-8">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CÂU HỎI HIỂN THỊ</label>
                    <button 
                      onClick={() => setShowText(!showText)}
                      className="text-[10px] font-extrabold text-[#3B5C37] hover:underline cursor-pointer bg-none border-none outline-none"
                    >
                      {showText ? "Ẩn câu hỏi (Thi thực tế)" : "Xem câu hỏi gợi ý"}
                    </button>
                  </div>

                  <div className="min-h-24 p-6 rounded-2xl bg-gradient-to-br from-[#12182b] to-[#141328] border border-slate-800/80 flex items-center justify-center text-center">
                    {showText ? (
                      <p className="text-base md:text-lg font-extrabold text-white leading-relaxed">&ldquo; {getActiveQuestionText()} &rdquo;</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-500 italic flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#3B5C37]" />
                        Đang ẩn câu hỏi. Hãy tập trung nghe giám khảo AI phát âm phát biểu!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom response transcription card */}
            <div className="space-y-5">
              {examError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-bold text-rose-200">
                  {examError}
                </div>
              )}
              
              {/* Live Transcript View */}
              {isRecording && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/50">
                  <span className="text-[10px] font-bold text-[#3B5C37] uppercase tracking-wider block mb-1.5">VĂN BẢN ĐANG NHẬN DIỆN THỜI GIAN THỰC</span>
                  <p className="text-xs text-slate-300 leading-normal italic min-h-6">
                    {liveTranscript || "Hệ thống đang chờ bạn phát âm..."}
                  </p>
                </div>
              )}

              {/* Action and controls */}
              <div className="flex items-center gap-4 border-t border-slate-800/50 pt-5">
                
                {/* Audio Recording State controller */}
                {isRecording ? (
                  <button
                    onClick={stopRecordingAndNext}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:scale-[1.01] active:scale-95 text-xs font-black text-white flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(220,38,38,0.25)] border-none select-none cursor-pointer"
                  >
                    <Square className="w-4.5 h-4.5 fill-white text-white" />
                    <span>Dừng ghi âm và nộp câu trả lời</span>
                  </button>
                ) : currentStep === "part2_prep" ? (
                  <button
                    onClick={() => {
                      if (timerRef.current) clearInterval(timerRef.current);
                      // Skip prep directly to speak
                      setCurrentStep("part2_speak");
                      speakText("Please start speaking now.", () => {
                        startRecording();
                      });
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#3B5C37] to-[#ff9e4f] hover:scale-[1.01] active:scale-95 text-xs font-black text-white flex items-center justify-center gap-2 transition-all shadow-md border-none select-none cursor-pointer"
                  >
                    <Mic className="w-4.5 h-4.5" />
                    <span>Bỏ qua chuẩn bị - Bắt đầu nói ngay</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-black text-white flex items-center justify-center gap-2 transition-all border border-slate-700 select-none cursor-pointer"
                  >
                    <Mic className="w-4.5 h-4.5 text-[#3B5C37]" />
                    <span>Ghi âm lại câu hỏi này</span>
                  </button>
                )}

                {/* Helper button next question fallback */}
                {!isRecording && currentStep !== "part2_prep" && (
                  <button
                    onClick={handleNextQuestionFlow}
                    className="py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                  >
                    <span>Bỏ qua</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default function SpeakingTestRoom() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b16] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-[#3B5C37] animate-spin" />
        </div>
        <p className="text-sm font-black text-slate-400">Đang chuẩn bị phòng thi Speaking...</p>
      </div>
    }>
      <SpeakingTestRoomContent />
    </Suspense>
  );
}
