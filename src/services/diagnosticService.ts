import { supabase } from "@/lib/supabase";

export async function fetchDiagnosticQuestions() {
  let listening: any[] = [];
  try {
    // 1. Fetch listening exams from exams table that contain an audio_url
    const { data: exams, error: examErr } = await supabase
      .from("exams")
      .select("id, title, audio_url, cambridge_no, test_no")
      .eq("category", "listening")
      .not("audio_url", "is", null);

    if (exams && exams.length > 0) {
      // Filter out exams that do not have their corresponding JSON files (e.g. Cambridge 7 Test 1)
      const validExams = exams.filter(e => !(e.cambridge_no === 7 && e.test_no === 1));
      
      if (validExams.length > 0) {
        // Pick a random listening exam from validExams
        const randomExam = validExams[Math.floor(Math.random() * validExams.length)];
      
      // Load static JSON file to extract rich question text
      let localTestData: any = null;
      if (randomExam.cambridge_no && randomExam.test_no) {
        try {
          const resolvedTestId = `cam${randomExam.cambridge_no}-test-${randomExam.test_no}`;
          const isBrowser = typeof window !== "undefined";
          
          if (isBrowser) {
            const res = await fetch(`/data/cam-tests/${resolvedTestId}.json`);
            if (res.ok) {
              localTestData = await res.json();
            }
          } else {
            try {
              const req = eval('require');
              const fs = req("fs");
              const path = req("path");
              const filePath = path.join(process.cwd(), "public", "data", "cam-tests", `${resolvedTestId}.json`);
              if (fs.existsSync(filePath)) {
                localTestData = JSON.parse(fs.readFileSync(filePath, "utf8"));
              }
            } catch (err) {
              console.error("Server-side JSON read failed:", err);
            }
          }
        } catch (e) {
          console.error("Failed to load local listening test JSON:", e);
        }
      }
      
      // 2. Fetch sections for this exam
      const { data: dbSections } = await supabase
        .from("exam_sections")
        .select("id, section_no, title, content, answers")
        .eq("exam_id", randomExam.id)
        .order("section_no", { ascending: true });

      if (dbSections && dbSections.length > 0) {
        // Use Section 1 questions
        const section1 = dbSections[0];
        const answersObj = section1.answers || {};
        const keys = Object.keys(answersObj).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Take the first 3 questions from Section 1
        const targetKeys = keys.slice(0, 3);
        
        const localSection1 = localTestData?.sections?.[0];
        const block = localSection1?.blocks?.[0];
        
        listening = targetKeys.map((key, idx) => {
          const correctAns = answersObj[key];
          const qNum = parseInt(key);
          
          let extractedText = `Fill in the blank for Question ${key}.`;
          let options: any[] = [];
          let qType = "fill_in_blank";

          if (block) {
            const type = block.type;
            const targetBrace = `{${qNum}}`;
            
            if (type === 'note_completion' || type === 'form_completion' || type === 'sentence_completion') {
              const template = block.content?.template || '';
              const lines = template.split('\n');
              const targetLine = lines.find((l: string) => l.includes(targetBrace));
              if (targetLine) {
                let cleaned = targetLine.replace(/^[-*•\s]+/g, '').replace(/\*\*/g, '').trim();
                cleaned = cleaned.replace(targetBrace, '_______');
                cleaned = cleaned.replace(/\{\d+\}/g, '_______');
                extractedText = cleaned;
              }
            } else if (type === 'table_completion') {
              const tableRows = block.content?.tableRows || [];
              let foundCell = '';
              for (const row of tableRows) {
                if (Array.isArray(row)) {
                  const cell = row.find((c: any) => c && typeof c === 'string' && c.includes(targetBrace));
                  if (cell) {
                    foundCell = cell;
                    break;
                  }
                }
              }
              if (foundCell) {
                let cleaned = foundCell.replace(/^[-*•\s]+/g, '').replace(/\*\*/g, '').trim();
                cleaned = cleaned.replace(targetBrace, '_______');
                cleaned = cleaned.replace(/\{\d+\}/g, '_______');
                extractedText = cleaned;
              }
            } else if (type === 'multiple_choice') {
              const questions = block.content?.questions || [];
              const matchedQ = questions.find((q: any) => q.qNum === qNum || q.number === qNum);
              if (matchedQ) {
                extractedText = matchedQ.text || "";
                options = matchedQ.options || [];
                qType = "multiple_choice";
              }
            } else if (type === 'multiple_choice_multi') {
              extractedText = block.content?.text || "";
              options = block.content?.options || [];
              qType = "multiple_choice";
            } else if (type === 'matching') {
              const items = block.content?.items || [];
              const matchedItem = items.find((item: any) => item.qNum === qNum || item.number === qNum);
              if (matchedItem) {
                extractedText = matchedItem.text || "";
              }
            }
          }

          return {
            id: `l${idx + 1}`,
            skill: "listening",
            content: {
              test_name: randomExam.title,
              transcript: section1.content || ""
            },
            extra_data: {
              type: qType,
              questionText: extractedText,
              options: options,
              correctAnswer: correctAns,
              answers: [correctAns],
              audioSrc: randomExam.audio_url
            }
          };
        });
      }
    }
  }
  } catch (err) {
    console.error("Listening diagnostic Cambridge query failed:", err);
  }

  let reading: any[] = [];
  try {
    // 1. Fetch reading exams from exams table
    const { data: readingExams } = await supabase
      .from("exams")
      .select("id, title")
      .eq("category", "reading");

    let loadedFromExams = false;

    if (readingExams && readingExams.length > 0) {
      // Pick a random reading exam with at least 2 sections (try up to 10 times)
      let randomExam = null;
      let dbSections: any[] = [];
      
      for (let attempt = 0; attempt < 10; attempt++) {
        randomExam = readingExams[Math.floor(Math.random() * readingExams.length)];
        const { data, error } = await supabase
          .from("exam_sections")
          .select("id, section_no, title, content")
          .eq("exam_id", randomExam.id)
          .order("section_no", { ascending: true });
        
        if (!error && data && data.length >= 2) {
          dbSections = data;
          break;
        }
      }

      if (dbSections && dbSections.length >= 2) {
        const s1 = dbSections[0];
        const s2 = dbSections[1];

        // Fetch questions for Section 1
        const { data: qList1 } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", randomExam.id)
          .eq("section", s1.section_no)
          .order("order_index", { ascending: true });

        // Fetch questions for Section 2
        const { data: qList2 } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", randomExam.id)
          .eq("section", s2.section_no)
          .order("order_index", { ascending: true });

        if (qList1 && qList1.length > 0 && qList2 && qList2.length > 0) {
          // Passage 1: TFNG
          const tfngQs = qList1.filter(
            (q: any) =>
              q.question_type === "true_false_not_given" ||
              q.question_type === "tfng"
          );
          const selectedTfngQs = tfngQs.length >= 3 ? tfngQs.slice(0, 3) : qList1.slice(0, 3);

          reading.push({
            id: "r1",
            skill: "reading",
            content: {
              title: s1.title || `Passage 1`,
              content_html: s1.content || ""
            },
            extra_data: {
              type: "true_false_not_given",
              items: selectedTfngQs.map((q: any) => ({
                statement: q.text || "",
                correctAnswer: q.correct_answer || ""
              }))
            }
          });

          // Passage 2: MCQ
          const mcqQs = qList2.filter(
            (q: any) =>
              q.question_type === "multiple_choice" ||
              q.question_type === "mcq"
          );
          const selectedMcqQ = mcqQs.length > 0 ? mcqQs[0] : qList2[0];
          const options = Array.isArray(selectedMcqQ.options) ? selectedMcqQ.options : [];

          reading.push({
            id: "r2",
            skill: "reading",
            content: {
              title: s2.title || `Passage 2`,
              content_html: s2.content || ""
            },
            extra_data: {
              type: "multiple_choice",
              questionText: selectedMcqQ.text || "",
              options: options,
              correctAnswer: selectedMcqQ.correct_answer || ""
            }
          });

          loadedFromExams = true;
        }
      }
    }

    // Fallback to reading_passages table if we couldn't load from exams/exam_sections
    if (!loadedFromExams) {
      const { data: passagesList } = await supabase
        .from("reading_passages")
        .select("*")
        .eq("is_visible", true);
        
      const validPassages = passagesList ? passagesList.filter(p => p.questions && p.questions.length > 0) : [];
      if (validPassages.length >= 2) {
        const selected = validPassages.sort(() => 0.5 - Math.random()).slice(0, 2);
        
        // Passage 1: True/False/Not Given
        const p1 = selected[0];
        const p1TfngQs = (p1.questions || []).filter((q: any) => q.type === "true_false_not_given" || q.type === "tfng");
        const p1Questions = p1TfngQs.length >= 3 ? p1TfngQs.slice(0, 3) : (p1.questions || []).slice(0, 3);
        
        reading.push({
          id: "r1",
          skill: "reading",
          content: {
            title: p1.title,
            content_html: p1.content_html
          },
          extra_data: {
            type: "true_false_not_given",
            items: p1Questions.map((q: any) => ({
              statement: q.statement || q.text || q.prompt || "",
              correctAnswer: q.correct_answer || ""
            }))
          }
        });
        
        // Passage 2: Multiple Choice
        const p2 = selected[1];
        const p2McqQs = (p2.questions || []).filter((q: any) => q.type === "multiple_choice" || q.type === "mcq");
        const p2Question = p2McqQs.length > 0 ? p2McqQs[0] : (p2.questions || [])[0];
        
        reading.push({
          id: "r2",
          skill: "reading",
          content: {
            title: p2.title,
            content_html: p2.content_html
          },
          extra_data: {
            type: "multiple_choice",
            questionText: p2Question ? (p2Question.statement || p2Question.text || p2Question.prompt || "") : "",
            options: p2Question ? (p2Question.options || []) : [],
            correctAnswer: p2Question ? (p2Question.correct_answer || p2Question.correctAnswer || "") : ""
          }
        });
      }
    }
  } catch (err) {
    console.error("Reading diagnostic random query failed:", err);
  }

  let writing: any[] = [];
  try {
    const { data: tasks } = await supabase
      .from("writing_tasks")
      .select("*")
      .eq("is_visible", true);
      
    if (tasks && tasks.length > 0) {
      const task1s = tasks.filter(t => t.task_type === "task1");
      const task2s = tasks.filter(t => t.task_type === "task2");
      
      if (task1s.length > 0) {
        const t1 = task1s[Math.floor(Math.random() * task1s.length)];
        writing.push({
          id: "w1",
          skill: "writing",
          content: {
            task_type: "task1",
            description: t1.description,
            title: t1.title
          },
          extra_data: {
            chartDescription: t1.visual_description || ""
          }
        });
      }
      
      if (task2s.length > 0) {
        const t2 = task2s[Math.floor(Math.random() * task2s.length)];
        writing.push({
          id: "w2",
          skill: "writing",
          content: {
            task_type: "task2",
            description: t2.description,
            title: t2.title
          },
          extra_data: {}
        });
      }
    }
  } catch (err) {
    console.error("Writing diagnostic random query failed:", err);
  }

  let speaking: any[] = [];
  try {
    const { data: topics } = await supabase
      .from("speaking_topics")
      .select("*")
      .eq("is_active", true);
      
    if (topics && topics.length > 0) {
      const part1s = topics.filter(t => t.part === 1);
      const part2s = topics.filter(t => t.part === 2);
      
      if (part1s.length > 0) {
        const t1 = part1s[Math.floor(Math.random() * part1s.length)];
        speaking.push({
          id: "sp1",
          skill: "speaking",
          content: {
            questions: t1.questions
          },
          extra_data: {
            instruction: "Answer the following questions as you would in a real IELTS Speaking test. Write your answers."
          }
        });
      }
      
      if (part2s.length > 0) {
        const t2 = part2s[Math.floor(Math.random() * part2s.length)];
        speaking.push({
          id: "sp2",
          skill: "speaking",
          content: {
            cue_card: t2.questions?.cue_card || t2.topic,
            bullet_points: t2.questions?.bullet_points || []
          },
          extra_data: {
            instruction: "You have 1 minute to prepare, then speak for up to 2 minutes. Write your spoken response."
          }
        });
      }
    }
  } catch (err) {
    console.error("Speaking diagnostic random query failed:", err);
  }

  return {
    listening,
    reading,
    writing,
    speaking
  };
}

export async function saveDiagnosticResult(payload: {
  userId: string;
  overallBand: number;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  fullResult: any;
  answers: any;
}) {
  const { data: resultData, error: resultError } = await supabase
    .from("diagnostic_results")
    .insert({
      user_id: payload.userId,
      overall_band: payload.overallBand,
      listening_band: payload.listeningBand,
      reading_band: payload.readingBand,
      writing_band: payload.writingBand,
      speaking_band: payload.speakingBand,
      full_result: payload.fullResult,
      answers: payload.answers,
    })
    .select()
    .single();

  if (resultError) {
    console.error("Error saving diagnostic results:", resultError);
    throw resultError;
  }

  // Also save practice history row
  const { error: practiceError } = await supabase.from("practice_history").insert({
    user_id: payload.userId,
    category: "diagnostic",
    test_id: "diagnostic",
    test_name: "IELTS Diagnostic Test",
    score: payload.overallBand,
    total: 9,
    metadata: {
      listening_band: payload.listeningBand,
      reading_band: payload.readingBand,
      writing_band: payload.writingBand,
      speaking_band: payload.speakingBand,
      roadmap: payload.fullResult?.roadmap,
    },
  });

  if (practiceError) {
    console.error("Error saving diagnostic practice history:", practiceError);
  }

  return resultData;
}
