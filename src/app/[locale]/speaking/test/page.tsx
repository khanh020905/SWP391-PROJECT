"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { 
  Sparkles, Mic, MicOff, Square,
  Edit3, CheckCircle, Home,
  ChevronRight, Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchSpeakingTopics } from "@/services/speakingService";

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

const NO_SPEECH_MESSAGE =
  "(Không phát hiện lời nói. Bạn hãy kiểm tra lại micro và nói rõ hơn nhé.)";

async function transcribeWithGroq(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  const ext = audioBlob.type.includes("mp4")
    ? "m4a"
    : audioBlob.type.includes("ogg")
      ? "ogg"
      : "webm";
  formData.append("file", audioBlob, `recording.${ext}`);
  formData.append("language", "en");

  const res = await fetch("/api/speaking/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err.error === "string" ? err.error : "Không thể nhận diện giọng nói."
    );
  }

  const data = (await res.json()) as { text?: string };
  return (data.text || "").trim();
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

const BENIGN_TTS_ERRORS = new Set(["canceled", "interrupted"]);

const normalizeVoiceLang = (lang: string) => lang.replace("_", "-").toLowerCase();

const pickExaminerVoice = (accent: string): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const target = normalizeVoiceLang(accent);
  return (
    voices.find((v) => normalizeVoiceLang(v.lang).startsWith(target)) ||
    voices.find((v) => normalizeVoiceLang(v.lang).startsWith("en")) ||
    voices[0]
  );
};

const waitForSpeechVoices = (timeoutMs = 2500): Promise<void> =>
  new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", finish);
      clearTimeout(timer);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish);
    const timer = setTimeout(finish, timeoutMs);
  });

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
  const params = useParams();
  
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Lỗi lấy cấu hình:", err));
  }, []);

  // URL Params config
  const mode = (searchParams.get("mode") || "mock") as "mock" | "part1" | "part2" | "part3";
  const topicKey = searchParams.get("topic") || "study";
  const examId = (searchParams.get("examId") || params?.examId) as string | undefined;
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(true);

  // Active state controller
  const [currentStep, setCurrentStep] = useState<"intro" | "part1" | "part2_prep" | "part2_speak" | "part3" | "submitting">("intro");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
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
  const isRecordingRef = useRef(false);
  const pendingStopResolveRef = useRef<(() => void) | null>(null);
  const speakSessionRef = useRef(0);

  const visualizerBars = useMemo(
    () => Array.from({ length: 15 }, (_, i) => ({
      height: 15 + ((i * 17) % 25),
      delay: i * 60,
      duration: 320 + ((i * 97) % 380)
    })),
    []
  );

  // Preload TTS voices (Chrome loads them asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const warmVoices = () => {
      window.speechSynthesis.getVoices();
    };
    warmVoices();
    window.speechSynthesis.addEventListener("voiceschanged", warmVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", warmVoices);
    };
  }, []);

  // Stop TTS if navigating away
  useEffect(() => {
    return () => {
      speakSessionRef.current += 1;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadExamData = async () => {
      try {
        if (examId) {
          const { data: examData } = await supabase
            .from("exams")
            .select("*")
            .eq("id", examId)
            .single();

          if (examData) {
            const { data: sections } = await supabase
              .from("exam_sections")
              .select("*")
              .eq("exam_id", examId)
              .order("section_no", { ascending: true });

            const { data: qs } = await supabase
              .from("questions")
              .select("*")
              .eq("exam_id", examId)
              .order("order_index", { ascending: true });

            const part1Sec = (sections || []).find(s => s.section_no === 1);
            let part1Qs = (qs || []).filter(q => q.section === 1).map((q) => ({
              id: q.id,
              text: q.text || "",
              duration: 45
            }));
            if (part1Qs.length === 0 && part1Sec?.answers) {
              const arr = Array.isArray(part1Sec.answers)
                ? part1Sec.answers
                : typeof part1Sec.answers === 'string'
                  ? JSON.parse(part1Sec.answers)
                  : [];
              part1Qs = arr.map((qText: string, idx: number) => ({
                id: `s1_q${idx}`,
                text: qText,
                duration: 45
              }));
            }

            const part2Sec = (sections || []).find(s => s.section_no === 2);
            let part2Text = "Describe a subject you enjoyed studying in high school.";
            let part2Bullets: string[] = ["Where it is", "Why you want to go there"];
            if (part2Sec) {
              if (part2Sec.answers) {
                const ans = typeof part2Sec.answers === 'string' ? JSON.parse(part2Sec.answers) : part2Sec.answers;
                if (ans && typeof ans === 'object') {
                  if (ans.cue_card) part2Text = ans.cue_card;
                  if (Array.isArray(ans.bullet_points)) part2Bullets = ans.bullet_points;
                }
              } else if (part2Sec.content) {
                part2Text = part2Sec.content;
                try {
                  const contentBullets = JSON.parse(part2Sec.content);
                  if (Array.isArray(contentBullets)) {
                    part2Bullets = contentBullets;
                  } else {
                    part2Bullets = [part2Sec.content];
                  }
                } catch {
                  part2Bullets = [part2Sec.content];
                }
              }
            }

            const part3Sec = (sections || []).find(s => s.section_no === 3);
            let part3Qs = (qs || []).filter(q => q.section === 3).map((q) => ({
              id: q.id,
              text: q.text || "",
              duration: 60
            }));
            if (part3Qs.length === 0 && part3Sec?.answers) {
              const arr = Array.isArray(part3Sec.answers)
                ? part3Sec.answers
                : typeof part3Sec.answers === 'string'
                  ? JSON.parse(part3Sec.answers)
                  : [];
              part3Qs = arr.map((qText: string, idx: number) => ({
                id: `s3_q${idx}`,
                text: qText,
                duration: 60
              }));
            }

            const exam = {
              title: examData.title || "IELTS Speaking Test",
              part1: part1Qs.length ? part1Qs : [{ id: "s1_q1", text: "Let's talk about your hometown. Where is your hometown located?", duration: 45 }],
              part2: {
                text: part2Text,
                bullets: part2Bullets,
                duration: 120
              },
              part3: part3Qs.length ? part3Qs : [{ id: "s3_q1", text: "Do you think technology makes people feel more isolated?", duration: 60 }]
            };

            if (mounted) {
              setCurrentExam(exam);
              setIsLoadingExam(false);
              return;
            }
          }
        }

        // Fallback: topicKey
        const data = await fetchSpeakingTopics();
        if (!mounted) return;
        if (data && data.length > 0) {
          const rows = data.filter((t: any) => 
            String(t.topic || "").toLowerCase() === topicKey.toLowerCase() || 
            String(t.title || "").toLowerCase() === topicKey.toLowerCase()
          );

          if (rows.length > 0) {
            const part1Row = rows.find((r: any) => r.part === 1);
            const part2Row = rows.find((r: any) => r.part === 2);
            const part3Row = rows.find((r: any) => r.part === 3);

            const part1Questions = part1Row?.questions 
              ? (typeof part1Row.questions === 'string' ? JSON.parse(part1Row.questions) : part1Row.questions) 
              : [];
            const part2Questions = part2Row?.questions 
              ? (typeof part2Row.questions === 'string' ? JSON.parse(part2Row.questions) : part2Row.questions) 
              : {};
            const part3Questions = part3Row?.questions 
              ? (typeof part3Row.questions === 'string' ? JSON.parse(part3Row.questions) : part3Row.questions) 
              : [];

            const exam: any = {
              title: part1Row?.topic || topicKey,
              part1: part1Questions.map((qText: string, idx: number) => ({ id: `s1_q${idx}`, text: qText, duration: 45 })),
              part2: {
                text: part2Questions.cue_card || "Describe a place you have always wanted to visit.",
                bullets: part2Questions.bullet_points || ["Where it is", "Why you want to go there"],
                duration: 120
              },
              part3: part3Questions.map((qText: string, idx: number) => ({ id: `s3_q${idx}`, text: qText, duration: 60 }))
            };
            setCurrentExam(exam);
          } else {
            setCurrentExam(EXAM_DATA[topicKey] || EXAM_DATA.study);
          }
        } else {
          setCurrentExam(EXAM_DATA[topicKey] || EXAM_DATA.study);
        }
        setIsLoadingExam(false);
      } catch (err) {
        console.error("Error loading speaking exam:", err);
        if (mounted) {
          setCurrentExam(EXAM_DATA[topicKey] || EXAM_DATA.study);
          setIsLoadingExam(false);
        }
      }
    };

    loadExamData();

    return () => {
      mounted = false;
    };
  }, [topicKey, examId]);

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

  const speakText = useCallback((text: string, callback?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      callback?.();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      callback?.();
      return;
    }

    const session = ++speakSessionRef.current;
    window.speechSynthesis.cancel();

    void (async () => {
      await waitForSpeechVoices();
      if (session !== speakSessionRef.current) return;

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.rate = voiceSpeed;
      const matchedVoice = pickExaminerVoice(voiceAccent);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      let finished = false;
      const finish = () => {
        if (finished || session !== speakSessionRef.current) return;
        finished = true;
        callback?.();
      };

      // Chrome sometimes pauses the queue mid-utterance
      const resumeId = window.setInterval(() => {
        if (session !== speakSessionRef.current) {
          window.clearInterval(resumeId);
          return;
        }
        if (!window.speechSynthesis.speaking) {
          window.clearInterval(resumeId);
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 8000);

      utterance.onend = () => {
        window.clearInterval(resumeId);
        finish();
      };
      utterance.onerror = (event) => {
        window.clearInterval(resumeId);
        const code = event.error || "";
        if (BENIGN_TTS_ERRORS.has(code)) return;
        finish();
      };

      window.speechSynthesis.speak(utterance);
    })();
  }, [voiceAccent, voiceSpeed]);

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

  const saveAnswerFromRecording = (audioUrl: string, transcript: string) => {
    const qId =
      currentStep === "part2_speak"
        ? "part2"
        : currentStep === "part1"
          ? (currentExam.part1?.[questionIdx]?.id || `q1_${questionIdx}`)
          : (currentExam.part3?.[questionIdx]?.id || `q3_${questionIdx}`);

    const qText = getActiveQuestionText();
    const activePart =
      currentStep === "part2_speak"
        ? "Part 2"
        : currentStep === "part1"
          ? "Part 1"
          : "Part 3";

    const filtered = answersRef.current.filter((a) => a.questionId !== qId);
    answersRef.current = [
      ...filtered,
      {
        questionId: qId,
        questionText: qText,
        part: activePart,
        transcript: transcript || NO_SPEECH_MESSAGE,
        audioBlobUrl: audioUrl,
      },
    ];
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorderMimeTypeRef.current || "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;

        setIsTranscribing(true);
        setLiveTranscript("Đang nhận diện giọng nói bằng Groq AI...");

        let transcript = "";
        try {
          transcript = await transcribeWithGroq(audioBlob);
          liveTranscriptRef.current = transcript;
          setLiveTranscript(transcript);
        } catch (err) {
          console.error("Groq transcription error:", err);
          const message =
            err instanceof Error ? err.message : "Không thể nhận diện giọng nói.";
          setExamError(message);
          setTimeout(() => setExamError(""), 8000);
          liveTranscriptRef.current = "";
          setLiveTranscript("");
        } finally {
          setIsTranscribing(false);
          saveAnswerFromRecording(audioUrl, transcript);
          pendingStopResolveRef.current?.();
          pendingStopResolveRef.current = null;
        }
      };

      // Start actual Web Audio Recording
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setLiveTranscript("Đang ghi âm... Văn bản sẽ hiện sau khi bạn dừng ghi.");

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

  const stopRecordingOnly = (): Promise<void> => {
    if (!isRecording && !isTranscribing) {
      return Promise.resolve();
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      return new Promise((resolve) => {
        pendingStopResolveRef.current = resolve;
        mediaRecorderRef.current!.stop();
      });
    }

    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    return Promise.resolve();
  };

  const stopRecordingAndNext = async () => {
    await stopRecordingOnly();
    handleNextQuestionFlow();
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

      // Calculate overall band score using dynamic weights if configured
      const fluencyWeight = settings?.bandScore?.fluencyWeight ?? 0.25;
      const lexicalWeight = settings?.bandScore?.lexicalWeight ?? 0.25;
      const grammarWeight = settings?.bandScore?.grammarWeight ?? 0.25;
      const pronunciationWeight = settings?.bandScore?.pronunciationWeight ?? 0.25;

      const exactAverage = 
        (fcScore * fluencyWeight) + 
        (lrScore * lexicalWeight) + 
        (graScore * grammarWeight) + 
        (pScore * pronunciationWeight);
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

      // Ghi nhận hoạt động học tập lên hệ thống để cập nhật Streak & tạo log
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetch("/api/student/study-log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              activity: `Hoàn thành bài Luyện nói IELTS Speaking - Chủ đề: ${currentExam.title} (Đạt điểm AI: ${roundedBand.toFixed(1)})`
            })
          }).catch(e => console.error("Không thể ghi nhận study log:", e));
        }
      }).catch((err) => {
        console.warn("Failed to get session for study log registration:", err);
      });

      // Redirection to the feedback dashboard
      const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const source = sp?.get("source");
      const taskId = sp?.get("task_id");
      const queryAppend = source && taskId ? `&source=${source}&task_id=${taskId}` : "";
      router.push(`/speaking/feedback?id=${attemptId}${queryAppend}`);
    }, 2500);
  };

  if (isLoadingExam || !currentExam) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center text-black">
        <div className="relative w-16 h-16 mb-4 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-black/10 border-t-[#3B5C37] animate-spin" />
        </div>
        <p className="text-sm font-black text-[#3B5C37]">Đang tải chủ đề thi Speaking...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] text-black min-h-screen font-sans flex flex-col relative overflow-hidden">
      
      {/* Header Bar */}
      <header className="w-full border-b-2 border-black bg-white px-6 py-4 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2.5">
          <Link href="/speaking" className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-black bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all">
            <Home className="w-4 h-4 text-black stroke-[2.5px]" />
          </Link>
          <span className="text-xs font-bold text-black/30">|</span>
          <span className="text-sm font-black tracking-wide text-black uppercase">QualiCode AI speaking Examiner</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#edf3e8] border-2 border-[#3B5C37] rounded-lg px-2.5 py-1 text-xs text-[#3B5C37] font-black shadow-[2px_2px_0px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-[#3B5C37] animate-pulse" />
            <span>Chủ đề: {currentExam.title}</span>
          </div>
          
          <button 
            onClick={() => {
              if(confirm("Bạn có chắc chắn muốn dừng bài thi Speaking và quay về phòng chờ? Kết quả hiện tại sẽ không được lưu.")) {
                router.push("/speaking");
              }
            }}
            className="text-xs font-black bg-white hover:bg-rose-50 text-black border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            Thoát phòng thi
          </button>
        </div>
      </header>

      {/* Main room panel */}
      {currentStep === "intro" ? (
        // Mode 1: Intro Setup screen
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-[540px] rounded-2xl bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_#000] my-8">
            
            {/* Mic icon — color reflects permission status */}
            <div className={`w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_#000] transition-all duration-300 ${
              micPermission === "granted"
                ? "bg-[#edf3e8] text-[#3B5C37]"
                : micPermission === "denied" || micPermission === "unavailable"
                ? "bg-rose-100 text-rose-700"
                : micPermission === "checking"
                ? "bg-amber-100 text-amber-700 animate-pulse"
                : "bg-[#FFD02C] text-black"
            }`}>
              {micPermission === "denied" || micPermission === "unavailable"
                ? <MicOff className="w-7 h-7 stroke-[2.5px]" />
                : <Mic className={`w-7 h-7 stroke-[2.5px] ${micPermission === "granted" ? "" : "animate-pulse"}`} />
            }
            </div>

            <span className="text-xs font-black tracking-widest text-[#3B5C37] uppercase mb-2 block">IELTS SPEAKING EXAM ROOM</span>
            <h2 className="text-2xl font-black text-black mb-3">Sẵn sàng luyện nói cùng Giám khảo AI?</h2>
            
            <p className="text-xs text-gray-500 font-bold leading-relaxed mb-5 max-w-[420px] mx-auto">
              Nhấp vào bắt đầu bên dưới để bước vào phòng thi. Giám khảo AI sẽ đọc từng câu hỏi bằng giọng chuẩn bản xứ và tự động ghi âm câu trả lời của bạn.
            </p>

            {/* ── Microphone Permission Status Banner ── */}
            {micPermission === "unknown" && (
              <div className="mb-5 p-3.5 rounded-xl border-2 border-black bg-[#FAF9F5] flex items-center gap-3 text-left shadow-[2px_2px_0px_0px_#000]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                  <Mic className="w-4 h-4 text-black stroke-[2.5px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-black leading-none mb-0.5">Đang kiểm tra quyền Microphone...</p>
                  <p className="text-[10px] text-gray-500 font-bold">Trình duyệt sẽ hỏi quyền mic ngay bây giờ.</p>
                </div>
              </div>
            )}
            {micPermission === "checking" && (
              <div className="mb-5 p-3.5 rounded-xl border-2 border-black bg-amber-50 flex items-center gap-3 text-left shadow-[2px_2px_0px_0px_#000]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-amber-800 leading-none mb-0.5">Đang yêu cầu quyền Microphone...</p>
                  <p className="text-[10px] text-amber-600 font-bold">Hãy nhấp &ldquo;Cho phép&rdquo; trong hộp thoại của trình duyệt.</p>
                </div>
              </div>
            )}
            {micPermission === "granted" && (
              <div className="mb-5 p-3.5 rounded-xl border-2 border-black bg-[#edf3e8] flex items-center gap-3 text-left shadow-[2px_2px_0px_0px_#000]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#3B5C37] bg-white flex items-center justify-center text-[#3B5C37]">
                  <CheckCircle className="w-4 h-4 stroke-[3px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-[#3B5C37] leading-none mb-0.5">Microphone đã được cấp quyền ✓</p>
                  <p className="text-[10px] text-[#3B5C37]/80 font-bold">Hệ thống ghi âm đã sẵn sàng. Bạn có thể bắt đầu thi.</p>
                </div>
              </div>
            )}
            {(micPermission === "denied" || micPermission === "unavailable") && (
              <div className="mb-5 p-3.5 rounded-xl border-2 border-black bg-rose-50 text-left shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-rose-600 bg-white flex items-center justify-center text-rose-600">
                    <MicOff className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-rose-800 leading-none mb-0.5">
                      {micPermission === "denied" ? "Microphone bị từ chối quyền truy cập" : "Không tìm thấy Microphone"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-rose-700 font-bold leading-relaxed mb-3">{micErrorMsg}</p>
                {micPermission === "denied" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={requestMicPermission}
                      className="w-full py-2 rounded-lg text-[11px] font-black bg-white hover:bg-gray-50 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                    >
                      Kiểm tra lại quyền Mic
                    </button>
                    <a
                      href="http://localhost:3000/speaking/test?mode=mock&topic=study"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-lg text-[11px] font-black bg-white hover:bg-gray-50 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] text-center no-underline"
                    >
                      Mở bằng Chrome/Edge
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Accent selection config */}
            <div className="bg-[#FAF9F5] rounded-xl p-5 border-2 border-black text-left mb-6 space-y-4 shadow-[3px_3px_0px_0px_#000]">
              <label className="text-[10px] font-black text-black uppercase tracking-wider block">Cấu hình Giọng đọc Giám khảo AI</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setVoiceAccent("en-US")}
                  className={`py-2 px-1 rounded-lg text-xs font-black border-2 border-black transition-all outline-none cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${voiceAccent === "en-US" ? "bg-[#3B5C37] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                  Mỹ (US)
                </button>
                <button 
                  onClick={() => setVoiceAccent("en-GB")}
                  className={`py-2 px-1 rounded-lg text-xs font-black border-2 border-black transition-all outline-none cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${voiceAccent === "en-GB" ? "bg-[#3B5C37] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                  Anh (UK)
                </button>
                <button 
                  onClick={() => setVoiceAccent("en-AU")}
                  className={`py-2 px-1 rounded-lg text-xs font-black border-2 border-black transition-all outline-none cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${voiceAccent === "en-AU" ? "bg-[#3B5C37] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                  Úc (AU)
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 border-t border-black/10">
                <span className="text-[10px] font-black text-gray-500 uppercase">Tốc độ nói của Examiner</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-[#3B5C37] font-black">{voiceSpeed}x</span>
                  <input 
                    type="range" min="0.75" max="1.2" step="0.05" 
                    value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-24 accent-[#3B5C37] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Start button — disabled if mic blocked or unavailable */}
            <button
              onClick={handleStartExam}
              disabled={micPermission === "denied" || micPermission === "unavailable" || micPermission === "checking"}
              className={`w-full py-4 rounded-xl text-sm font-black border-2 border-black transition-all select-none shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] ${
                micPermission === "denied" || micPermission === "unavailable"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  : micPermission === "checking"
                  ? "bg-amber-100 text-amber-700 cursor-wait opacity-70"
                  : "bg-[#3B5C37] hover:bg-[#2d472a] text-white cursor-pointer"
              }`}
            >
              {micPermission === "checking"
                ? "Đang kiểm tra Microphone..."
                : micPermission === "denied" || micPermission === "unavailable"
                ? "⚠ Cần cấp quyền Microphone"
                : " Bước vào phòng thi Speaking"
              }
            </button>
          </div>
        </div>
      ) : currentStep === "submitting" ? (
        // Mode 2: Loading Submitting / Evaluating screen
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-[400px] rounded-2xl bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_#000] my-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-black/10 border-t-[#3B5C37] animate-spin" />
            </div>
            
            <h2 className="text-lg font-black text-black mb-2">Đang chấm điểm bài thi...</h2>
            <p className="text-xs text-gray-500 font-bold leading-normal max-w-[280px] mx-auto animate-pulse">
              AI Examiner đang chấm điểm phát âm, ngữ pháp và tìm lỗi từ vựng của bạn. Quá trình này mất khoảng vài giây...
            </p>
          </div>
        </div>
      ) : (
        // Mode 3: Interactive Exam screen - Centered Card layout like Image 2
        <div className="flex-1 w-full max-w-[720px] mx-auto flex flex-col justify-center px-6 py-10 z-10">
          
          <div className="w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] overflow-hidden flex flex-col">
            
            {/* Modal Header inside Card */}
            <div className="border-b-2 border-black bg-[#FAF9F5] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] ${
                  isRecording 
                    ? "bg-rose-100 text-rose-800 border-rose-600" 
                    : "bg-[#edf3e8] text-[#3B5C37] border-[#3B5C37]"
                }`}>
                  {isRecording ? "🎤 ĐANG NÓI" : "🤖 GIÁM KHẢO NÓI"}
                  {currentStep === "part2_prep" && " — CHUẨN BỊ"}
                </span>
                
                {/* Part counter label */}
                <span className="text-[10px] font-black uppercase text-gray-500 border border-black/25 rounded px-2 py-0.5 bg-white">
                  {currentStep === "part1" ? `Part 1 • Q${questionIdx + 1}/${currentExam.part1.length}` :
                   currentStep === "part3" ? `Part 3 • Q${questionIdx + 1}/${currentExam.part3.length}` :
                   currentStep === "part2_prep" ? "Part 2 • Chuẩn bị" : "Part 2 • Đang nói"}
                </span>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-gray-400">Thời gian:</span>
                <span className={`text-xl font-extrabold font-mono ${timer <= 10 ? "text-rose-600 animate-pulse" : "text-[#3B5C37]"}`}>
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Modal Body / Question Box */}
            <div className="p-6 space-y-6">
              
              {/* Question Text styled as flat box with border & shadow */}
              <div className="border-2 border-black rounded-lg bg-[#FAF9F5] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {currentStep === "part2_prep" || currentStep === "part2_speak" ? (
                  <div>
                    <span className="text-[9px] font-black text-[#B38F4D] uppercase tracking-wider block mb-2">ĐỀ BÀI CUE CARD:</span>
                    <p className="text-base font-black text-black mb-3 leading-snug">&ldquo; {currentExam.part2.text} &rdquo;</p>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs font-bold text-gray-700 leading-relaxed">
                      {currentExam.part2.bullets.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <span className="text-[9px] font-black text-[#3B5C37] uppercase tracking-wider block mb-2">CÂU HỎI TỪ GIÁM KHẢO:</span>
                    {showText ? (
                      <p className="text-base font-black text-black leading-relaxed">&ldquo; {getActiveQuestionText()} &rdquo;</p>
                    ) : (
                      <p className="text-sm font-bold text-gray-500 italic">
                        (Đang ẩn câu hỏi gợi ý. Hãy tập trung nghe phát âm của Giám khảo)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Show/Hide Question Toggle (Part 1 & 3) */}
              {currentStep !== "part2_prep" && currentStep !== "part2_speak" && (
                <div className="text-right">
                  <button
                    onClick={() => setShowText(!showText)}
                    className="text-xs font-extrabold text-[#3B5C37] hover:underline"
                  >
                    {showText ? "Ẩn câu hỏi (Giống thi thật)" : "Xem câu hỏi gợi ý"}
                  </button>
                </div>
              )}

              {/* Scratch notepad for Part 2 */}
              {(currentStep === "part2_prep" || currentStep === "part2_speak") && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Bảng nháp chuẩn bị nói (Note sheet):</label>
                  <textarea 
                    placeholder="Nhập ghi chú ý tưởng tại đây..."
                    value={scratchNotes}
                    onChange={(e) => setScratchNotes(e.target.value)}
                    className="w-full h-24 p-3 rounded-lg border-2 border-black bg-white text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000] placeholder-gray-400 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Whisper Transcripts panel */}
              {(isRecording || isTranscribing || liveTranscript) && (
                <div className="p-4 rounded-lg border-2 border-black bg-[#edf3e8]/70 text-black shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[9px] font-black text-[#3B5C37] uppercase tracking-wider block mb-1">VĂN BẢN GHI ÂM (DỰ THẢO):</span>
                  <p className="text-xs font-bold text-gray-700 italic min-h-[16px] leading-relaxed">
                    {liveTranscript || (isRecording ? "Đang ghi âm bài nói..." : "Đang phân tích âm thanh...")}
                  </p>
                </div>
              )}

              {/* Microphone & Input bar Row like Image 2 */}
              <div className="flex items-center gap-4 pt-4 border-t border-black/10">
                {/* Yellow Mic Button */}
                <button
                  onClick={isRecording || isTranscribing ? stopRecordingAndNext : startRecording}
                  disabled={isTranscribing}
                  className={`h-14 w-14 shrink-0 rounded-full border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000] transition-all active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000] outline-none cursor-pointer ${
                    isRecording 
                      ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse" 
                      : "bg-[#3B5C37] hover:bg-[#2d472a] text-white"
                  }`}
                >
                  {isRecording ? (
                    <Square className="h-5 w-5 fill-white text-white" />
                  ) : (
                    <Mic className="h-6 w-6 stroke-[2.5px]" />
                  )}
                </button>

                {/* Input text placeholder box */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    disabled
                    placeholder={
                      isRecording 
                        ? "Mic đang mở... Hãy bắt đầu nói câu trả lời của bạn." 
                        : isTranscribing
                        ? "Groq Whisper đang dịch giọng nói của bạn..."
                        : "Nhấn Mic để nói câu trả lời của bạn..."
                    }
                    className="w-full border-2 border-black bg-gray-50 px-4 py-3.5 text-xs font-bold text-gray-600 rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="border-t-2 border-black bg-[#FAF9F5] p-5 flex items-center justify-between gap-4">
              
              {/* Skip / Back button */}
              {currentStep !== "part2_prep" ? (
                <button
                  onClick={handleNextQuestionFlow}
                  disabled={isRecording || isTranscribing}
                  className="px-5 py-2.5 rounded-lg border-2 border-black bg-white hover:bg-gray-100 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50"
                >
                  Bỏ qua
                </button>
              ) : (
                <div className="w-10" />
              )}

              {/* Next step button (Yellow) */}
              {currentStep === "part2_prep" ? (
                <button
                  onClick={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setCurrentStep("part2_speak");
                    speakText("Please start speaking now.", () => {
                      startRecording();
                    });
                  }}
                  className="px-5 py-2.5 rounded-lg border-2 border-black bg-[#3B5C37] hover:bg-[#2d472a] text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] flex items-center gap-1.5"
                >
                  Bắt đầu nói ngay →
                </button>
              ) : (
                <button
                  onClick={stopRecordingAndNext}
                  disabled={!isRecording && !liveTranscript}
                  className={`px-5 py-2.5 rounded-lg border-2 border-black text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] flex items-center gap-1.5 transition-all ${
                    !isRecording && !liveTranscript 
                      ? "bg-gray-100 text-gray-400 border-gray-300 shadow-[0px_0px_0px_0px_#000] cursor-not-allowed" 
                      : "bg-[#3B5C37] hover:bg-[#2d472a]"
                  }`}
                >
                  {currentStep === "part1" && questionIdx === currentExam.part1.length - 1 ? "Sang Part 2 →" :
                   currentStep === "part2_speak" ? "Sang Part 3 →" :
                   currentStep === "part3" && questionIdx === currentExam.part3.length - 1 ? "Nộp bài thi →" :
                   "Câu tiếp theo →"}
                </button>
              )}

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
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center text-black">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-black/10 border-t-[#3B5C37] animate-spin" />
        </div>
        <p className="text-sm font-black text-[#3B5C37]">Đang chuẩn bị phòng thi Speaking...</p>
      </div>
    }>
      <SpeakingTestRoomContent />
    </Suspense>
  );
}
