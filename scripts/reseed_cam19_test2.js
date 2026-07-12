const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";

const supabase = createClient(supabaseUrl, supabaseKey);

const EXAM_ID = "efcfde6e-379b-40e8-aceb-872d34578c16";

function getQuestionsBlock(content) {
  if (!content) return "";
  const regex = /\bQuestions\b/i;
  const match = content.match(regex);
  if (match) {
    return content.substring(match.index);
  }
  return content;
}

function parseQuestionText(content, qNo) {
  const qBlock = getQuestionsBlock(content);
  const nextQNo = qNo + 1;
  const regexStr = `\\b${qNo}\\b(?!\\s*(?:-|–|—|to)\\s*\\d+)[.\\s\\)\\-–—]*([\\s\\S]*?)(?=\\b${nextQNo}\\b(?!\\s*(?:-|–|—|to)\\s*\\d+)[.\\s\\)\\-–—]|\\bQuestions\\b|\\bReading Passage\\b|$)`;
  const regex = new RegExp(regexStr);
  const match = qBlock.match(regex);
  if (match) {
    let text = match[1].trim();
    text = text.replace(/^[.\s\)\-–—\s]+/, "").replace(/[.\s\)\-–—\s]+$/, "");
    return text;
  }
  return "";
}

function parseOptions(text) {
  const regex = /\b([A-E])\b[.\s\)\-–—]+([\s\S]*?)(?=\b[A-E]\b[.\s\)\-–—]|$)/g;
  const options = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].toUpperCase();
    const val = match[2].trim();
    options.push(`${key}. ${val}`);
  }
  return options.length >= 2 ? options : null;
}

function cleanSectionContent(content) {
  if (!content) return content;
  const regex = /\bQuestions\b/i;
  const match = content.match(regex);
  if (match) {
    let index = match.index;
    const beforeText = content.substring(0, index);
    const dividerMatch = beforeText.match(/[-*_]{3,}\s*$/);
    if (dividerMatch) {
      index = dividerMatch.index;
    }
    return content.substring(0, index).trim();
  }
  return content;
}

async function run() {
  // First, we must fetch the ORIGINAL content from the database.
  // Wait! In our previous reseed, we updated `content = cleanSectionContent(content)` which removed the questions block!
  // So the current content in `exam_sections` table for Cambridge 19 Test 2 has NO questions block!
  // Oh! If the current content has no questions block, how can we parse the questions?
  // Wait, does the database have a backup or did we seed it from a file?
  // Let's check where the original content is.
  // Wait, did we save the content of Cambridge 19 Test 2 before?
  // In `check_all_reading_exams.js` or `inspect_cam19_test2.js` output, we saw that Questions Count was 0.
  // Wait! Does `supabase` database have a copy or did we run a seed script?
  // Wait! Let's check `package.json` or `scripts` directory for other files.
  // Wait, is there a seed file for Cambridge 19 Test 2 in the project?
  // Let's check the list of files in `scripts` directory:
  // We have `seed_cam18_test2.js`. But there is NO seed script for Cambridge 19 Test 2!
  // Oh, wait! If there is no seed script for Cambridge 19 Test 2, how was the exam originally created?
  // Wait, the exam has its answers in `exam_sections` answers column!
  // But wait, the content of `exam_sections` table has already been updated to clean the questions block!
  // Let's check if the backup of `content` is somewhere, or if we can restore the questions block by parsing the PDF or copying it from standard Cambridge 19 Test 2!
  // Yes! The questions for Cambridge 19 Test 2 are standard IELTS Reading questions.
  // Let's check what the questions of Cambridge 19 Test 2 are!
  // Section 1: "ELECTRORECEPTION"
  // - Questions 1-6: Paragraph matching.
  // - Questions 7-9: Fill in the blanks.
  // - Questions 10-13: Multiple Choice.
  // Section 2: "FAIR GAMES?"
  // Section 3: "Time Travel"
  // Wait! Let's search the web for the exact text of the questions for Cambridge 19 Test 2 Reading!
  // Let's search!
