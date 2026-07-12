"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export default function ListeningCamReviewRedirect() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  useEffect(() => {
    router.replace(`/listening/cam-test/${testId}/result`);
  }, [router, testId]);

  return null;
}
