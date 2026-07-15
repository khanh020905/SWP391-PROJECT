import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import CamTestClient from "./CamTestClient";
import { supabase } from "@/lib/supabase";

// Cambridge listening test page — ported from The IELTS Dictionary
// (Website-Ielts frontend/src/app/practice/listening/cam-test/[testId]/page.tsx).
// Test data (sections, answer keys, R2 audio URLs) is read from the static
// JSON exported to public/data/cam-tests/.

interface Props {
  params: Promise<{ testId: string }>;
}

export default async function CamTestPage({ params }: Props) {
  const { testId } = await params;

  let resolvedTestId = testId;

  // Check if testId is a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
  if (isUuid) {
    const { data: exam } = await supabase
      .from("exams")
      .select("cambridge_no, test_no")
      .eq("id", testId)
      .single();

    if (exam && exam.cambridge_no && exam.test_no) {
      resolvedTestId = `cam${exam.cambridge_no}-test-${exam.test_no}`;
    } else {
      notFound();
    }
  }

  // Test ids look like "cam11-test-1" — reject anything else so the id can't
  // escape the data dir
  if (!/^[a-z0-9-]+$/.test(resolvedTestId)) notFound();

  const filePath = path.join(process.cwd(), "public", "data", "cam-tests", `${resolvedTestId}.json`);

  let testData;
  try {
    testData = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    notFound();
  }

  return <CamTestClient testData={testData} />;
}
