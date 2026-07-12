"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { useParams } from "next/navigation";
import ExamForm from "../../_components/ExamForm";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function EditExamPage() {
  const locale = useLocale();
  const isEn = locale === "en";

  const t = {
    errorLoad: isEn ? "Failed to load exam details" : "Không thể tải thông tin đề thi",
    errorConn: isEn ? "Server connection error" : "Lỗi kết nối máy chủ",
    loading: isEn ? "Loading exam data..." : "Đang tải dữ liệu đề thi...",
    notFound: isEn ? "Exam not found" : "Không tìm thấy đề thi",
    backToList: isEn ? "← Back to List" : "← Quay lại danh sách",
  };

  const params = useParams();
  const id = params?.id as string;

  const [examData, setExamData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchExam() {
      try {
        const res = await authFetch(`/api/admin/exams/${id}`);
        const data = await res.json();
        if (res.ok) {
          const exam = data.exam;
          const sections = exam.exam_sections?.map((s: any) => {
            let answersObj = s.answers || {};
            let audioUrl = "";
            let imageUrl = "";
            if (answersObj && typeof answersObj === "object") {
              audioUrl = answersObj.audio_url || "";
              imageUrl = answersObj.image_url || "";
              const { audio_url, image_url, ...rest } = answersObj;
              answersObj = rest;
            }
            return {
              section_no: s.section_no,
              title: s.title || `Section ${s.section_no}`,
              content: s.content || "",
              answers: Object.keys(answersObj).length > 0 ? JSON.stringify(answersObj, null, 2) : "",
              audio_url: audioUrl,
              image_url: imageUrl,
            };
          }) || [];

          setExamData({
            id: exam.id,
            title: exam.title,
            description: exam.description || "",
            cambridge_no: exam.cambridge_no?.toString() || "",
            test_no: exam.test_no?.toString() || "",
            status: exam.status,
            audio_url: exam.audio_url || "",
            category: exam.category || "listening",
            duration_minutes: exam.duration_minutes?.toString() || "30",
            sections: sections,
          });
        } else {
          setError(data.error || t.errorLoad);
        }
      } catch {
        setError(t.errorConn);
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [id, t.errorLoad, t.errorConn]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B5C37]" />
        <p className="text-sm font-bold text-slate-400">{t.loading}</p>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-[#0d153a]">{t.notFound}</p>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <Link
          href="/admin/exams"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          {t.backToList}
        </Link>
      </div>
    );
  }

  return <ExamForm mode="edit" initialData={examData} />;
}
