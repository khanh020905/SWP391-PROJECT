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
  Sparkles,
  UploadCloud,
  FileUp,
  Code,
  Wand2,
  Check
} from "lucide-react";

interface Section {
  section_no: number;
  title: string;
  content: string;
  answers: string; // JSON string in textarea
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

// Helper function to parse raw text or JSON into exam structure
function parseExamContent(rawContent: string, currentCategory: string) {
  let result = {
    title: "",
    cambridge_no: "",
    test_no: "",
    category: currentCategory,
    duration_minutes: "",
    sections: [] as { section_no: number; title: string; content: string; answers: string }[]
  };

  const text = rawContent.trim();
  if (!text) return result;

  try {
    const json = JSON.parse(text);
    if (typeof json === "object" && json !== null) {
      result.title = json.title || json.name || "";
      result.cambridge_no = json.cambridge_no?.toString() || json.cambridgeNo?.toString() || "";
      result.test_no = json.test_no?.toString() || json.testNo?.toString() || "";
      if (json.category && ["listening", "reading", "writing", "speaking"].includes(json.category.toLowerCase())) {
        result.category = json.category.toLowerCase();
      }
      result.duration_minutes = json.duration_minutes?.toString() || json.durationMinutes?.toString() || "";

      if (Array.isArray(json.sections) && json.sections.length > 0) {
        result.sections = json.sections.map((s: any, idx: number) => ({
          section_no: s.section_no || idx + 1,
          title: s.title || `Section ${idx + 1}`,
          content: typeof s.content === "string" ? s.content : (s.text || s.transcript || ""),
          answers: typeof s.answers === "object" ? JSON.stringify(s.answers, null, 2) : (typeof s.answers === "string" ? s.answers : "")
        }));
      }
      return result;
    }
  } catch {
    // Fallback to text parser
  }

  const camMatch = text.match(/Cambridge\s*(?:IELTS)?\s*(\d+)/i);
  if (camMatch) result.cambridge_no = camMatch[1];

  const testMatch = text.match(/Test\s*(\d+)/i);
  if (testMatch) result.test_no = testMatch[1];

  if (result.cambridge_no && result.test_no) {
    result.title = `Cambridge IELTS ${result.cambridge_no} – Test ${result.test_no}`;
  }

  if (/listening/i.test(text)) result.category = "listening";
  else if (/reading/i.test(text)) result.category = "reading";
  else if (/writing/i.test(text)) result.category = "writing";
  else if (/speaking/i.test(text)) result.category = "speaking";

  if (result.category === "listening") result.duration_minutes = "30";
  else if (result.category === "speaking") result.duration_minutes = "15";
  else result.duration_minutes = "60";

  const sectionSplitter = /(?:^|\n)\s*(?:Passage|Section|Part|Task)\s*(\d+)/gi;
  const matches = Array.from(text.matchAll(sectionSplitter));

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const secNo = parseInt(match[1]) || (i + 1);
      const startIndex = match.index! + match[0].length;
      const endIndex = (i < matches.length - 1) ? matches[i + 1].index! : text.length;
      const sectionText = text.substring(startIndex, endIndex).trim();

      let content = sectionText;
      let answersObj: Record<string, string> = {};

      const answerBlockMatch = sectionText.match(/(?:Answers?|Answer Key|Đáp án)[:\n]([\s\S]+)$/i);
      if (answerBlockMatch) {
        content = sectionText.substring(0, answerBlockMatch.index).trim();
        const rawAnswersText = answerBlockMatch[1];
        const ansMatches = Array.from(rawAnswersText.matchAll(/(\d+)[\.\:\-\s]+([A-Z0-[#a-z0-9\s]+?)(?=\s+\d+[\.\:\-]|\n|$)/gi));
        ansMatches.forEach(m => {
          answersObj[m[1]] = m[2].trim();
        });
      }

      const prefix = result.category === "writing" ? "Task" : result.category === "speaking" ? "Part" : result.category === "reading" ? "Passage" : "Section";
      result.sections.push({
        section_no: secNo,
        title: `${prefix} ${secNo}`,
        content: content,
        answers: Object.keys(answersObj).length > 0 ? JSON.stringify(answersObj, null, 2) : ""
      });
    }
  } else {
    const prefix = result.category === "writing" ? "Task" : result.category === "speaking" ? "Part" : result.category === "reading" ? "Passage" : "Section";
    result.sections.push({
      section_no: 1,
      title: `${prefix} 1`,
      content: text,
      answers: ""
    });
  }

  return result;
}

export default function ExamForm({ initialData, mode }: ExamFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";

  const searchParams = useSearchParams();
  const [form, setForm] = useState<ExamFormData>(() => {
    const queryCat = searchParams.get("category") as "listening" | "reading" | "writing" | "speaking" | null;
    const cat = (initialData?.category as "listening" | "reading" | "writing" | "speaking") || 
                (queryCat && ["listening", "reading", "writing", "speaking"].includes(queryCat) ? queryCat : "listening");
    const initialSections = initialData?.sections || [];
    
    const num = cat === "writing" ? (initialSections.length || 1) : cat === "speaking" ? 3 : cat === "reading" ? 3 : 4;
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

  // Auto Import File State
  const [autoImportOpen, setAutoImportOpen] = useState(true);
  const [importTab, setImportTab] = useState<"file" | "text">("file");
  const [rawTextContent, setRawTextContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isFileParsed, setIsFileParsed] = useState<boolean>(() => {
    if (mode === "edit") return true;
    if (initialData?.sections && initialData.sections.some(s => s.content || s.answers)) return true;
    return false;
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

  const handleFileImport = async (file: File) => {
    setFileName(file.name);
    setIsParsingFile(true);
    showToast("success", isEn ? `AI is reading ${file.name}...` : `AI (Gemini) đang đọc và phân tích file ${file.name}...`);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", form.category);

      const res = await authFetch("/api/admin/exams/parse-file", {
        method: "POST",
        body: fd,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status} (${res.statusText || "Invalid Response"})`);
      }

      if (res.ok && data?.parsed) {
        const parsed = data.parsed;
        setParseResult(parsed);

        // Apply parsed data directly to form & overwrite previous content
        setForm((prev) => {
          const targetCat = parsed.category || prev.category;
          const num = targetCat === "writing" ? (parsed.sections && parsed.sections.length > 0 ? parsed.sections.length : 1) : targetCat === "speaking" ? 3 : targetCat === "reading" ? 3 : 4;
          const prefix = targetCat === "writing" ? "Task" : targetCat === "speaking" ? "Part" : targetCat === "reading" ? "Passage" : "Section";

          const updatedSections = Array.from({ length: num }, (_, i) => {
            const secNo = i + 1;
            const parsedSec = parsed.sections?.find((s: any) => s.section_no === secNo) || parsed.sections?.[i];

            let answersStr = "";
            let extractedImgUrl = parsedSec?.image_url || "";

            if (parsedSec?.answers) {
              if (typeof parsedSec.answers === "string") {
                try {
                  const parsedJson = JSON.parse(parsedSec.answers);
                  if (parsedJson.image_url) extractedImgUrl = parsedJson.image_url;
                  answersStr = JSON.stringify(parsedJson, null, 2);
                } catch {
                  answersStr = parsedSec.answers;
                }
              } else if (typeof parsedSec.answers === "object") {
                if (parsedSec.answers.image_url) extractedImgUrl = parsedSec.answers.image_url;
                answersStr = JSON.stringify(parsedSec.answers, null, 2);
              }
            }

            return {
              section_no: secNo,
              title: parsedSec?.title || (targetCat === "writing" ? `Task ${secNo} - ${secNo === 1 ? "Academic Writing" : "Essay Writing"}` : `${prefix} ${secNo}`),
              content: parsedSec?.content || "",
              answers: answersStr,
              audio_url: "",
              image_url: extractedImgUrl
            };
          });

          const derivedTitle = parsed.title || prev.title || (file?.name ? file.name.replace(/\.[^/.]+$/, "") : "");

          return {
            ...prev,
            title: derivedTitle,
            cambridge_no: parsed.cambridge_no?.toString() || prev.cambridge_no,
            test_no: parsed.test_no?.toString() || prev.test_no,
            category: targetCat,
            duration_minutes: parsed.duration_minutes?.toString() || prev.duration_minutes,
            sections: updatedSections
          };
        });

        // Mark file parsed & hide auto import section
        setIsFileParsed(true);
        setAutoImportOpen(false);
        setExpandedSection(1);

        showToast(
          "success",
          isEn
            ? "Exam file processed with Gemini AI successfully!"
            : "Đã đọc xong file và tự động trích xuất đầy đủ nội dung & đáp án đề thi!"
        );
      } else {
        showToast("error", data?.error || (isEn ? "Failed to read file" : "Không thể đọc file"));
      }
    } catch (err: any) {
      console.error("handleFileImport error:", err);
      showToast("error", err?.message || (isEn ? "Error parsing file" : "Lỗi khi đọc file"));
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleParseRawText = () => {
    if (!rawTextContent.trim()) {
      showToast("error", isEn ? "Please enter or paste exam text!" : "Vui lòng nhập nội dung file đề thi!");
      return;
    }
    const parsed = parseExamContent(rawTextContent, form.category);
    setParseResult(parsed);
    
    // Apply data directly, mark parsed, and hide import container
    applyParsedContentToFormWithData(parsed);
  };

  const applyParsedContentToFormWithData = (parsedData: any) => {
    if (!parsedData) return;

    setForm(prev => {
      const targetCat = parsedData.category || prev.category;
      const num = targetCat === "writing" ? (parsedData.sections && parsedData.sections.length > 0 ? parsedData.sections.length : 1) : targetCat === "speaking" ? 3 : targetCat === "reading" ? 3 : 4;
      const prefix = targetCat === "writing" ? "Task" : targetCat === "speaking" ? "Part" : targetCat === "reading" ? "Passage" : "Section";

      const updatedSections = Array.from({ length: num }, (_, i) => {
        const secNo = i + 1;
        const parsedSec = parsedData.sections?.find((s: any) => s.section_no === secNo) || parsedData.sections?.[i];

        let answersStr = "";
        let extractedImgUrl = parsedSec?.image_url || "";

        if (parsedSec?.answers) {
          if (typeof parsedSec.answers === "string") {
            try {
              const parsedJson = JSON.parse(parsedSec.answers);
              if (parsedJson.image_url) extractedImgUrl = parsedJson.image_url;
              answersStr = JSON.stringify(parsedJson, null, 2);
            } catch {
              answersStr = parsedSec.answers;
            }
          } else if (typeof parsedSec.answers === "object") {
            if (parsedSec.answers.image_url) extractedImgUrl = parsedSec.answers.image_url;
            answersStr = JSON.stringify(parsedSec.answers, null, 2);
          }
        }

        return {
          section_no: secNo,
          title: parsedSec?.title || (targetCat === "writing" ? `Task ${secNo} - ${secNo === 1 ? "Academic Writing" : "Essay Writing"}` : `${prefix} ${secNo}`),
          content: parsedSec?.content || "",
          answers: answersStr,
          audio_url: "",
          image_url: extractedImgUrl
        };
      });

      const derivedTitle = parsedData.title || prev.title || (fileName ? fileName.replace(/\.[^/.]+$/, "") : "");

      return {
        ...prev,
        title: derivedTitle,
        cambridge_no: parsedData.cambridge_no?.toString() || prev.cambridge_no,
        test_no: parsedData.test_no?.toString() || prev.test_no,
        category: targetCat,
        duration_minutes: parsedData.duration_minutes?.toString() || prev.duration_minutes,
        sections: updatedSections
      };
    });

    setIsFileParsed(true);
    setAutoImportOpen(false);
    setExpandedSection(1);
    showToast("success", isEn ? "Form updated with extracted exam data!" : "Đã tự động điền dữ liệu bóc tách vào Form!");
  };

  const applyParsedContentToForm = () => {
    applyParsedContentToFormWithData(parseResult);
  };

  const handleCategoryChange = (newCat: "listening" | "reading" | "writing" | "speaking") => {
    setForm((prev) => {
      const num = newCat === "writing" ? 1 : newCat === "speaking" ? 3 : newCat === "reading" ? 3 : 4;
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

  const handleAudioFile = useCallback(async (file: File) => {
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
    const allowedExts = /\.(mp3|wav|ogg|m4a|aac)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExts.test(file.name)) {
      showToast("error", isEn ? "Invalid audio format" : "Định dạng audio không hợp lệ");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      showToast("error", isEn ? "File size exceeds 200MB" : "File vượt quá 200MB");
      return;
    }

    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));

    setIsUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (form.title) fd.append("examTitle", form.title);
      if (form.cambridge_no) fd.append("cambridgeNo", form.cambridge_no);
      if (form.test_no) fd.append("testNo", form.test_no);
      const res = await authFetch("/api/admin/exams/upload-audio", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((p) => ({ ...p, audio_url: data.url }));
        showToast("success", isEn ? "Audio uploaded!" : "Upload audio thành công!");
      } else {
        showToast("error", data.error || (isEn ? "Upload failed" : "Upload thất bại"));
      }
    } catch {
      showToast("error", isEn ? "Connection error" : "Lỗi kết nối");
    } finally {
      setIsUploadingAudio(false);
    }
  }, [form.title, form.cambridge_no, form.test_no, isEn]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = isEn ? "Exam title is required" : "Tiêu đề đề thi là bắt buộc";
    if (form.cambridge_no && isNaN(Number(form.cambridge_no))) errs.cambridge_no = isEn ? "Cambridge No. must be a number" : "Cambridge số phải là số nguyên";
    if (form.test_no && isNaN(Number(form.test_no))) errs.test_no = isEn ? "Test No. must be a number" : "Test số phải là số nguyên";

    form.sections.forEach((s) => {
      if (s.answers.trim()) {
        try {
          JSON.parse(s.answers);
        } catch {
          errs[`answers_${s.section_no}`] = isEn ? `Section ${s.section_no}: Invalid JSON` : `Section ${s.section_no}: JSON đáp án không hợp lệ`;
        }
      }
    });

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errs };
  };

  const handleSubmit = async (submitStatus: "draft" | "published") => {
    const { isValid, errs: valErrors } = validate();
    if (!isValid) {
      const firstErrMsg = Object.values(valErrors)[0];
      showToast("error", firstErrMsg ? `Vui lòng kiểm tra: ${firstErrMsg}` : (isEn ? "Please fix form errors before submitting" : "Vui lòng kiểm tra lại thông tin bị lỗi"));
      return;
    }
    setIsSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      cambridge_no: form.cambridge_no ? Number(form.cambridge_no) : null,
      test_no: form.test_no ? Number(form.test_no) : null,
      status: submitStatus,
      audio_url: form.audio_url || null,
      category: form.category,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : 30,
      sections: form.sections.map((s) => {
        let answersObj: any = null;
        if (s.answers.trim()) {
          try {
            answersObj = JSON.parse(s.answers);
          } catch {
            answersObj = null;
          }
        }

        if (form.category === "listening" || form.category === "writing") {
          if (s.audio_url) answersObj = { ...(answersObj || {}), audio_url: s.audio_url };
          if (s.image_url) answersObj = { ...(answersObj || {}), image_url: s.image_url };
        }

        return {
          section_no: s.section_no,
          title: s.title || `Section ${s.section_no}`,
          content: s.content || null,
          answers: answersObj,
        };
      }),
    };

    try {
      const url = mode === "edit" ? `/api/admin/exams/${initialData?.id}` : "/api/admin/exams";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(
          "success",
          submitStatus === "published"
            ? (isEn ? "Exam published successfully!" : "Đề thi đã xuất bản thành công!")
            : (isEn ? "Draft saved successfully!" : "Đã lưu nháp thành công!")
        );
        setTimeout(() => router.push("/admin/exams"), 1200);
      } else {
        showToast("error", data.error || (isEn ? "Failed to save exam" : "Lưu thất bại"));
      }
    } catch {
      showToast("error", isEn ? "Server connection error" : "Lỗi kết nối máy chủ");
    } finally {
      setIsSaving(false);
    }
  };

  const shouldShowSections = 
    form.category === "listening" || 
    mode === "edit" || 
    isFileParsed || 
    form.sections.some(s => (s.content && s.content.trim() !== "") || (s.answers && s.answers.trim() !== ""));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Toast Alert */}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/exams"
            className="p-2 rounded-xl text-slate-400 hover:text-[#0d153a] hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-[#0d153a]">
              {mode === "create" ? (isEn ? "Create New Cambridge Exam" : "Tạo đề thi Cambridge mới") : (isEn ? "Edit Cambridge Exam" : "Chỉnh sửa đề thi")}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {isEn ? "Enter information or auto-import exam content file" : "Nhập thông tin hoặc tải file tự động đọc nội dung đề thi"}
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: EXAM INFORMATION (THÔNG TIN ĐỀ THI) ────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-5">
        <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
            1
          </span>
          {isEn ? "Exam Information" : "Thông tin đề thi"}
        </h2>

        {/* Title */}
        <div>
          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
            {isEn ? "Exam Title" : "Tiêu đề đề thi"} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={isEn ? "e.g. Cambridge IELTS 17 – Test 1 Listening" : "VD: Cambridge IELTS 17 – Test 1 Listening"}
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
            {isEn ? "Short Description" : "Mô tả ngắn"}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder={isEn ? "A short description of this exam..." : "Mô tả ngắn gọn về đề thi này..."}
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
              {isEn ? "Cambridge No." : "Cambridge số"}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.cambridge_no}
              onChange={(e) => setForm((p) => ({ ...p, cambridge_no: e.target.value }))}
              placeholder={isEn ? "e.g. 17" : "VD: 17"}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors ${
                errors.cambridge_no ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50 focus:border-[#3B5C37]"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
              {isEn ? "Test No." : "Test số"}
            </label>
            <input
              type="number"
              min={1}
              max={4}
              value={form.test_no}
              onChange={(e) => setForm((p) => ({ ...p, test_no: e.target.value }))}
              placeholder={isEn ? "e.g. 1" : "VD: 1"}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#0d153a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B5C37]/30 transition-colors ${
                errors.test_no ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50 focus:border-[#3B5C37]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* ── AUTO IMPORT FILE & SMART CONTENT PARSER (Disabled for Listening) ── */}
      {form.category !== "listening" && (
        <div className="bg-gradient-to-br from-[#EEF1E2] via-[#FAF8F2] to-[#FFF3D6] rounded-3xl border-2 border-[#C5CEAB] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#5D6B2D] text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1b3d1e] flex items-center gap-2">
                  <span>{isEn ? "Smart File Reader & AI Converter" : "Quét File Tự Động & Đọc Nội Dung Đề Thi"}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#5D6B2D] text-white">
                    GEMINI AI
                  </span>
                </h2>
                <p className="text-xs font-semibold text-[#5C6648] mt-0.5">
                  {isEn
                    ? "Upload file (.json, .txt, .md, .pdf, .docx). Gemini AI auto-extracts title, passages & answers."
                    : "Tải file đề thi (.json, .txt, .md, .pdf, .docx) để AI tự động bóc tách Tiêu đề, Cambridge, Phần thi và Đáp án."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoImportOpen(!autoImportOpen)}
              className="p-1.5 rounded-xl bg-white border border-[#C5CEAB] text-[#5D6B2D] hover:bg-[#EEF1E2] transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              {autoImportOpen ? (
                <>
                  <span>Thu gọn</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Mở tải file</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {autoImportOpen && (
            <div className="space-y-4 pt-2 border-t border-[#C5CEAB]/60">
              {/* Input Mode Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportTab("file")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    importTab === "file"
                      ? "bg-[#5D6B2D] text-white shadow-sm"
                      : "bg-white text-[#5C6648] hover:bg-[#EEF1E2]"
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span>{isEn ? "Upload File (.json, .pdf, .txt, .md)" : "Gửi File Đề Thi"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab("text")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    importTab === "text"
                      ? "bg-[#5D6B2D] text-white shadow-sm"
                      : "bg-white text-[#5C6648] hover:bg-[#EEF1E2]"
                  }`}
                >
                  <Code className="w-4 h-4" />
                  <span>{isEn ? "Paste Raw Text / JSON" : "Dán Văn Bản / JSON"}</span>
                </button>
              </div>

              {importTab === "file" ? (
                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragOver 
                      ? "border-[#5D6B2D] bg-[#EEF1E2] scale-[1.01]" 
                      : "border-[#5D6B2D]/40 bg-white/80 hover:bg-white"
                  }`}
                >
                  <input
                    type="file"
                    accept=".json,.txt,.md,.doc,.docx,.pdf,.csv"
                    disabled={isParsingFile}
                    onDragOver={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={() => setIsDragOver(false)}
                    onChange={(e) => {
                      setIsDragOver(false);
                      if (e.target.files?.[0]) handleFileImport(e.target.files[0]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  {isParsingFile ? (
                    <div className="space-y-2 py-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#5D6B2D] mx-auto" />
                      <p className="text-xs font-black text-[#1b3d1e]">
                        {isEn ? "Gemini AI is reading and extracting exam content..." : "AI (Gemini) đang đọc và bóc tách dữ liệu đề thi..."}
                      </p>
                      <p className="text-[10px] text-[#5C6648]">Vui lòng đợi trong giây lát...</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-[#5D6B2D] mx-auto mb-2" />
                      <p className="text-xs font-black text-[#1b3d1e]">
                        {fileName ? (
                          <span className="text-[#5D6B2D] flex items-center justify-center gap-1">
                            <FileText className="w-4 h-4" /> {fileName}
                          </span>
                        ) : isEn ? (
                          "Click or drag file here (.pdf, .json, .txt, .md, .docx)"
                        ) : (
                          "Kéo thả hoặc nhấp để tải file đề thi (.pdf, .json, .txt, .md, .docx)"
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-[#8A9670] mt-1">
                        {isEn ? "Gemini AI automatically parses sections & answer key JSON" : "Gemini AI tự động trích xuất Tiêu đề, Bài đọc/Phần thi & Bảng đáp án JSON"}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={rawTextContent}
                    onChange={(e) => setRawTextContent(e.target.value)}
                    placeholder={
                      isEn
                        ? "Paste exam raw text or JSON object here...\ne.g. Cambridge IELTS 18 Test 1 Reading\nPassage 1...\nAnswers: 1. A  2. B  3. TRUE"
                        : "Dán nội dung văn bản đề thi hoặc JSON tại đây...\nVD: Cambridge IELTS 18 Test 1 Reading\nPassage 1...\nĐáp án: 1. A  2. B  3. TRUE"
                    }
                    className="w-full p-3.5 rounded-2xl border border-[#C5CEAB] bg-white text-xs font-mono text-[#1b3d1e] focus:outline-none focus:ring-2 focus:ring-[#5D6B2D]"
                  />
                  <button
                    type="button"
                    onClick={handleParseRawText}
                    className="px-4 py-2 rounded-xl bg-[#5D6B2D] text-white font-black text-xs hover:bg-[#4E5C23] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isEn ? "Parse Content" : "Phân Tích Nội Dung"}</span>
                  </button>
                </div>
              )}

              {/* Manual Entry Option */}
              <div className="text-center pt-2 border-t border-[#C5CEAB]/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsFileParsed(true);
                    setAutoImportOpen(false);
                  }}
                  className="text-xs font-bold text-[#5C6648] hover:text-[#5D6B2D] underline cursor-pointer transition-colors"
                >
                  {isEn ? "Or enter exam content manually without file upload" : "Hoặc tự nhập nội dung bài thi thủ công (Không dùng AI)"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: AUDIO UPLOAD (Listening Only) ────────────────────── */}
      {form.category === "listening" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#3B5C37]/10 text-[#3B5C37] text-xs font-black flex items-center justify-center">
              2
            </span>
            {isEn ? "Upload Audio File" : "Upload file Audio"}
          </h2>

          <input
            type="file"
            ref={fileInputRef}
            accept=".mp3,.wav,.ogg,.m4a,.aac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleAudioFile(e.target.files[0]);
            }}
          />

          {audioPreviewUrl ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#0d153a]">
                      {audioFile ? audioFile.name : (isEn ? "Audio uploaded" : "Audio đã upload")}
                    </p>
                    <p className="text-[11px] font-semibold text-[#3B5C37] flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      {isEn ? "Saved on Supabase Storage" : "Đã lưu trên Supabase Storage"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAudioPreviewUrl("");
                    setAudioFile(null);
                    setForm((p) => ({ ...p, audio_url: "" }));
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> {isEn ? "Delete audio" : "Xóa audio"}
                </button>
              </div>

              <audio ref={audioRef} src={audioPreviewUrl} onEnded={() => setIsAudioPlaying(false)} className="w-full" controls />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-8 text-center cursor-pointer transition-all"
            >
              {isUploadingAudio ? (
                <div className="space-y-2 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3B5C37] mx-auto" />
                  <p className="text-xs font-black text-[#0d153a]">{isEn ? "Uploading to server..." : "Đang upload lên server..."}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-8 h-8 text-[#3B5C37] mx-auto" />
                  <p className="text-xs font-black text-[#0d153a]">
                    {isEn ? "Drag & drop audio file here" : "Kéo thả file audio vào đây"}{" "}
                    <span className="text-[#3B5C37] underline">{isEn ? "or select file" : "hoặc nhấp để chọn file"}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isEn ? "Supports: MP3, WAV, OGG, M4A, AAC · Max 200MB" : "Hỗ trợ: MP3, WAV, OGG, M4A, AAC · Tối đa 200MB"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: SECTIONS CONTENT (Manual / Parsed Edit Sections) ── */}
      {shouldShowSections && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#0d153a] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3B5C37] text-white text-xs font-black flex items-center justify-center shadow-xs">
                {form.category === "listening" ? 3 : 2}
              </span>
              {form.category === "writing"
                ? `Nội dung ${form.sections.length} ${form.sections.length > 1 ? "Tasks" : "Task"}`
                : form.category === "speaking"
                ? `Nội dung ${form.sections.length} Parts`
                : form.category === "reading"
                ? `Nội dung ${form.sections.length} Bài đọc`
                : `Nội dung ${form.sections.length} Section`}
            </h2>

            <div className="flex items-center gap-2">
              {form.category === "writing" && form.sections.length < 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      sections: [
                        ...prev.sections,
                        {
                          section_no: prev.sections.length + 1,
                          title: "Task 2 - Essay Writing",
                          content: "",
                          answers: "",
                          audio_url: "",
                          image_url: "",
                        },
                      ],
                    }));
                    setExpandedSection(2);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  + Thêm Task 2
                </button>
              )}

              {form.category !== "listening" && !autoImportOpen && (
                <button
                  type="button"
                  onClick={() => setAutoImportOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#EEF1E2] text-[#5D6B2D] border border-[#C5CEAB] hover:bg-[#5D6B2D] hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>{isEn ? "Upload Another File (AI)" : "+ Tải file đề thi bằng AI"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {form.sections.map((sec, idx) => {
              const isExpanded = expandedSection === sec.section_no;

              return (
                <div
                  key={sec.section_no}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  <div
                    onClick={() => setExpandedSection(isExpanded ? null : sec.section_no)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-xs font-black text-[#0d153a] flex items-center justify-center shadow-xs">
                        {sec.section_no}
                      </span>
                      <div>
                        <h3 className="text-xs font-black text-[#0d153a]">{sec.title || `Section ${sec.section_no}`}</h3>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {sec.content ? `${sec.content.length} ký tự` : "Chưa có nội dung"}
                          {sec.answers ? " · Có đáp án" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {form.category === "writing" && form.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((prev) => {
                              const remaining = prev.sections.filter((s) => s.section_no !== sec.section_no);
                              const remapped = remaining.map((s, i) => ({ ...s, section_no: i + 1 }));
                              return { ...prev, sections: remapped };
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Xóa Task
                        </button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 space-y-4 bg-white border-t border-slate-200">
                      <div>
                        <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                          {form.category === "writing" ? "TIÊU ĐỀ TASK" : "TIÊU ĐỀ SECTION"}
                        </label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((p) => {
                              const secs = [...p.sections];
                              secs[idx] = { ...secs[idx], title: val };
                              return { ...p, sections: secs };
                            });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0d153a] focus:outline-none focus:border-[#3B5C37]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                          {form.category === "writing" ? "YÊU CẦU ĐỀ BÀI (PROMPT)" : "NỘI DUNG / TRANSCRIPT / CÂU HỎI"}
                        </label>
                        <textarea
                          rows={6}
                          value={sec.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((p) => {
                              const secs = [...p.sections];
                              secs[idx] = { ...secs[idx], content: val };
                              return { ...p, sections: secs };
                            });
                          }}
                          placeholder={form.category === "writing" ? "Nhập yêu cầu đề bài Task..." : "Nhập nội dung bài đọc, transcript audio hoặc yêu cầu câu hỏi..."}
                          className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0d153a] focus:outline-none focus:border-[#3B5C37] transition-colors"
                        />
                      </div>

                      {/* Writing Task 1 Image Field */}
                      {form.category === "writing" && sec.section_no === 1 && (
                        <div>
                          <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                            HÌNH ẢNH ĐỀ BÀI TASK 1 (BIỂU ĐỒ / SƠ ĐỒ / HÌNH MINH HỌA)
                          </label>
                          
                          {sec.image_url ? (
                            <div className="relative border border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                                  <span>Hình ảnh biểu đồ Task 1</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm((p) => {
                                      const secs = [...p.sections];
                                      secs[idx] = { ...secs[idx], image_url: "", answers: "" };
                                      return { ...p, sections: secs };
                                    });
                                  }}
                                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Xóa ảnh
                                </button>
                              </div>

                              <div className="relative max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center">
                                <img
                                  src={sec.image_url}
                                  alt="Task 1 Chart"
                                  className="max-h-64 object-contain rounded-lg"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={sec.image_url || ""}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    setForm((p) => {
                                      const secs = [...p.sections];
                                      secs[idx] = {
                                        ...secs[idx],
                                        image_url: url,
                                        answers: url ? JSON.stringify({ image_url: url }, null, 2) : ""
                                      };
                                      return { ...p, sections: secs };
                                    });
                                  }}
                                  placeholder="Dán đường dẫn ảnh (URL) biểu đồ Task 1..."
                                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0d153a] focus:outline-none focus:border-[#3B5C37]"
                                />
                                
                                <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0d153a] text-xs font-bold transition-all cursor-pointer border border-slate-200 shrink-0">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Tải ảnh lên</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const fd = new FormData();
                                        fd.append("file", file);
                                        const res = await authFetch("/api/admin/exams/upload-image", { method: "POST", body: fd });
                                        const data = await res.json();
                                        if (res.ok && data.url) {
                                          setForm((p) => {
                                            const secs = [...p.sections];
                                            secs[idx] = {
                                              ...secs[idx],
                                              image_url: data.url,
                                              answers: JSON.stringify({ image_url: data.url }, null, 2)
                                            };
                                            return { ...p, sections: secs };
                                          });
                                          showToast("success", isEn ? "Uploaded Task 1 chart image!" : "Tải ảnh biểu đồ Task 1 thành công!");
                                        } else {
                                          showToast("error", data.error || (isEn ? "Failed to upload image" : "Tải ảnh thất bại"));
                                        }
                                      } catch {
                                        showToast("error", isEn ? "Upload image error" : "Lỗi khi tải ảnh");
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answers block or AI Grading notice */}
                      {form.category === "writing" ? (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900">
                              Kỹ năng Writing không cần đáp án cố định
                            </p>
                            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                              Bài làm của học viên sẽ được AI tự động chấm điểm và nhận xét chi tiết dựa trên các tiêu chí IELTS Band Descriptors (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                            ĐÁP ÁN (ĐỊNH DẠNG JSON)
                          </label>
                          <textarea
                            rows={5}
                            value={sec.answers}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((p) => {
                                const secs = [...p.sections];
                                secs[idx] = { ...secs[idx], answers: val };
                                return { ...p, sections: secs };
                              });
                            }}
                            placeholder={'{\n  "1": "A",\n  "2": "castle",\n  "3": "TRUE"\n}'}
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-[#0d153a] focus:outline-none focus:border-[#3B5C37] transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSubmit("draft")}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-xs hover:bg-slate-50 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isEn ? "Save Draft" : "Lưu Nháp"}</span>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSubmit("published")}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#3B5C37] text-white font-black text-xs shadow-md hover:bg-[#2C4728] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{isEn ? "Publish Exam" : "Xuất Bản Đề Thi"}</span>
        </button>
      </div>
    </div>
  );
}
