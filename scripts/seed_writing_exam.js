const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";
const supabase = createClient(supabaseUrl, supabaseKey);

const TITLE = "IELTS Writing Actual Test - 01 December 2025";
const IMAGE_LOCAL_PATH = "scratch/page_2_img_0.png";
const IMAGE_DEST_PATH = "tasks/writing_01_12_2025_task1.png";

async function run() {
  console.log(`🚀 Starting seeding Writing exam: "${TITLE}"...`);

  // 1. Fetch old exam if it exists
  const { data: oldExam } = await supabase
    .from("exams")
    .select("id")
    .eq("title", TITLE)
    .maybeSingle();

  if (oldExam) {
    console.log(`🗑️ Found existing exam with ID ${oldExam.id}. Deleting dependencies...`);
    
    // Delete from writing_tasks
    await supabase
      .from("writing_tasks")
      .delete()
      .ilike("youpass_id", `exam_task%_${oldExam.id}`);
    
    // Delete from exam_sections
    await supabase.from("exam_sections").delete().eq("exam_id", oldExam.id);
    
    // Delete from exams
    await supabase.from("exams").delete().eq("id", oldExam.id);
  }

  // 2. Read image from local scratch folder
  if (!fs.existsSync(IMAGE_LOCAL_PATH)) {
    console.error(`❌ Local image file not found: ${IMAGE_LOCAL_PATH}`);
    return;
  }
  const imageBuffer = fs.readFileSync(IMAGE_LOCAL_PATH);

  // 3. Upload to Supabase Storage
  console.log(`📤 Uploading image to Supabase Storage: ${IMAGE_DEST_PATH}...`);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("exam-images")
    .upload(IMAGE_DEST_PATH, imageBuffer, {
      contentType: "image/png",
      upsert: true
    });

  if (uploadError) {
    console.error("❌ Error uploading image to storage:", uploadError);
    return;
  }
  console.log("✅ Image uploaded successfully.");

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("exam-images")
    .getPublicUrl(IMAGE_DEST_PATH);

  console.log(`🔗 Image Public URL: ${publicUrl}`);

  // 4. Insert new exam
  console.log("➕ Inserting new exam...");
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      title: TITLE,
      description: "Practice IELTS Writing Task 1 (Academic Report) and Task 2 (Essay) from the actual test on 01.12.2025.",
      category: "writing",
      category_id: "W1",
      status: "published",
      duration_minutes: 60
    })
    .select()
    .single();

  if (examError) {
    console.error("❌ Error creating exam:", examError);
    return;
  }
  console.log(`✅ Exam created with ID: ${exam.id}`);

  // 5. Insert exam sections
  console.log("➕ Inserting exam sections...");
  const task1Prompt = "The tables show how many international students study in Canada and the United States by country of origin. Summarize the information by selecting and reporting the main features and make comparisons where relevant.";
  const task2Prompt = "Nowadays young people are admiring media and sports stars, even though they often do not set a good example. Do you think this is a positive or negative development? Give reasons for your answer and include any relevant examples from your own knowledge or experience.";

  const sectionsToInsert = [
    {
      exam_id: exam.id,
      section_no: 1,
      title: "Writing Task 1",
      content: task1Prompt,
      answers: {
        image_url: publicUrl,
        cloudinary_url: publicUrl // Store Supabase URL here since Cloudinary is bypassed
      }
    },
    {
      exam_id: exam.id,
      section_no: 2,
      title: "Writing Task 2",
      content: task2Prompt,
      answers: {}
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

  // 6. Sync to writing_tasks
  console.log("➕ Syncing to writing_tasks...");
  const tasksToInsert = [
    {
      youpass_id: `exam_task1_${exam.id}`,
      task_type: "task1",
      title: TITLE + " - Task 1",
      description: task1Prompt,
      thumbnail_url: publicUrl,
      cloudinary_url: publicUrl,
      is_visible: true,
      band_level: "6.5"
    },
    {
      youpass_id: `exam_task2_${exam.id}`,
      task_type: "task2",
      title: TITLE + " - Task 2",
      description: task2Prompt,
      thumbnail_url: null,
      cloudinary_url: null,
      is_visible: true,
      band_level: "6.5"
    }
  ];

  const { error: syncError } = await supabase
    .from("writing_tasks")
    .insert(tasksToInsert);

  if (syncError) {
    console.error("❌ Error syncing to writing_tasks:", syncError);
    return;
  }

  console.log("🎉 Seeding completed successfully!");
}

run().catch(console.error);
