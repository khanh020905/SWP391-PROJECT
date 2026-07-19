import { supabaseAdmin } from "./supabase";

function getQuestionsBlock(content: string): string {
  if (!content) return "";
  const regex = /\bQuestions\b/i;
  const match = content.match(regex);
  if (match && match.index !== undefined) {
    return content.substring(match.index);
  }
  return content;
}

function parseQuestionText(content: string, qNo: number): string {
  const qBlock = getQuestionsBlock(content);
  const nextQNo = qNo + 1;
  // Match qNo but not when it is part of a range like "1-6" or "1 to 6"
  const regexStr = `\\b${qNo}\\b(?!\\s*(?:-|–|—|to)\\s*\\d+)[.\\s\\)\\-–—]*([\\s\\S]*?)(?=\\b${nextQNo}\\b(?!\\s*(?:-|–|—|to)\\s*\\d+)[.\\s\\)\\-–—]|\\bQuestions\\b|\\bReading Passage\\b|$)`;
  const regex = new RegExp(regexStr);
  const match = qBlock.match(regex);
  if (match) {
    let text = match[1].trim();
    // Clean trailing dots, spaces, line breaks
    text = text.replace(/^[.\s\)\-–—\s]+/, "").replace(/[.\s\)\-–—\s]+$/, "");
    return text;
  }
  return "";
}

function parseOptions(text: string): string[] | null {
  const regex = /\b([A-E])\b[.\s\)\-–—]+([\s\S]*?)(?=\b[A-E]\b[.\s\)\-–—]|$)/g;
  const options: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].toUpperCase();
    const val = match[2].trim();
    options.push(`${key}. ${val}`);
  }
  return options.length >= 2 ? options : null;
}

export function cleanSectionContent(content: string | null): string | null {
  if (!content) return content;
  // Match "Questions" or "QUESTIONS" at a word boundary case-insensitively
  const regex = /\bQuestions\b/i;
  const match = content.match(regex);
  if (match) {
    let index = match.index;
    // Check if there is a markdown divider like "---" or "___" right before the questions block
    const beforeText = content.substring(0, index);
    const dividerMatch = beforeText.match(/[-*_]{3,}\s*$/);
    if (dividerMatch) {
      index = dividerMatch.index;
    }
    return content.substring(0, index).trim();
  }
  return content;
}

export async function autoGenerateQuestions(
  examId: string,
  category: string,
  sections: any[]
): Promise<any[]> {
  // Only auto-generate for reading, listening, and speaking
  if (category !== "reading" && category !== "listening" && category !== "speaking") {
    return sections;
  }

  if (category === "speaking") {
    console.log(`[Auto Generator] Generating questions for speaking exam ${examId}...`);
    // 1. Delete existing questions for this exam
    const { error: deleteError } = await supabaseAdmin
      .from("questions")
      .delete()
      .eq("exam_id", examId);

    if (deleteError) {
      console.error("[Auto Generator] Error deleting old questions:", deleteError);
    }

    const questionsToInsert: any[] = [];
    for (const s of sections) {
      if (s.section_no === 1 || s.section_no === 3) {
        let qsArr: string[] = [];
        if (typeof s.answers === "string" && s.answers.trim()) {
          try {
            qsArr = JSON.parse(s.answers);
          } catch {}
        } else if (Array.isArray(s.answers)) {
          qsArr = s.answers;
        }

        if (Array.isArray(qsArr)) {
          qsArr.forEach((qText: string, idx: number) => {
            if (qText && qText.trim()) {
              questionsToInsert.push({
                exam_id: examId,
                section: s.section_no,
                question_type: "speaking",
                text: qText.trim(),
                correct_answer: "",
                options: null,
                order_index: idx + 1,
              });
            }
          });
        }
      }
    }

    if (questionsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("questions").insert(questionsToInsert);
      if (insertError) {
        console.error("[Auto Generator] Error inserting speaking questions:", insertError);
      }
    }
    return sections;
  }

  console.log(`[Auto Generator] Generating questions for exam ${examId} (${category})...`);

  // 1. Delete existing questions for this exam
  const { error: deleteError } = await supabaseAdmin
    .from("questions")
    .delete()
    .eq("exam_id", examId);

  if (deleteError) {
    console.error("[Auto Generator] Error deleting old questions:", deleteError);
  }

  const questionsToInsert: any[] = [];
  const processedSections = [];

  for (const s of sections) {
    let answersObj: any = null;
    if (typeof s.answers === "string" && s.answers.trim()) {
      try {
        answersObj = JSON.parse(s.answers);
      } catch (e) {
        console.error(`[Auto Generator] Invalid JSON for section ${s.section_no}:`, s.answers);
      }
    } else if (s.answers && typeof s.answers === "object") {
      answersObj = s.answers;
    }

    // Clean s.content of questions if it is reading
    let cleanContent = s.content || null;
    if (category === "reading" && cleanContent) {
      cleanContent = cleanSectionContent(cleanContent);
    }

    processedSections.push({
      ...s,
      content: cleanContent,
    });

    if (answersObj) {
      const qKeys = Object.keys(answersObj).filter((k) => !isNaN(parseInt(k)));
      for (const qKey of qKeys) {
        const qNo = parseInt(qKey);
        const correctAnswer = String(answersObj[qKey]).trim();
        
        let qText = "";
        if (s.content) {
          qText = parseQuestionText(s.content, qNo);
        }

        // Clean option text out of question prompt
        let options: string[] | null = null;
        let question_type = "fill_blank";

        const ansClean = correctAnswer.trim();
        const ansUpper = ansClean.toUpperCase();

        if (["TRUE", "FALSE", "NOT GIVEN", "YES", "NO"].includes(ansUpper)) {
          question_type = "true_false";
        } else if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$/i.test(ansClean)) {
          question_type = "matching";
          options = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];
        } else if (/^[A-K]$/.test(ansUpper)) {
          // Check for MCQs
          const parsedOpts = parseOptions(qText);
          if (parsedOpts && parsedOpts.length >= 2) {
            question_type = "multiple_choice";
            options = parsedOpts;
            const firstOptIndex = qText.search(/\b[A-E]\b[.\s\)\-–—]+/);
            if (firstOptIndex !== -1) {
              qText = qText.substring(0, firstOptIndex).trim();
            }
          } else {
            question_type = "matching";
            options = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
          }
        } else {
          question_type = "fill_blank";
        }

        // Fallback for empty text
        if (!qText || qText.trim() === "") {
          qText = `Question ${qNo}`;
        }

        questionsToInsert.push({
          exam_id: examId,
          section: s.section_no,
          question_type,
          text: qText,
          correct_answer: ansClean,
          options,
          order_index: qNo,
        });
      }
    }
  }

  if (questionsToInsert.length > 0) {
    console.log(`[Auto Generator] Inserting ${questionsToInsert.length} questions into DB...`);
    const { error: insertError } = await supabaseAdmin
      .from("questions")
      .insert(questionsToInsert);
    if (insertError) {
      console.error("[Auto Generator] Error inserting questions:", insertError);
    } else {
      console.log("[Auto Generator] Successfully inserted questions!");
    }
  }

  return processedSections;
}
