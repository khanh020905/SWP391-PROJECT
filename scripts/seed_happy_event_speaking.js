const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";
const supabase = createClient(supabaseUrl, supabaseKey);

const TITLE = "Happy Event Preparation";

async function run() {
  console.log(`🚀 Starting seeding Speaking topic: "${TITLE}"...`);

  // 1. Fetch old exam if it exists
  const { data: oldExam } = await supabase
    .from("exams")
    .select("id")
    .eq("title", TITLE)
    .maybeSingle();

  if (oldExam) {
    console.log(`🗑️ Found existing exam with ID ${oldExam.id}. Deleting dependencies...`);
    
    // Delete from questions
    await supabase.from("questions").delete().eq("exam_id", oldExam.id);
    
    // Delete from exam_sections
    await supabase.from("exam_sections").delete().eq("exam_id", oldExam.id);
    
    // Delete from exams
    await supabase.from("exams").delete().eq("id", oldExam.id);
  }

  // Delete from speaking_topics
  await supabase.from("speaking_topics").delete().eq("topic", TITLE);

  console.log("➕ Inserting new exam...");
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      title: TITLE,
      description: "Practice IELTS Speaking on the topic of preparing for a happy event successfully.",
      category: "speaking",
      status: "published",
      duration_minutes: 15,
      category_id: "S_HappyEvent"
    })
    .select()
    .single();

  if (examError) {
    console.error("❌ Error creating exam:", examError);
    return;
  }

  console.log(`✅ Exam created with ID: ${exam.id}`);

  // Questions arrays
  const part1Questions = [
    "Do you work or are you a student?",
    "What is your favorite color and why?",
    "Do you like rainy days? Why or why not?",
    "What do you usually do when it rains?"
  ];

  const part2Data = {
    cue_card: "Describe a time when you prepared for a happy event successfully.",
    bullet_points: [
      "What the event was",
      "How you prepared for it",
      "Who helped you to organize it",
      "And explain why you think it was a successful event."
    ]
  };

  const part3Questions = [
    "How can parents help children to be organized?",
    "On what occasions do people need to be organized?",
    "Does everything need to be well prepared?"
  ];

  console.log("➕ Inserting exam sections...");
  const sectionsToInsert = [
    {
      exam_id: exam.id,
      section_no: 1,
      title: "Part 1: Introduction & Interview",
      content: "Work or Study, Rain, Colors",
      answers: part1Questions
    },
    {
      exam_id: exam.id,
      section_no: 2,
      title: "Part 2: Individual Long Turn",
      content: part2Data.cue_card,
      answers: part2Data
    },
    {
      exam_id: exam.id,
      section_no: 3,
      title: "Part 3: Two-way Discussion",
      content: "Questions about planning and preparation.",
      answers: part3Questions
    }
  ];

  const { error: secError } = await supabase
    .from("exam_sections")
    .insert(sectionsToInsert);

  if (secError) {
    console.error("❌ Error creating sections:", secError);
    return;
  }
  console.log("✅ Sections created successfully.");

  console.log("➕ Inserting questions for test mapping...");
  const questionsToInsert = [];
  
  // Part 1 questions
  part1Questions.forEach((qText, idx) => {
    questionsToInsert.push({
      exam_id: exam.id,
      section: 1,
      question_type: "speaking",
      text: qText,
      correct_answer: "",
      options: null,
      order_index: idx + 1
    });
  });

  // Part 3 questions
  part3Questions.forEach((qText, idx) => {
    questionsToInsert.push({
      exam_id: exam.id,
      section: 3,
      question_type: "speaking",
      text: qText,
      correct_answer: "",
      options: null,
      order_index: idx + 1
    });
  });

  const { error: qError } = await supabase
    .from("questions")
    .insert(questionsToInsert);

  if (qError) {
    console.error("❌ Error inserting questions:", qError);
    return;
  }
  console.log("✅ Questions inserted successfully.");

  console.log("➕ Syncing to speaking_topics...");
  const topicsToInsert = [
    {
      part: 1,
      topic: TITLE,
      questions: part1Questions,
      band_target: 5.0,
      is_active: true
    },
    {
      part: 2,
      topic: TITLE,
      questions: part2Data,
      band_target: 5.5,
      is_active: true
    },
    {
      part: 3,
      topic: TITLE,
      questions: part3Questions,
      band_target: 6.0,
      is_active: true
    }
  ];

  const { error: topicError } = await supabase
    .from("speaking_topics")
    .insert(topicsToInsert);

  if (topicError) {
    console.error("❌ Error inserting speaking topics:", topicError);
    return;
  }

  console.log("🎉 Seeding completed successfully!");
}

run().catch(console.error);
