"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Send,
  Upload,
  X,
  Music,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface Section {
  section_no: number;
  title: string;
  content: string;
  answers: string; // JSON string in textarea, e.g. {"1":"A","2":"castle"...}
}

interface ExamFormData {
  title: string;
  description: string;
  cambridge_no: string;
  test_no: string;
  status: "draft" | "published";
  audio_url: string;
  sections: Section[];
}

interface ExamFormProps {
  initialData?: Partial<ExamFormData> & { id?: string };
  mode: "create" | "edit";
}

const defaultSections = (): Section[] =>
  [1, 2, 3, 4].map((n) => ({
    section_no: n,
    title: `Section ${n}`,
    content: "",
    answers: "",
  }));

export default function ExamForm({ initialData, mode }: ExamFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<ExamFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    cambridge_no: initialData?.cambridge_no?.toString() || "",
    test_no: initialData?.test_no?.toString() || "",
    status: initialData?.status || "draft",
    audio_url: initialData?.audio_url || "",
    sections: (initialData?.sections as Section[]) || defaultSections(),
  });

  const [expandedSection, setExpandedSection] = useState<number | null>(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>(initialData?.audio_url || "");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Audio Upload ──────────────────────────────────────────────────────────
  const handleAudioFile = useCallback(async (file: File) => {
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
    const allowedExts = /\.(mp3|wav|ogg|m4a|aac)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExts.test(file.name)) {
      setErrors((p) => ({ ...p, audio: "File phải là định dạng audio: MP3, WAV, OGG, M4A, AAC" }));
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setErrors((p) => ({ ...p, audio: "File không được vượt quá 200MB" }));
      return;
    }

    setErrors((p) => ({ ...p, audio: "" }));
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));

    // Upload immediately
    setIsUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/exams/upload-audio", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, audio_url: data.url }));
        showToast("success", "Upload audio thành công!");
      } else {
        setErrors((p) => ({ ...p, audio: data.error || "Upload thất bại" }));
        setAudioPreviewUrl("");
        setAudioFile(null);
      }
    } catch {
      setErrors((p) => ({ ...p, audio: "Lỗi kết nối khi upload" }));
    } finally {
      setIsUploadingAudio(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleAudioFile(file);
    },
    [handleAudioFile]
  );

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioPreviewUrl("");
    setIsAudioPlaying(false);
    setForm((prev) => ({ ...prev, audio_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Section Editing ───────────────────────────────────────────────────────
  const updateSection = (idx: number, field: keyof Section, value: string) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx], [field]: value };
      return { ...prev, sections };
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Tiêu đề đề thi là bắt buộc";
    if (form.cambridge_no && isNaN(parseInt(form.cambridge_no)))
      newErrors.cambridge_no = "Phải là số nguyên";
    if (form.test_no && isNaN(parseInt(form.test_no)))
      newErrors.test_no = "Phải là số nguyên";

    // Validate answers JSON
    form.sections.forEach((s, i) => {
      if (s.answers.trim()) {
        try {
          JSON.parse(s.answers);
        } catch {
          newErrors[`section_${i}_answers`] = `Section ${s.section_no}: JSON đáp án không hợp lệ`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (submitStatus: "draft" | "published") => {
    if (!validate()) return;
    setIsSaving(true);

    const payload = {
      ...form,
      status: submitStatus,
      cambridge_no: form.cambridge_no ? parseInt(form.cambridge_no) : null,
      test_no: form.test_no ? parseInt(form.test_no) : null,
      sections: form.sections.map((s) => ({
        ...s,
        answers: s.answers.trim() ? JSON.parse(s.answers) : null,
      })),
    };

    try {
      const url = mode === "edit" ? `/api/admin/exams/${initialData?.id}` : "/api/admin/exams";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(
          "success",
          submitStatus === "published"
            ? "Đề thi đã được xuất bản thành công!"
            : "Đã lưu nháp thành công!"
        );
        setTimeout(() => router.push("/admin/exams"), 1200);
      } else {
        showToast("error", data.error || "Lưu thất bại");
      }
    } catch {
      showToast("error", "Lỗi kết nối máy chủ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border text-sm font-bold ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/exams"
          className="p-2 rounded-xl text-slate-400 hover:text-[#0d153a] hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#0d153a]">
            {mode === "create" ? "Tạo đề thi Cambridge mới" : "Chỉnh sửa đề thi"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {mode === "create"
              ? "Nhập thông tin và nội dung đề thi IELTS Listening"
              : "Cập nhật nội dung và thông tin đề thi"}
          </p>
        </div>
      </div>

      {/* ── Section 1: Basic Info ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-5">
        <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
            1
          </span>
          Thông tin đề thi
        </h2>

        {/* Title */}
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
            Tiêu đề đề thi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="VD: Cambridge IELTS 17 – Test 1 Listening"
            className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors ${
              errors.title ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50 focus:border-[#3B5C37]"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs font-bold text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
            Mô tả ngắn
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả ngắn gọn về đề thi này..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors resize-none"
          />
        </div>

        {/* Cambridge No & Test No */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              Cambridge số
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.cambridge_no}
              onChange={(e) => setForm((p) => ({ ...p, cambridge_no: e.target.value }))}
              placeholder="VD: 17"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors ${
                errors.cambridge_no ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50 focus:border-[#3B5C37]"
              }`}
            />
            {errors.cambridge_no && (
              <p className="mt-1 text-xs font-bold text-red-500">{errors.cambridge_no}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              Test số
            </label>
            <input
              type="number"
              min={1}
              max={4}
              value={form.test_no}
              onChange={(e) => setForm((p) => ({ ...p, test_no: e.target.value }))}
              placeholder="VD: 1"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors ${
                errors.test_no ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50 focus:border-[#3B5C37]"
              }`}
            />
            {errors.test_no && (
              <p className="mt-1 text-xs font-bold text-red-500">{errors.test_no}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Audio Upload ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-5">
        <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
            2
          </span>
          Upload file Audio
        </h2>

        {audioPreviewUrl ? (
          /* Audio Preview Card */
          <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Music className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0d153a]">
                    {audioFile?.name || "Audio đã upload"}
                  </p>
                  {audioFile && (
                    <p className="text-xs text-slate-400 font-medium">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={removeAudio}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Xóa audio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Player */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-violet-100 p-3">
              <button
                onClick={toggleAudioPlay}
                className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors flex-shrink-0"
              >
                {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <audio
                ref={audioRef}
                src={audioPreviewUrl}
                onEnded={() => setIsAudioPlaying(false)}
                className="flex-1 h-8"
                controls
                style={{ width: "100%", height: "32px" }}
              />
            </div>

            {isUploadingAudio && (
              <div className="flex items-center gap-2 mt-2 text-xs font-bold text-violet-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang upload lên server...
              </div>
            )}

            {form.audio_url && !isUploadingAudio && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã lưu trên Supabase Storage
              </div>
            )}
          </div>
        ) : (
          /* Drag & Drop Zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              isDragOver
                ? "border-[#3B5C37] bg-[#e8ede6]/50 scale-[1.01]"
                : "border-slate-200 bg-slate-50/50 hover:border-[#3B5C37]/60 hover:bg-[#e8ede6]/20"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? "bg-[#3B5C37]/15" : "bg-slate-100"}`}>
              <Upload className={`w-7 h-7 transition-colors ${isDragOver ? "text-[#3B5C37]" : "text-slate-400"}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#0d153a]">
                Kéo thả file audio vào đây
              </p>
              <p className="text-xs text-slate-400 mt-1">
                hoặc <span className="text-[#3B5C37] font-bold underline">nhấp để chọn file</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Hỗ trợ: MP3, WAV, OGG, M4A, AAC · Tối đa 200MB
              </p>
            </div>
          </div>
        )}

        {errors.audio && (
          <p className="text-xs font-bold text-red-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {errors.audio}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => { if (e.target.files?.[0]) handleAudioFile(e.target.files[0]); }}
          className="hidden"
        />
      </div>

      {/* ── Section 3: Exam Sections ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-4">
        <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
            3
          </span>
          Nội dung 4 Section
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Nhập transcript, câu hỏi và đáp án cho từng section. Phần đáp án nhập dạng JSON.{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600">
            {"{"}"1":"A","2":"castle"{"}"}
          </code>
        </p>

        <div className="space-y-3">
          {form.sections.map((section, idx) => (
            <div
              key={section.section_no}
              className={`rounded-2xl border transition-all ${
                expandedSection === section.section_no
                  ? "border-[#3B5C37]/40 shadow-sm"
                  : "border-slate-200"
              }`}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === section.section_no ? null : section.section_no
                  )
                }
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      expandedSection === section.section_no
                        ? "bg-[#3B5C37] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {section.section_no}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0d153a]">
                      {section.title || `Section ${section.section_no}`}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {section.content
                        ? `${section.content.length} ký tự nội dung`
                        : "Chưa có nội dung"}
                      {section.answers ? " · Có đáp án" : ""}
                    </p>
                  </div>
                </div>
                {expandedSection === section.section_no ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {/* Section Content (Expanded) */}
              {expandedSection === section.section_no && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                  {/* Section Title */}
                  <div className="pt-4">
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      Tiêu đề Section
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(idx, "title", e.target.value)}
                      placeholder={`VD: Section ${section.section_no}: A conversation between two students`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors"
                    />
                  </div>

                  {/* Transcript / Questions */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      Nội dung / Transcript / Câu hỏi
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(idx, "content", e.target.value)}
                      placeholder={`Nhập transcript audio hoặc nội dung câu hỏi cho Section ${section.section_no}...`}
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors resize-y font-mono"
                    />
                  </div>

                  {/* Answers JSON */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      Đáp án (JSON format)
                    </label>
                    <textarea
                      value={section.answers}
                      onChange={(e) => updateSection(idx, "answers", e.target.value)}
                      placeholder={`{"${(section.section_no - 1) * 10 + 1}": "A", "${(section.section_no - 1) * 10 + 2}": "castle", "${(section.section_no - 1) * 10 + 3}": "B"}`}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors resize-none font-mono ${
                        errors[`section_${idx}_answers`]
                          ? "border-red-400 bg-red-50/30"
                          : "border-slate-200 bg-slate-50 focus:border-[#3B5C37]"
                      }`}
                    />
                    {errors[`section_${idx}_answers`] && (
                      <p className="mt-1 text-xs font-bold text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors[`section_${idx}_answers`]}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                      Format: key = số câu (1–40), value = đáp án (chữ cái hoặc từ điền vào chỗ trống)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/exams"
          className="text-sm font-bold text-slate-500 hover:text-[#0d153a] transition-colors"
        >
          ← Quay lại danh sách
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={isSaving || isUploadingAudio}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-[#0d153a] hover:text-[#0d153a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu nháp
          </button>

          <button
            onClick={() => handleSubmit("published")}
            disabled={isSaving || isUploadingAudio}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B5C37] text-white text-sm font-bold hover:bg-[#2f4a2b] transition-all shadow-[0_4px_16px_rgba(59, 92, 55,0.25)] hover:shadow-[0_6px_20px_rgba(59, 92, 55,0.35)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Xuất bản
          </button>
        </div>
      </div>
    </div>
  );
}
