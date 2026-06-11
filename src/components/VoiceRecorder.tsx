"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, RotateCcw, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  initialValue?: string;
  maxDurationSeconds?: number;
}

export default function VoiceRecorder({
  onTranscription,
  initialValue = "",
  maxDurationSeconds = 120,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState(initialValue);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial value if it changes
  useEffect(() => {
    if (initialValue && !transcript) {
      setTranscript(initialValue);
    }
  }, [initialValue]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStreamsAndTimers();
    };
  }, []);

  const stopStreamsAndTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const checkMicPermission = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission("denied");
      setErrorMsg("Trình duyệt không hỗ trợ ghi âm. Hãy sử dụng Chrome hoặc Edge.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      setErrorMsg("");
      return true;
    } catch (err: any) {
      setMicPermission("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Quyền truy cập Microphone đã bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.");
      } else {
        setErrorMsg("Không tìm thấy Microphone hoặc thiết bị đang bận. Hãy kiểm tra kết nối.");
      }
      return false;
    }
  };

  const startRecording = async () => {
    setErrorMsg("");
    const hasPermission = await checkMicPermission();
    if (!hasPermission) return;

    audioChunksRef.current = [];
    setElapsedTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= maxDurationSeconds - 1) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Lỗi khi bắt đầu ghi âm:", err);
      setErrorMsg("Không thể bắt đầu ghi âm. Vui lòng thử lại.");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    stopStreamsAndTimers();
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token || "";

      const formData = new FormData();
      const ext = audioBlob.type.includes("mp4")
        ? "m4a"
        : audioBlob.type.includes("ogg")
          ? "ogg"
          : "webm";

      formData.append("file", audioBlob, `recording.${ext}`);

      const response = await fetch("/api/student/speech-to-text", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Lỗi chuyển đổi giọng nói thành văn bản.");
      }

      const data = await response.json();
      const text = data.text || data.transcript || "";
      setTranscript(text);
      onTranscription(text);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Lỗi khi chuyển đổi file ghi âm sang văn bản. Vui lòng thử nói lại.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    onTranscription("");
    setElapsedTime(0);
    setErrorMsg("");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="border border-slate-100 rounded-3xl bg-slate-50/35 p-6 shadow-sm flex flex-col items-center justify-center space-y-5 relative overflow-hidden transition-all duration-300">
      {/* Background Subtle Effects */}
      {isRecording && (
        <div className="absolute inset-0 bg-pink-500/5 animate-pulse pointer-events-none" />
      )}

      {/* Timer / Progress */}
      <div className="flex flex-col items-center space-y-1">
        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
          Thời gian thu âm (Tối đa {formatTime(maxDurationSeconds)})
        </span>
        <span className={`text-2xl font-black transition-colors ${isRecording ? "text-pink-600 animate-pulse" : "text-slate-700"}`}>
          {formatTime(elapsedTime)}
        </span>
      </div>

      {/* Soundwave Simulation during Recording */}
      {isRecording && (
        <div className="flex items-center gap-1 h-8 justify-center my-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-pink-500 to-[#B38F4D] rounded-full animate-bounce"
              style={{
                height: `${Math.max(15, Math.sin(i * 0.5) * 32)}px`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 z-10">
        {!isRecording ? (
          <>
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-[#B38F4D] text-white text-xs font-black shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>{transcript ? "Thu âm lại" : "Bắt đầu nói"}</span>
            </button>

            {transcript && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isTranscribing}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all flex items-center justify-center cursor-pointer"
                title="Xóa bản thu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Hoàn thành & Dịch văn bản</span>
          </button>
        )}
      </div>

      {/* Errors & Notifications */}
      {errorMsg && (
        <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-2xl border border-red-100 flex items-center gap-1.5 max-w-md text-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Transcription Loader */}
      {isTranscribing && (
        <div className="flex flex-col items-center space-y-2 py-4">
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
          <span className="text-[11px] text-slate-400 font-bold animate-pulse">
            AI đang chuyển đổi giọng nói thành văn bản...
          </span>
        </div>
      )}

      {/* Transcribed text box preview */}
      {transcript && !isTranscribing && (
        <div className="w-full text-left space-y-2 border border-emerald-100 bg-emerald-50/5 p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Bản ghi nhận diện bởi AI:
          </span>
          <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
            "{transcript}"
          </p>
        </div>
      )}
    </div>
  );
}
