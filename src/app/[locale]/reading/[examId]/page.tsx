"use client";

import ReadingPracticePage from "../cam/[testId]/page";
import { useParams } from "next/navigation";

export default function CustomExamPage() {
  const params = useParams();
  const examId = params?.examId as string;

  // Forward custom examId to target testId expected by the Cambridge test component
  const paramsPromise = Promise.resolve({ testId: examId });

  return <ReadingPracticePage params={paramsPromise} />;
}
