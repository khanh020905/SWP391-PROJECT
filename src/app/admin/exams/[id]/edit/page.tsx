"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExamForm from "../../_components/ExamForm";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function EditExamPage() {
  const params = useParams();
  const id = params?.id as string;

  const [examData, setExamData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchExam() {
      try {
        const res = await fetch(`/api/admin/exams/${id}`);
        const data = await res.json();
        if (res.ok) {
          const exam = data.exam;
          // Transform sections from DB format to form format
          const sections = exam.exam_sections?.map((s: any) => ({
            section_no: s.section_no,
            title: s.title || `Section ${s.section_no}`,
            content: s.content || "",
            answers: s.answers ? JSON.stringify(s.answers, null, 2) : "",
          })) || [];

          // Ensure all 4 sections exist
          const fullSections = [1, 2, 3, 4].map((n) => {
            const existing = sections.find((s: any) => s.section_no === n);
            return existing || { section_no: n, title: `Section ${n}`, content: "", answers: "" };
          });

          setExamData({
            id: exam.id,
            title: exam.title,
            description: exam.description || "",
            cambridge_no: exam.cambridge_no?.toString() || "",
            test_no: exam.test_no?.toString() || "",
            status: exam.status,
            audio_url: exam.audio_url || "",
            sections: fullSections,
          });
        } else {
          setError(data.error || "Không thể tải thông tin đề thi");
        }
      } catch {
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B5C37]" />
        <p className="text-sm font-bold text-slate-400">Đang tải dữ liệu đề thi...</p>
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
          <p className="text-sm font-black text-[#0d153a]">Không tìm thấy đề thi</p>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <Link
          href="/admin/exams"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return <ExamForm mode="edit" initialData={examData} />;
}
