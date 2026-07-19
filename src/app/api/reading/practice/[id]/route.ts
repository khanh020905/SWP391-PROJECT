import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ALL_PASSAGES, READING_TEST_META } from "@/lib/readingMockData";
import { READING_ANSWER_KEY } from "@/lib/readingAnswerKey";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;
    console.log(">>> GET /api/reading/practice/[id] called with targetId:", targetId);

    if (!targetId) {
      return NextResponse.json({ error: "Missing practice exam ID" }, { status: 400 });
    }

    let targetSectionNo: number | null = null;
    let foundExam: any = null;
    let foundSections: any[] = [];
    let foundQuestions: any[] = [];

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

    // 1. Try querying Supabase if ID is UUID
    if (isUuid) {
      const { data: examData } = await supabaseAdmin
        .from("exams")
        .select("id, title, cambridge_no, test_no, category, duration_minutes")
        .eq("id", targetId)
        .single();

      if (examData) {
        foundExam = examData;
        const { data: secData } = await supabaseAdmin
          .from("exam_sections")
          .select("id, section_no, title, content")
          .eq("exam_id", targetId)
          .order("section_no", { ascending: true });

        const { data: qData } = await supabaseAdmin
          .from("questions")
          .select("id, section, question_type, text, options, order_index, correct_answer")
          .eq("exam_id", targetId)
          .order("order_index", { ascending: true });

        foundSections = secData || [];
        foundQuestions = qData || [];
      }
    } else {
      // 2. Try parsing Cambridge slug (e.g. cam-18-1-1 or cam-18-1)
      const camMatch = targetId.match(/^cam-(\d+)-(\d+)(?:-(\d+))?$/i);
      if (camMatch) {
        const camNo = parseInt(camMatch[1]);
        const testNo = parseInt(camMatch[2]);
        if (camMatch[3]) targetSectionNo = parseInt(camMatch[3]);

        const { data: examData } = await supabaseAdmin
          .from("exams")
          .select("id, title, cambridge_no, test_no, category, duration_minutes")
          .eq("cambridge_no", camNo)
          .eq("test_no", testNo)
          .eq("category", "reading")
          .maybeSingle();

        if (examData) {
          foundExam = examData;
          const { data: secData } = await supabaseAdmin
            .from("exam_sections")
            .select("id, section_no, title, content")
            .eq("exam_id", examData.id)
            .order("section_no", { ascending: true });

          const { data: qData } = await supabaseAdmin
            .from("questions")
            .select("id, section, question_type, text, options, order_index, correct_answer")
            .eq("exam_id", examData.id)
            .order("order_index", { ascending: true });

          foundSections = secData || [];
          foundQuestions = qData || [];
        }
      }
    }

    // 3. Return database record if found and has sections
    if (foundExam && foundSections.length > 0) {
      return NextResponse.json({
        exam: {
          ...foundExam,
          exam_sections: foundSections
        },
        questions: foundQuestions,
        targetSectionNo
      });
    }

    // If a UUID exam was queried but not found in DB (e.g. deleted by admin), return 404
    if (isUuid) {
      return NextResponse.json({ error: "Exam not found or deleted", exam: null, questions: [] }, { status: 404 });
    }

    // 4. Fallback to mock data from readingMockData.ts for mock/demo tests
    const mockSections = ALL_PASSAGES.map((p, idx) => ({
      id: p.id,
      section_no: idx + 1,
      title: p.title,
      content: p.paragraphs ? p.paragraphs.map(par => `<p><strong>${par.label}:</strong> ${par.text}</p>`).join("\n") : ""
    }));

    const mockQuestions: any[] = [];
    ALL_PASSAGES.forEach((p, idx) => {
      const secNo = idx + 1;
      (p.questions || []).forEach(q => {
        const qId = typeof q.id === "number" ? q.id : parseInt(String(q.id).replace(/\D/g, "")) || 1;
        mockQuestions.push({
          id: qId,
          section: secNo,
          order_index: qId,
          question_type: q.type,
          text: q.prompt || q.instruction || "",
          options: q.options ? q.options.map(opt => typeof opt === "string" ? opt : `${opt.key}. ${opt.text}`) : [],
          correct_answer: READING_ANSWER_KEY[qId] || ""
        });
      });
    });

    // Determine targetSectionNo for single passage mock test slugs
    if (targetId.includes("passage-1")) targetSectionNo = 1;
    else if (targetId.includes("passage-2")) targetSectionNo = 2;
    else if (targetId.includes("passage-3")) targetSectionNo = 3;

    return NextResponse.json({
      exam: {
        id: READING_TEST_META.id,
        title: READING_TEST_META.testTitle,
        cambridge_no: 1,
        test_no: 1,
        category: "reading",
        duration_minutes: READING_TEST_META.durationMinutes,
        exam_sections: mockSections
      },
      questions: mockQuestions,
      targetSectionNo
    });

  } catch (err: any) {
    console.error("GET /api/reading/practice/[id] error:", err);
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}
