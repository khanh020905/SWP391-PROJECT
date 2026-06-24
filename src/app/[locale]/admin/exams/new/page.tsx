import React, { Suspense } from "react";
import ExamForm from "../_components/ExamForm";
import { Loader2 } from "lucide-react";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const isEn = params.locale === "en";
  return {
    title: isEn ? "Create New Exam | QualiCode Admin" : "Tạo đề thi mới | QualiCode Admin",
    description: isEn ? "Create new Cambridge IELTS Listening exam" : "Tạo đề thi Cambridge IELTS Listening mới",
  };
}

export default function NewExamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B5C37]" />
        </div>
      }
    >
      <ExamForm mode="create" />
    </Suspense>
  );
}
