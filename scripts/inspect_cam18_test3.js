const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";

const supabase = createClient(supabaseUrl, supabaseKey);

const EXAM_ID = "59943737-891b-44c8-9a49-9106165c789e"; // Cambridge 18 Test 3

async function run() {
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("title")
    .eq("id", EXAM_ID)
    .single();

  if (examError) {
    console.error("Error fetching exam:", examError);
    return;
  }

  console.log(`Exam: ${exam.title}`);

  const { data: sections, error: secError } = await supabase
    .from("exam_sections")
    .select("section_no, title, answers")
    .eq("exam_id", EXAM_ID)
    .order("section_no", { ascending: true });

  if (secError) {
    console.error("Error fetching sections:", secError);
    return;
  }

  sections.forEach(s => {
    console.log(`\nSection ${s.section_no}: "${s.title}"`);
    console.log(`Answers:`, JSON.stringify(s.answers));
  });

  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("order_index, question_type, text, correct_answer, options")
    .eq("exam_id", EXAM_ID)
    .order("order_index", { ascending: true });

  if (qError) {
    console.error("Error fetching questions:", qError);
    return;
  }

  console.log(`\nQuestions Count: ${questions.length}`);
  questions.slice(0, 15).forEach(q => {
    console.log(`  Q${q.order_index} (${q.question_type}): "${q.text}" -> Answer: "${q.correct_answer}" (Options: ${q.options ? q.options.length : 0})`);
  });
}

run().catch(console.error);
