import React from "react";
import ExamForm from "../_components/ExamForm";

export const metadata = {
  title: "Tạo đề thi mới | QualiCode Admin",
  description: "Tạo đề thi Cambridge IELTS Listening mới",
};

export default function NewExamPage() {
  return <ExamForm mode="create" />;
}
