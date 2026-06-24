import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: learningPathId } = await params;

    if (!learningPathId) {
      return NextResponse.json({ error: "learningPathId is required" }, { status: 400 });
    }

    // 1. Idempotency Check: check if daily_task_sets already exist for this path
    const { data: existingSets, error: fetchSetsError } = await supabaseAdmin
      .from("daily_task_sets")
      .select("*")
      .eq("learning_path_id", learningPathId)
      .limit(1);

    if (fetchSetsError) {
      console.error("Error checking existing daily task sets:", fetchSetsError);
      return NextResponse.json({ error: "Database error checking daily task sets" }, { status: 500 });
    }

    if (existingSets && existingSets.length > 0) {
      console.log(`Daily task sets already generated for path: ${learningPathId}`);
      return NextResponse.json({ success: true, message: "Already generated", generated: false });
    }

    // 2. Fetch the learning path
    const { data: pathData, error: pathError } = await supabaseAdmin
      .from("learning_paths")
      .select("*")
      .eq("id", learningPathId)
      .single();

    if (pathError || !pathData) {
      console.error("Error fetching learning path:", pathError);
      return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
    }

    const aiSuggestion = pathData.ai_suggestion;
    if (!aiSuggestion || !aiSuggestion.phases) {
      return NextResponse.json({ error: "Learning path suggestion is missing phases" }, { status: 400 });
    }

    // 3. Fetch all available exams
    const { data: availableExams, error: examsError } = await supabaseAdmin
      .from("exams")
      .select("id, title, category, description")
      .eq("status", "published");

    if (examsError) {
      console.error("Error fetching available exams:", examsError);
      return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
    }

    // fallback mapping if exams are not published or empty: query draft/any exams
    let examsList = availableExams || [];
    if (examsList.length === 0) {
      const { data: fallbackExams } = await supabaseAdmin
        .from("exams")
        .select("id, title, category, description");
      examsList = fallbackExams || [];
    }

    // 4. Flatten all tasks
    const allTasksFlattened: any[] = [];
    aiSuggestion.phases.forEach((phase: any) => {
      if (phase.tasks) {
        phase.tasks.forEach((task: any) => {
          allTasksFlattened.push({
            id: task.id,
            title: task.title,
            phaseId: phase.id,
            phaseSkills: phase.skills || [],
          });
        });
      }
    });

    if (allTasksFlattened.length === 0) {
      return NextResponse.json({ success: true, message: "No tasks to map" });
    }

    // 5. GPT Mapping
    let gptMappingList: any[] = [];
    try {
      const systemPrompt = `Bạn là chuyên gia giảng dạy IELTS. Nhiệm vụ: với mỗi "task" học tập (mục tiêu học cụ thể), hãy chọn ra 1 đề thi (exam) phù hợp nhất từ danh sách exams có sẵn, dựa trên việc đề thi đó có category (skill) khớp với 1 trong các skills của task, và nội dung đề thi phù hợp để luyện tập mục tiêu trong title của task.
      
Chú ý:
- Category của exam trong DB là chữ thường: "listening", "reading", "writing", "speaking".
- Skills của task có thể là: "Vocabulary", "Grammar", "Listening", "Reading", "Writing", "Speaking".
- Hãy map "Vocabulary" hoặc "Grammar" sang đề "reading" hoặc "listening" phù hợp.

Trả về CHỈ JSON, không có text khác, theo format:
[{ "taskId": "task_1_1", "examId": "uuid-cua-exam", "reasoning": "lý do ngắn gọn bằng tiếng Việt" }, ...]

Nếu không tìm được exam phù hợp cho 1 task nào, bỏ qua task đó trong kết quả trả về.`;

      const userPrompt = JSON.stringify({
        tasks: allTasksFlattened.map(t => ({ id: t.id, title: t.title, skills: t.phaseSkills })),
        exams: examsList.map(e => ({ id: e.id, title: e.title, category: e.category, description: e.description })),
      });

      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent([
        { role: "user", parts: [{ text: systemPrompt + "\n\nInput:\n" + userPrompt }] }
      ]);

      const responseText = result.response.text();
      gptMappingList = JSON.parse(responseText);
      console.log("GPT mapping response parsed successfully:", gptMappingList.length, "items");
    } catch (gptError) {
      console.error("GPT Mapping failed (falling back to rule-based):", gptError);
      gptMappingList = [];
    }

    // Convert GPT list to lookup map
    const gptMap: Record<string, { examId: string; reasoning: string }> = {};
    if (Array.isArray(gptMappingList)) {
      gptMappingList.forEach((item: any) => {
        if (item && item.taskId && item.examId) {
          gptMap[item.taskId] = {
            examId: item.examId,
            reasoning: item.reasoning || "Được gợi ý bởi AI dựa trên mục tiêu bài học",
          };
        }
      });
    }

    // 6. Build final mappings & daily task sets
    const taskExamMap: Record<string, { examId: string; reasoning: string }> = {};
    const dailyTaskRows: any[] = [];
    let globalDayIndex = 0;
    const dailyHours = aiSuggestion.dailyHours || 2;

    const focusSkills = aiSuggestion.focusSkills || ["Listening", "Reading", "Writing", "Speaking"];
    const skillsToAlternate = focusSkills.map((s: string) => s.toLowerCase());

    for (const phase of aiSuggestion.phases) {
      if (!phase.tasks) continue;

      for (const task of phase.tasks) {
        let finalExamId = gptMap[task.id]?.examId;
        let reasoning = gptMap[task.id]?.reasoning || "Được phân bổ tự động theo kỹ năng giai đoạn";

        // Validate exam exists
        const examExists = examsList.some(e => e.id === finalExamId);
        if (!finalExamId || !examExists) {
          // Rule-based Fallback
          const matchedExam = findFallbackExam(phase.skills || [], examsList);
          if (matchedExam) {
            finalExamId = matchedExam.id;
            reasoning = `Hệ thống tự động phân bổ đề [${matchedExam.title}] do không tìm được đề phù hợp trực tiếp qua AI.`;
          } else {
            console.log(`No exam fallback found for task: ${task.title}`);
            continue; // Skip task if no exam at all
          }
        }

        taskExamMap[task.id] = { examId: finalExamId, reasoning };

        // Save mapping to learning_path_task_exam_map
        const { error: mapInsertError } = await supabaseAdmin
          .from("learning_path_task_exam_map")
          .insert({
            learning_path_id: learningPathId,
            phase_id: phase.id,
            task_id: task.id,
            exam_id: finalExamId,
            gpt_reasoning: reasoning
          });

        if (mapInsertError) {
          console.error(`Error inserting map for task ${task.id}:`, mapInsertError);
        }

        // Calculate days needed
        const totalDays = Math.ceil((task.estimatedHours || 2) / dailyHours);

        for (let dayInTask = 1; dayInTask <= totalDays; dayInTask++) {
          globalDayIndex += 1;

          // Alternate skills day by day
          const currentSkill = skillsToAlternate[(globalDayIndex - 1) % skillsToAlternate.length];
          const examsOfSkill = examsList.filter(e => e.category === currentSkill);
          
          let selectedExam = null;
          if (examsOfSkill.length > 0) {
            const cycleIndex = Math.floor((globalDayIndex - 1) / skillsToAlternate.length) % examsOfSkill.length;
            selectedExam = examsOfSkill[cycleIndex];
          } else {
            // Fallback to the task's matched exam
            selectedExam = examsList.find(e => e.id === finalExamId) || examsList[0];
          }

          const displaySkill = currentSkill.charAt(0).toUpperCase() + currentSkill.slice(1);
          const task_title = `[Ngày ${globalDayIndex}] Luyện kỹ năng ${displaySkill}: ${selectedExam.title} (Mục tiêu: ${task.title})`;

          dailyTaskRows.push({
            user_id: pathData.user_id,
            learning_path_id: learningPathId,
            phase_id: phase.id,
            task_id: task.id,
            task_title: task_title,
            day_index: globalDayIndex,
            day_in_task: dayInTask,
            total_days_in_task: totalDays,
            exam_id: selectedExam.id,
            unlocked: globalDayIndex === 1, // Only Day 1 starts unlocked
            status: "pending"
          });
        }
      }
    }

    if (dailyTaskRows.length > 0) {
      const { error: insertSetsError } = await supabaseAdmin
        .from("daily_task_sets")
        .insert(dailyTaskRows);

      if (insertSetsError) {
        console.error("Error inserting daily task sets:", insertSetsError);
        return NextResponse.json({ error: "Failed to save daily task sets" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully generated daily tasks",
      totalDays: globalDayIndex,
      generated: true
    });
  } catch (error: any) {
    console.error("Error in generate-daily-tasks route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// Fallback logic helper
function findFallbackExam(skills: string[], examsList: any[]) {
  const normalizedSkills = skills.map(s => s.toLowerCase());

  // 1. Look for exam with matching category
  for (const skill of normalizedSkills) {
    const matched = examsList.find(e => e.category === skill);
    if (matched) return matched;
  }

  // 2. Map Vocabulary/Grammar to Reading
  if (normalizedSkills.includes("vocabulary") || normalizedSkills.includes("grammar")) {
    const matched = examsList.find(e => e.category === "reading");
    if (matched) return matched;
  }

  // 3. Absolute fallback: pick first available exam
  if (examsList.length > 0) {
    return examsList[0];
  }

  return null;
}
