"use client";

import React, { useState, useRef, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
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
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Image as ImageIcon,
} from "lucide-react";

interface Section {
  section_no: number;
  title: string;
  content: string;
  answers: string; // JSON string in textarea, e.g. {"1":"A","2":"castle"...}
  audio_url?: string;
  image_url?: string;
}

interface ExamFormData {
  title: string;
  description: string;
  cambridge_no: string;
  test_no: string;
  status: "draft" | "published";
  audio_url: string;
  category: "listening" | "reading" | "writing" | "speaking";
  duration_minutes: string;
  sections: Section[];
}

interface ExamFormProps {
  initialData?: Partial<ExamFormData> & { id?: string };
  mode: "create" | "edit";
}

const defaultSections = (cat: string): Section[] => {
  const num = cat === "writing" ? 2 : cat === "speaking" ? 3 : cat === "reading" ? 3 : 4;
  const prefix = cat === "writing" ? "Task" : cat === "speaking" ? "Part" : cat === "reading" ? "Passage" : "Section";
  return Array.from({ length: num }, (_, i) => ({
    section_no: i + 1,
    title: `${prefix} ${i + 1}`,
    content: "",
    answers: "",
    audio_url: "",
    image_url: "",
  }));
};

export default function ExamForm({ initialData, mode }: ExamFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";

  const t = {
    toastUploadSuccess: isEn ? "Audio uploaded successfully!" : "Upload audio thành công!",
    toastSaveDraftSuccess: isEn ? "Draft saved successfully!" : "Đã lưu nháp thành công!",
    toastPublishSuccess: isEn ? "Exam published successfully!" : "Đề thi đã được xuất bản thành công!",
    toastSaveError: isEn ? "Failed to save exam" : "Lưu thất bại",
    toastConnError: isEn ? "Server connection error" : "Lỗi kết nối máy chủ",
    headerCreate: isEn ? "Create New Cambridge Exam" : "Tạo đề thi Cambridge mới",
    headerEdit: isEn ? "Edit Cambridge Exam" : "Chỉnh sửa đề thi",
    descCreate: isEn ? "Enter information and content for the IELTS Listening exam" : "Nhập thông tin và nội dung đề thi IELTS Listening",
    descEdit: isEn ? "Update content and information for the exam" : "Cập nhật nội dung và thông tin đề thi",
    
    // Step 1
    step1Title: isEn ? "Exam Information" : "Thông tin đề thi",
    labelTitle: isEn ? "Exam Title" : "Tiêu đề đề thi",
    placeholderTitle: isEn ? "e.g. Cambridge IELTS 17 – Test 1 Listening" : "VD: Cambridge IELTS 17 – Test 1 Listening",
    labelDesc: isEn ? "Short Description" : "Mô tả ngắn",
    placeholderDesc: isEn ? "A short description of this exam..." : "Mô tả ngắn gọn về đề thi này...",
    labelCambridgeNo: isEn ? "Cambridge No." : "Cambridge số",
    placeholderCambridgeNo: isEn ? "e.g. 17" : "VD: 17",
    labelTestNo: isEn ? "Test No." : "Test số",
    placeholderTestNo: isEn ? "e.g. 1" : "VD: 1",

    // Step 2
    step2Title: isEn ? "Upload Audio File" : "Upload file Audio",
    audioUploaded: isEn ? "Audio uploaded" : "Audio đã upload",
    removeAudio: isEn ? "Delete audio" : "Xóa audio",
    uploadingToServer: isEn ? "Uploading to server..." : "Đang upload lên server...",
    savedOnSupabase: isEn ? "Saved on Supabase Storage" : "Đã lưu trên Supabase Storage",
    dragDropZone: isEn ? "Drag & drop audio file here" : "Kéo thả file audio vào đây",
    orBrowse: isEn ? "or select file" : "hoặc nhấp để chọn file",
    supportedFormats: isEn ? "Supports: MP3, WAV, OGG, M4A, AAC · Max 200MB" : "Hỗ trợ: MP3, WAV, OGG, M4A, AAC · Tối đa 200MB",

    // Step 3
    step3Title: isEn ? "Content of 4 Sections" : "Nội dung 4 Section",
    step3Desc: isEn
      ? "Enter transcript, questions and answers for each section. Enter answers in JSON format."
      : "Nhập transcript, câu hỏi và đáp án cho từng section. Phần đáp án nhập dạng JSON.",
    answersFormatHelp: isEn ? "Format: key = question number (1–40), value = answer (letter or filled word)" : "Format: key = số câu (1–40), value = đáp án (chữ cái hoặc từ điền vào chỗ trống)",
    charCount: (count: number) => isEn ? `${count} characters` : `${count} ký tự nội dung`,
    noContent: isEn ? "No content yet" : "Chưa có nội dung",
    hasAnswers: isEn ? " · Has answers" : " · Có đáp án",
    labelSectionTitle: isEn ? "Section Title" : "Tiêu đề Section",
    placeholderSectionTitle: (no: number) => isEn ? `Section ${no}: e.g. A conversation between two students` : `VD: Section ${no}: A conversation between two students`,
    labelTranscript: isEn ? "Content / Transcript / Questions" : "Nội dung / Transcript / Câu hỏi",
    placeholderTranscript: (no: number) => isEn ? `Enter audio transcript or question content for Section ${no}...` : `Nhập transcript audio hoặc nội dung câu hỏi cho Section ${no}...`,
    labelAnswers: isEn ? "Answers (JSON format)" : "Đáp án (JSON format)",

    // Actions
    backToList: isEn ? "← Back to List" : "← Quay lại danh sách",
    saveDraft: isEn ? "Save Draft" : "Lưu nháp",
    publish: isEn ? "Publish" : "Xuất bản",

    // Validation
    valTitleRequired: isEn ? "Exam title is required" : "Tiêu đề đề thi là bắt buộc",
    valMustBeInteger: isEn ? "Must be an integer" : "Phải là số nguyên",
    valInvalidAnswersJson: (no: number) => isEn ? `Section ${no}: Invalid answers JSON format` : `Section ${no}: JSON đáp án không hợp lệ`,
    valAudioType: isEn ? "File must be an audio format: MP3, WAV, OGG, M4A, AAC" : "File phải là định dạng audio: MP3, WAV, OGG, M4A, AAC",
    valAudioSize: isEn ? "File size must not exceed 200MB" : "File không được vượt quá 200MB",
    valUploadError: isEn ? "Upload failed" : "Upload thất bại",
    valUploadConnError: isEn ? "Connection error during upload" : "Lỗi kết nối khi upload",
  };

  const searchParams = useSearchParams();
  const [form, setForm] = useState<ExamFormData>(() => {
    const queryCat = searchParams.get("category") as "listening" | "reading" | "writing" | "speaking" | null;
    const cat = (initialData?.category as "listening" | "reading" | "writing" | "speaking") || 
                (queryCat && ["listening", "reading", "writing", "speaking"].includes(queryCat) ? queryCat : "listening");
    const initialSections = initialData?.sections || [];
    
    // Merge or pad sections to match the category count
    const num = cat === "writing" ? 2 : cat === "speaking" ? 3 : cat === "reading" ? 3 : 4;
    const prefix = cat === "writing" ? "Task" : cat === "speaking" ? "Part" : cat === "reading" ? "Passage" : "Section";

    const paddedSections = Array.from({ length: num }, (_, i) => {
      const secNo = i + 1;
      const existing = initialSections.find((s) => s.section_no === secNo);
      return existing
        ? { 
            ...existing, 
            audio_url: (existing as any).audio_url || "",
            image_url: (existing as any).image_url || ""
          }
        : {
            section_no: secNo,
            title: `${prefix} ${secNo}`,
            content: "",
            answers: "",
            audio_url: "",
            image_url: "",
          };
    });

    return {
      title: initialData?.title || "",
      description: initialData?.description || "",
      cambridge_no: initialData?.cambridge_no?.toString() || "",
      test_no: initialData?.test_no?.toString() || "",
      status: initialData?.status || "draft",
      audio_url: initialData?.audio_url || "",
      category: cat,
      duration_minutes: initialData?.duration_minutes?.toString() || (cat === "listening" ? "30" : cat === "speaking" ? "15" : "60"),
      sections: paddedSections,
    };
  });

  const handleCategoryChange = (newCat: "listening" | "reading" | "writing" | "speaking") => {
    setForm((prev) => {
      const num = newCat === "writing" ? 2 : newCat === "speaking" ? 3 : newCat === "reading" ? 3 : 4;
      const prefix = newCat === "writing" ? "Task" : newCat === "speaking" ? "Part" : newCat === "reading" ? "Passage" : "Section";
      
      const adjustedSections = Array.from({ length: num }, (_, i) => {
        const secNo = i + 1;
        const existing = prev.sections.find((s) => s.section_no === secNo);
        return {
          section_no: secNo,
          title: existing?.title && 
            !existing.title.startsWith("Section ") && 
            !existing.title.startsWith("Passage ") && 
            !existing.title.startsWith("Task ") &&
            !existing.title.startsWith("Part ")
              ? existing.title 
              : `${prefix} ${secNo}`,
          content: existing?.content || "",
          answers: existing?.answers || "",
          audio_url: existing?.audio_url || "",
          image_url: existing?.image_url || "",
        };
      });

      let defaultDuration = "60";
      if (newCat === "listening") defaultDuration = "30";
      else if (newCat === "speaking") defaultDuration = "15";
      
      return {
        ...prev,
        category: newCat,
        duration_minutes: prev.duration_minutes === "30" || prev.duration_minutes === "60" || prev.duration_minutes === "15"
          ? defaultDuration 
          : prev.duration_minutes,
        sections: adjustedSections,
      };
    });

    if (newCat !== "listening") {
      setAudioPreviewUrl("");
      setAudioFile(null);
    }
  };

  const [expandedSection, setExpandedSection] = useState<number | null>(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>(initialData?.audio_url || "");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [uploadingSectionAudioIdx, setUploadingSectionAudioIdx] = useState<number | null>(null);
  const [uploadingSectionImageIdx, setUploadingSectionImageIdx] = useState<number | null>(null);

  const handleSectionAudioFile = async (file: File, sectionIdx: number) => {
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
    const allowedExts = /\.(mp3|wav|ogg|m4a|aac)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExts.test(file.name)) {
      showToast("error", t.valAudioType);
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      showToast("error", t.valAudioSize);
      return;
    }

    setUploadingSectionAudioIdx(sectionIdx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/exams/upload-audio", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => {
          const sections = [...prev.sections];
          sections[sectionIdx] = { ...sections[sectionIdx], audio_url: data.url };
          return { ...prev, sections };
        });
        showToast("success", t.toastUploadSuccess);
      } else {
        showToast("error", data.error || t.valUploadError);
      }
    } catch {
      showToast("error", t.valUploadConnError);
    } finally {
      setUploadingSectionAudioIdx(null);
    }
  };

  const handleSectionImageFile = async (file: File, sectionIdx: number) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedExts = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExts.test(file.name)) {
      showToast("error", isEn ? "File must be an image format: JPG, JPEG, PNG, WEBP, GIF" : "File phải là định dạng ảnh: JPG, JPEG, PNG, WEBP, GIF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", isEn ? "File size must not exceed 10MB" : "File ảnh không được vượt quá 10MB");
      return;
    }

    setUploadingSectionImageIdx(sectionIdx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => {
          const sections = [...prev.sections];
          sections[sectionIdx] = { ...sections[sectionIdx], image_url: data.url };
          return { ...prev, sections };
        });
        showToast("success", isEn ? "Image uploaded successfully!" : "Upload ảnh thành công!");
      } else {
        showToast("error", data.error || (isEn ? "Upload failed" : "Upload thất bại"));
      }
    } catch {
      showToast("error", isEn ? "Connection error during upload" : "Lỗi kết nối khi upload");
    } finally {
      setUploadingSectionImageIdx(null);
    }
  };

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
      setErrors((p) => ({ ...p, audio: t.valAudioType }));
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setErrors((p) => ({ ...p, audio: t.valAudioSize }));
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
      const res = await authFetch("/api/admin/exams/upload-audio", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, audio_url: data.url }));
        showToast("success", t.toastUploadSuccess);
      } else {
        setErrors((p) => ({ ...p, audio: data.error || t.valUploadError }));
        setAudioPreviewUrl("");
        setAudioFile(null);
      }
    } catch {
      setErrors((p) => ({ ...p, audio: t.valUploadConnError }));
    } finally {
      setIsUploadingAudio(false);
    }
  }, [t.valAudioType, t.valAudioSize, t.toastUploadSuccess, t.valUploadError, t.valUploadConnError]);

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
    if (!form.title.trim()) newErrors.title = t.valTitleRequired;
    if (form.cambridge_no && isNaN(parseInt(form.cambridge_no)))
      newErrors.cambridge_no = t.valMustBeInteger;
    if (form.test_no && isNaN(parseInt(form.test_no)))
      newErrors.test_no = t.valMustBeInteger;

    // Validate answers JSON
    form.sections.forEach((s, i) => {
      if (s.answers.trim()) {
        try {
          JSON.parse(s.answers);
        } catch {
          newErrors[`section_${i}_answers`] = t.valInvalidAnswersJson(s.section_no);
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
      sections: form.sections.map((s) => {
        let answersObj = null;
        if (s.answers.trim()) {
          try {
            answersObj = JSON.parse(s.answers);
          } catch {
            answersObj = null;
          }
        }

        if (form.category === "listening" && s.audio_url) {
          answersObj = {
            ...(answersObj || {}),
            audio_url: s.audio_url,
          };
        }

        if (form.category === "writing" && s.image_url) {
          answersObj = {
            ...(answersObj || {}),
            image_url: s.image_url,
          };
        }

        return {
          section_no: s.section_no,
          title: s.title || `${getSectionLabelPrefix()} ${s.section_no}`,
          content: s.content || null,
          answers: answersObj,
        };
      }),
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
            ? t.toastPublishSuccess
            : t.toastSaveDraftSuccess
        );
        setTimeout(() => router.push("/admin/exams"), 1200);
      } else {
        showToast("error", data.error || t.toastSaveError);
      }
    } catch {
      showToast("error", t.toastConnError);
    } finally {
      setIsSaving(false);
    }
  };


  const getSectionLabelPrefix = () => {
    if (form.category === "writing") return isEn ? "Task" : "Bài viết (Task)";
    if (form.category === "speaking") return isEn ? "Part" : "Phần nói (Part)";
    if (form.category === "reading") return isEn ? "Passage" : "Bài đọc (Passage)";
    return isEn ? "Section" : "Phần nghe (Section)";
  };

  const getTranscriptLabel = () => {
    if (form.category === "writing") return isEn ? "Writing Prompt / Topic Description" : "Đề bài / Yêu cầu & Hướng dẫn (Prompt)";
    if (form.category === "speaking") return isEn ? "Topic / Cue Card / Context Description" : "Mô tả Chủ đề / Hướng dẫn (Cue Card / Context)";
    if (form.category === "reading") return isEn ? "Reading Passage Content & Questions" : "Nội dung bài đọc & Câu hỏi (Passage & Questions)";
    return isEn ? "Content / Transcript / Questions" : "Nội dung / Transcript / Câu hỏi";
  };

  const getAnswersLabel = () => {
    if (form.category === "writing") return isEn ? "Sample Answers / Key Vocabulary / Guidance (JSON)" : "Đáp án mẫu / Từ vựng / Hướng dẫn chấm (Dạng JSON)";
    if (form.category === "speaking") return isEn ? "Questions List / Bullet Points (JSON format)" : "Danh sách câu hỏi / Gợi ý chi tiết (Dạng JSON)";
    return isEn ? "Answers (JSON format)" : "Đáp án (JSON format)";
  };

  const getStep3Title = () => {
    if (form.category === "writing") return isEn ? "Content of 2 Tasks" : "Nội dung của 2 Tasks";
    if (form.category === "speaking") return isEn ? "Content of 3 Parts" : "Nội dung của 3 Parts";
    if (form.category === "reading") return isEn ? "Content of 3 Passages" : "Nội dung của 3 Bài đọc";
    return isEn ? "Content of 4 Sections" : "Nội dung của 4 Phần nghe";
  };

  const getStep3Desc = () => {
    if (form.category === "writing") return isEn ? "Enter writing prompts and sample answers/guidance in JSON format for each Task." : "Nhập đề bài viết và bài mẫu/hướng dẫn dạng JSON cho từng Task.";
    if (form.category === "speaking") return isEn ? "Enter speaking prompts and questions for Part 1, Part 2, and Part 3. Enter questions in JSON format." : "Nhập câu hỏi và đề bài Speaking cho Part 1, Part 2, và Part 3. Định dạng JSON.";
    if (form.category === "reading") return isEn ? "Enter reading passage text, questions, and answers in JSON format for each Passage." : "Nhập nội dung bài đọc, câu hỏi và đáp án dạng JSON cho từng Bài đọc.";
    return isEn ? "Enter transcript, questions, and answers in JSON format for each Section." : "Nhập transcript, câu hỏi và đáp án dạng JSON cho từng Phần nghe.";
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
            {mode === "create" ? t.headerCreate : t.headerEdit}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {mode === "create" ? t.descCreate : t.descEdit}
          </p>
        </div>
      </div>

      {/* ── Section 1: Basic Info ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-5">
        <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
            1
          </span>
          {t.step1Title}
        </h2>

        {/* Title */}
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
            {t.labelTitle} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={t.placeholderTitle}
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
            {t.labelDesc}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder={t.placeholderDesc}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors resize-none"
          />
        </div>

        {/* Skill Category Selector */}
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
            {isEn ? "Skill Category" : "Kỹ năng"}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: "listening", label: isEn ? "Listening" : "Nghe (Listening)", icon: Headphones, activeBg: "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/10" },
              { id: "reading", label: isEn ? "Reading" : "Đọc (Reading)", icon: BookOpen, activeBg: "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/10" },
              { id: "writing", label: isEn ? "Writing" : "Viết (Writing)", icon: PenTool, activeBg: "bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/10" },
              { id: "speaking", label: isEn ? "Speaking" : "Nói (Speaking)", icon: Mic, activeBg: "bg-violet-50 border-violet-500 text-violet-700 ring-2 ring-violet-500/10" },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = form.category === item.id;
              
              if (mode === "edit") {
                if (!isSelected) return null;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold ${item.activeBg}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategoryChange(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                    isSelected
                      ? item.activeBg
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration, Cambridge No, & Test No */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              {isEn ? "Duration (Minutes)" : "Thời gian làm bài (Phút)"}
            </label>
            <input
              type="number"
              min={1}
              value={form.duration_minutes}
              onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              placeholder={form.category === "listening" ? "30" : "60"}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              {t.labelCambridgeNo}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.cambridge_no}
              onChange={(e) => setForm((p) => ({ ...p, cambridge_no: e.target.value }))}
              placeholder={t.placeholderCambridgeNo}
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
              {t.labelTestNo}
            </label>
            <input
              type="number"
              min={1}
              max={4}
              value={form.test_no}
              onChange={(e) => setForm((p) => ({ ...p, test_no: e.target.value }))}
              placeholder={t.placeholderTestNo}
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

      {/* ── Section 3: Exam Sections ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-4">
        <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
            2
          </span>
          {getStep3Title()}
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          {getStep3Desc()}{" "}
          {form.category !== "writing" && form.category !== "speaking" && (
            <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600">
              {"{"}"1":"A","2":"castle"{"}"}
            </code>
          )}
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
                      {section.title || `${getSectionLabelPrefix()} ${section.section_no}`}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {section.content
                        ? t.charCount(section.content.length)
                        : t.noContent}
                      {section.answers ? t.hasAnswers : ""}
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
                      {isEn ? `${getSectionLabelPrefix()} Title` : `Tiêu đề ${getSectionLabelPrefix()}`}
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(idx, "title", e.target.value)}
                      placeholder={`${getSectionLabelPrefix()} ${section.section_no}`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors"
                    />
                  </div>

                  {/* Transcript / Questions */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      {getTranscriptLabel()}
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(idx, "content", e.target.value)}
                      placeholder={
                        form.category === "writing"
                          ? (isEn ? "Enter writing task prompt, target word count, and chart description..." : "Nhập đề bài viết, số lượng từ yêu cầu, mô tả biểu đồ hoặc câu hỏi thảo luận...")
                          : form.category === "reading"
                          ? (isEn ? "Enter reading passage content followed by the questions..." : "Nhập nội dung bài đọc và theo sau là các câu hỏi...")
                          : form.category === "speaking"
                          ? (isEn ? "Describe the speaking part topic or cue card instructions..." : "Nhập chủ đề phần thi nói hoặc mô tả cue card (ví dụ: Describe a place you like to visit)...")
                          : t.placeholderTranscript(section.section_no)
                      }
                      rows={10}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 focus:border-[#3B5C37] transition-colors resize-y font-mono"
                    />
                  </div>

                  {/* Audio Upload for Section (Listening Category Only) */}
                  {form.category === "listening" && (
                    <div className="pt-2">
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                        {isEn ? "Section Audio File" : "File Audio của phần này"} <span className="text-red-500">*</span>
                      </label>
                      {section.audio_url ? (
                        <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <Music className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <audio
                                src={section.audio_url}
                                className="h-8 w-full max-w-[240px] sm:max-w-xs md:max-w-md"
                                controls
                                style={{ height: "30px" }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => {
                                const newSections = [...prev.sections];
                                newSections[idx] = { ...newSections[idx], audio_url: "" };
                                return { ...prev, sections: newSections };
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title={t.removeAudio}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            const input = document.getElementById(`section-audio-input-${idx}`) as HTMLInputElement;
                            input?.click();
                          }}
                          className="rounded-xl border border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-50 border-slate-200/80"
                        >
                          {uploadingSectionAudioIdx === idx ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-[#3B5C37]">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t.uploadingToServer}
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-slate-400" />
                              <div className="text-center">
                                <p className="text-xs font-bold text-[#0d153a]">
                                  {isEn ? "Click to upload section audio" : "Nhấp để upload file audio cho phần này"}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                  Supports: MP3, WAV, M4A · Max 50MB
                                </p>
                              </div>
                            </>
                          )}
                          <input
                            id={`section-audio-input-${idx}`}
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleSectionAudioFile(e.target.files[0], idx);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Upload for Section (Writing Category Only) */}
                  {form.category === "writing" && (
                    <div className="pt-2">
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                        {isEn ? "Section Image" : "Hình ảnh minh họa của phần này (nếu có)"}
                      </label>
                      {section.image_url ? (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                              <ImageIcon className="w-4 h-4 text-blue-500" />
                              <span>{isEn ? "Uploaded Image" : "Hình ảnh đã upload"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => {
                                  const newSections = [...prev.sections];
                                  newSections[idx] = { ...newSections[idx], image_url: "" };
                                  return { ...prev, sections: newSections };
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title={isEn ? "Remove image" : "Xóa hình ảnh"}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 max-w-xs bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={section.image_url}
                              alt={`Section ${section.section_no}`}
                              className="w-full h-auto max-h-40 object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            const input = document.getElementById(`section-image-input-${idx}`) as HTMLInputElement;
                            input?.click();
                          }}
                          className="rounded-xl border border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-50 border-slate-200/80"
                        >
                          {uploadingSectionImageIdx === idx ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-[#3B5C37]">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t.uploadingToServer}
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-slate-400" />
                              <div className="text-center">
                                <p className="text-xs font-bold text-[#0d153a]">
                                  {isEn ? "Click to upload section image" : "Nhấp để upload file ảnh cho phần này"}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                  {isEn ? "Supports: JPG, PNG, WEBP, GIF · Max 10MB" : "Hỗ trợ: JPG, PNG, WEBP, GIF · Tối đa 10MB"}
                                </p>
                              </div>
                            </>
                          )}
                          <input
                            id={`section-image-input-${idx}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleSectionImageFile(e.target.files[0], idx);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Answers JSON */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      {getAnswersLabel()}
                    </label>
                    <textarea
                      value={section.answers}
                      onChange={(e) => updateSection(idx, "answers", e.target.value)}
                      placeholder={
                        form.category === "writing"
                          ? `{\n  "sample_answer": "Enter sample essay for Band 8.0+ here...",\n  "key_vocabulary": ["vocabulary 1", "vocabulary 2"],\n  "grading_tips": "Tips for Task Response, Coherence, Lexical Resource, Grammar..."\n}`
                          : form.category === "speaking"
                            ? section.section_no === 2
                              ? `{\n  "cue_card": "Describe a subject you enjoyed studying in high school.",\n  "bullet_points": [\n    "What the subject was",\n    "Who the teacher was and how they taught it",\n    "And explain why you found this subject so enjoyable."\n  ]\n}`
                              : `[\n  "Let's talk about your hometown. Where is your hometown located?",\n  "What do you like most about your hometown?",\n  "Do you prefer living in a city or the countryside?"\n]`
                            : `{"${(section.section_no - 1) * 10 + 1}": "A", "${(section.section_no - 1) * 10 + 2}": "castle", "${(section.section_no - 1) * 10 + 3}": "B"}`
                      }
                      rows={6}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors resize-y font-mono ${
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
                      {form.category === "writing"
                        ? (isEn ? "Format: JSON containing sample_answer, key_vocabulary, and grading_tips." : "Định dạng: Chuỗi JSON chứa sample_answer, key_vocabulary, và grading_tips.")
                        : form.category === "speaking"
                        ? section.section_no === 2
                          ? (isEn ? "Format: JSON containing cue_card and bullet_points array." : "Định dạng: Chuỗi JSON chứa cue_card và mảng bullet_points.")
                          : (isEn ? "Format: JSON array of strings for Part 1/Part 3 questions." : "Định dạng: Mảng chuỗi JSON chứa danh sách câu hỏi Part 1/Part 3.")
                        : t.answersFormatHelp}
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
          {t.backToList}
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
            {t.saveDraft}
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
            {t.publish}
          </button>
        </div>
      </div>
    </div>
  );
}
