import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import zlib from "zlib";
import { v2 as cloudinary } from "cloudinary";

async function uploadImageBufferToCloudinary(buffer: Buffer, mimeType: string = "image/png"): Promise<string | null> {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "swp391_exams" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
      return uploadResult.secure_url || null;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
    }
  }
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function extractDocxImages(buffer: Buffer): Promise<{ fileName: string; url: string }[]> {
  const images: { fileName: string; url: string }[] = [];
  try {
    let offset = 0;
    while (offset < buffer.length - 30) {
      if (buffer[offset] === 0x50 && buffer[offset + 1] === 0x4b && buffer[offset + 2] === 0x03 && buffer[offset + 3] === 0x04) {
        const compMethod = buffer.readUInt16LE(offset + 8);
        let compSize = buffer.readUInt32LE(offset + 18);
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const fileName = buffer.toString("utf-8", offset + 30, offset + 30 + fileNameLen);
        const dataStart = offset + 30 + fileNameLen + extraLen;

        if (fileName.startsWith("word/media/") && /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName)) {
          if (compSize === 0) {
            const nextHeader = buffer.indexOf(Buffer.from([0x50, 0x4b]), dataStart);
            compSize = nextHeader !== -1 ? nextHeader - dataStart : buffer.length - dataStart;
          }
          const compData = buffer.subarray(dataStart, dataStart + compSize);
          let rawImgBuffer: Buffer | null = null;
          if (compMethod === 8) {
            rawImgBuffer = zlib.inflateRawSync(compData);
          } else if (compMethod === 0) {
            rawImgBuffer = compData;
          }

          if (rawImgBuffer && rawImgBuffer.length > 500) {
            const ext = fileName.split(".").pop()?.toLowerCase() || "png";
            const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
            const imageUrl = await uploadImageBufferToCloudinary(rawImgBuffer, mimeType);
            if (imageUrl) {
              images.push({ fileName, url: imageUrl });
            }
          }
        }
        offset = dataStart + Math.max(compSize, 1);
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.error("Error extracting images from docx:", err);
  }
  return images;
}


function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Helper to extract clean text from .docx binary buffer with proper spacing and paragraph breaks
function extractTextFromDocx(buffer: Buffer): string {
  try {
    // 1. Locate End of Central Directory (EOCD) record (signature 0x06054b50)
    let eocdOffset = -1;
    for (let i = buffer.length - 22; i >= 0; i--) {
      if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b && buffer[i + 2] === 0x05 && buffer[i + 3] === 0x06) {
        eocdOffset = i;
        break;
      }
    }

    let xmlText = "";

    if (eocdOffset !== -1) {
      const cdCount = buffer.readUInt16LE(eocdOffset + 10);
      const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

      let curr = cdOffset;
      for (let i = 0; i < cdCount && curr < buffer.length - 46; i++) {
        if (buffer[curr] === 0x50 && buffer[curr + 1] === 0x4b && buffer[curr + 2] === 0x01 && buffer[curr + 3] === 0x02) {
          const compMethod = buffer.readUInt16LE(curr + 10);
          const compSize = buffer.readUInt32LE(curr + 20);
          const fileNameLen = buffer.readUInt16LE(curr + 28);
          const extraLen = buffer.readUInt16LE(curr + 30);
          const commentLen = buffer.readUInt16LE(curr + 32);
          const localOffset = buffer.readUInt32LE(curr + 42);
          const fileName = buffer.toString("utf-8", curr + 46, curr + 46 + fileNameLen);

          if (fileName === "word/document.xml") {
            const locFileNameLen = buffer.readUInt16LE(localOffset + 26);
            const locExtraLen = buffer.readUInt16LE(localOffset + 28);
            const dataStart = localOffset + 30 + locFileNameLen + locExtraLen;
            const compData = buffer.subarray(dataStart, dataStart + compSize);

            if (compMethod === 8) {
              xmlText = zlib.inflateRawSync(compData).toString("utf-8");
            } else if (compMethod === 0) {
              xmlText = compData.toString("utf-8");
            }
            break;
          }
          curr += 46 + fileNameLen + extraLen + commentLen;
        } else {
          break;
        }
      }
    }

    // Fallback: Linear search if EOCD method missed
    if (!xmlText) {
      let offset = 0;
      while (offset < buffer.length - 30) {
        if (buffer[offset] === 0x50 && buffer[offset + 1] === 0x4b && buffer[offset + 2] === 0x03 && buffer[offset + 3] === 0x04) {
          const compMethod = buffer.readUInt16LE(offset + 8);
          let compSize = buffer.readUInt32LE(offset + 18);
          const fileNameLen = buffer.readUInt16LE(offset + 26);
          const extraLen = buffer.readUInt16LE(offset + 28);
          const fileName = buffer.toString("utf-8", offset + 30, offset + 30 + fileNameLen);
          const dataStart = offset + 30 + fileNameLen + extraLen;

          if (fileName === "word/document.xml") {
            if (compSize === 0) {
              const nextHeader = buffer.indexOf(Buffer.from([0x50, 0x4b]), dataStart);
              compSize = nextHeader !== -1 ? nextHeader - dataStart : buffer.length - dataStart;
            }
            const compData = buffer.subarray(dataStart, dataStart + compSize);
            if (compMethod === 8) {
              xmlText = zlib.inflateRawSync(compData).toString("utf-8");
            } else if (compMethod === 0) {
              xmlText = compData.toString("utf-8");
            }
            break;
          }
          offset = dataStart + Math.max(compSize, 1);
        } else {
          offset++;
        }
      }
    }

    if (xmlText) {
      let textResult = xmlText
        .replace(/<w:br[^>]*\/>/gi, "\n")
        .replace(/<w:br[^>]*>/gi, "\n")
        .replace(/<w:tab[^>]*\/>/gi, " ")
        .replace(/<w:tab[^>]*>/gi, " ")
        .replace(/<\/w:p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "");

      return textResult
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/[ \t]+/g, " ")
        .replace(/ \n/g, "\n")
        .replace(/\n /g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }
  } catch (err) {
    console.error("Error extracting text from docx:", err);
  }
  return "";
}

// Specialized parser for ANSWERS block at the bottom of the document
function parseAnswersBlock(answersText: string): {
  sec1: Record<string, string>;
  sec2: Record<string, string>;
  sec3: Record<string, string>;
} {
  const sec1Answers: Record<string, string> = {};
  const sec2Answers: Record<string, string> = {};
  const sec3Answers: Record<string, string> = {};

  if (!answersText) return { sec1: sec1Answers, sec2: sec2Answers, sec3: sec3Answers };

  // Clean answersText: remove fluff lines
  const cleanedText = answersText
    .replace(/Academic Reading practice paper \d+/gi, "")
    .replace(/Each question correctly answered scores \d+ mark[s]?/gi, "")
    .replace(/Correct spelling is needed in all answers/gi, "");

  // Helper to tokenize an answer block into individual question answers (1 key-value per question line)
  const tokenizeAnswers = (blockText: string, startQ: number, maxQ: number, targetMap: Record<string, string>) => {
    // 1. Try explicit number-value pattern: "1. FALSE", "2 TRUE", "3. NOT GIVEN", "4: C"
    const numberedRegex = /(?:^|\s|\n)(\d{1,2})[\.\:\-\s]+(TRUE|FALSE|NOT GIVEN|YES|NO|[A-H]\b|[^\n\d]{1,30})(?=\s+\d{1,2}[\.\:\-\s]|\n|$)/gi;
    const numberedMatches = Array.from(blockText.matchAll(numberedRegex));

    if (numberedMatches.length >= 3) {
      numberedMatches.forEach(m => {
        const qNum = parseInt(m[1]);
        const ansVal = m[2].trim();
        if (qNum >= startQ && qNum <= maxQ && ansVal) {
          targetMap[qNum.toString()] = ansVal;
        }
      });
      if (Object.keys(targetMap).length > 0) return;
    }

    // 2. Tokenize sequence of answers: TRUE, FALSE, NOT GIVEN, YES, NO, single letters A-H, or individual text tokens
    let textToTokenize = blockText.replace(/NOT\s+GIVEN/gi, "NOT_GIVEN");
    
    // Split by whitespace or newlines
    const rawTokens = textToTokenize
      .split(/[\n\t\r,]+|\s{2,}/)
      .flatMap(t => t.trim().split(/\s+/))
      .filter(t => t.length > 0 && !/^(SECTION|PASSAGE|PART|ANSWERS?|ANSWER|KEY)$/i.test(t));

    let currentQ = startQ;
    rawTokens.forEach(t => {
      let val = t.replace(/NOT_GIVEN/g, "NOT GIVEN").trim();
      const numPrefixMatch = val.match(/^(\d{1,2})[\.\:\-\s]*(.*)$/);
      if (numPrefixMatch) {
        const explicitQ = parseInt(numPrefixMatch[1]);
        const subVal = numPrefixMatch[2].trim();
        if (explicitQ >= startQ && explicitQ <= maxQ) {
          if (subVal) {
            targetMap[explicitQ.toString()] = subVal;
            currentQ = explicitQ + 1;
          } else {
            currentQ = explicitQ;
          }
          return;
        }
      }

      if (currentQ <= maxQ && val && !/^\d+$/.test(val)) {
        targetMap[currentQ.toString()] = val;
        currentQ++;
      }
    });
  };

  // Split text by SECTION 1 / SECTION 2 / SECTION 3 or PASSAGE 1 / PASSAGE 2 / PASSAGE 3
  const secSplitter = /(?:SECTION|PASSAGE|PART)\s*(\d+)/gi;
  const secMatches = Array.from(cleanedText.matchAll(secSplitter));

  if (secMatches.length > 0) {
    for (let i = 0; i < secMatches.length; i++) {
      const match = secMatches[i];
      const secNo = parseInt(match[1]) || (i + 1);
      const startIdx = match.index! + match[0].length;
      const endIdx = (i < secMatches.length - 1) ? secMatches[i + 1].index! : cleanedText.length;
      const rawSecAns = cleanedText.substring(startIdx, endIdx).trim();

      const targetMap = secNo === 1 ? sec1Answers : secNo === 2 ? sec2Answers : sec3Answers;
      const startQ = secNo === 1 ? 1 : secNo === 2 ? 14 : 27;
      const maxQ = secNo === 1 ? 13 : secNo === 2 ? 26 : 40;

      tokenizeAnswers(rawSecAns, startQ, maxQ, targetMap);
    }
  } else {
    tokenizeAnswers(cleanedText, 1, 13, sec1Answers);
    tokenizeAnswers(cleanedText, 14, 26, sec2Answers);
    tokenizeAnswers(cleanedText, 27, 40, sec3Answers);
  }

  return { sec1: sec1Answers, sec2: sec2Answers, sec3: sec3Answers };
}

// Helper to re-key answers sequentially and shift them if necessary
function rekeyAnswers(answers: Record<string, string> | any, secNo: number): Record<string, string> {
  const result: Record<string, string> = {};
  if (!answers || typeof answers !== "object") return result;

  const startQ = secNo === 1 ? 1 : secNo === 2 ? 14 : 27;
  const maxQ = secNo === 1 ? 13 : secNo === 2 ? 26 : 40;

  const entries = Object.entries(answers)
    .map(([k, v]) => ({ keyNum: parseInt(k), val: String(v).trim() }))
    .filter(e => !isNaN(e.keyNum))
    .sort((a, b) => a.keyNum - b.keyNum);

  if (entries.length === 0) return result;

  // If all keys are already in the correct range, keep them as is
  const allInRange = entries.every(e => e.keyNum >= startQ && e.keyNum <= maxQ);
  if (allInRange) {
    entries.forEach(e => {
      result[e.keyNum.toString()] = e.val;
    });
    return result;
  }

  // If keys are 1-based (like 1..13 or 1..14) but it's Section 2 or 3, shift them
  const isOneBased = entries.every(e => e.keyNum >= 1 && e.keyNum <= (maxQ - startQ + 1));
  if (isOneBased) {
    entries.forEach(e => {
      const shiftedKey = e.keyNum + startQ - 1;
      result[shiftedKey.toString()] = e.val;
    });
  } else {
    // Sequentially assign keys starting from startQ
    entries.forEach((e, idx) => {
      const targetKey = startQ + idx;
      if (targetKey <= maxQ) {
        result[targetKey.toString()] = e.val;
      }
    });
  }
  return result;
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  return md
    .split(/\n\n+/)
    .map(p => {
      let trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<p>") || trimmed.startsWith("<h") || trimmed.startsWith("<div") || trimmed.startsWith("<table")) {
        return trimmed;
      }
      if (trimmed.startsWith("###")) {
        return `<h3>${trimmed.replace(/^###\s*/, "")}</h3>`;
      }
      if (trimmed.startsWith("##")) {
        return `<h2>${trimmed.replace(/^##\s*/, "")}</h2>`;
      }
      if (trimmed.startsWith("#")) {
        return `<h1>${trimmed.replace(/^#\s*/, "")}</h1>`;
      }
      
      trimmed = trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>");
        
      return `<p>${trimmed}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

function extractPassageTitle(content: string, secNo: number): string {
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check markdown header line
    if (line.startsWith("#") && !/questions|passage|section|part|instructions|candidate/i.test(line)) {
      const cleanHeader = line.replace(/^#+\s*/, "").replace(/[\*\_]/g, "").trim();
      if (cleanHeader.length > 3 && cleanHeader.length < 90) {
        return cleanHeader;
      }
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/READING\s*PASSAGE\s*\d+/i.test(line) || /PASSAGE\s*\d+/i.test(line) || /SECTION\s*\d+/i.test(line)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
        const nextLine = lines[j];
        if (
          nextLine.toLowerCase().includes("questions") ||
          nextLine.toLowerCase().includes("minutes") ||
          nextLine.toLowerCase().includes("based on") ||
          nextLine.toLowerCase().includes("paragraphs") ||
          nextLine.toLowerCase().includes("box") ||
          nextLine.toLowerCase().includes("list of headings")
        ) {
          continue;
        }
        const cleaned = nextLine.replace(/[#\*_]/g, "").trim();
        if (cleaned.length > 3 && cleaned.length < 80) {
          return cleaned;
        }
      }
    }
  }
  return `Passage ${secNo}`;
}

// Helper regex fallback parser
function fallbackParseExamContent(rawContent: string, targetCategory: string = "reading") {
  let text = rawContent.trim();
  let result = {
    title: "",
    cambridge_no: "",
    test_no: "",
    category: targetCategory,
    duration_minutes: targetCategory === "speaking" ? "15" : targetCategory === "listening" ? "30" : "60",
    sections: [] as { section_no: number; title: string; content: string; answers: Record<string, string> }[]
  };

  if (!text) return result;

  try {
    const json = JSON.parse(text);
    if (typeof json === "object" && json !== null) {
      result.title = json.title || json.name || "";
      result.cambridge_no = json.cambridge_no?.toString() || json.cambridgeNo?.toString() || "";
      result.test_no = json.test_no?.toString() || json.testNo?.toString() || "";
      if (json.category && ["listening", "reading", "writing", "speaking"].includes(json.category.toLowerCase())) {
        result.category = json.category.toLowerCase();
      }
      result.duration_minutes = json.duration_minutes?.toString() || json.durationMinutes?.toString() || "";

      if (Array.isArray(json.sections) && json.sections.length > 0) {
        result.sections = json.sections.map((s: any, idx: number) => ({
          section_no: s.section_no || idx + 1,
          title: s.title || `Section ${idx + 1}`,
          content: typeof s.content === "string" ? s.content : (s.text || s.transcript || ""),
          answers: typeof s.answers === "object" && s.answers !== null ? s.answers : {}
        }));
      }
      return result;
    }
  } catch {
    // Fallback to regex text parser
  }

  // Trim out all candidate instructions and cover text before READING PASSAGE 1 / PASSAGE 1
  const firstHeaderMatch = text.match(/(?:READING\s*PASSAGE|PASSAGE)\s*1\b/i);
  if (firstHeaderMatch && firstHeaderMatch.index! > 0) {
    text = text.substring(firstHeaderMatch.index!);
  }

  const camMatch = rawContent.match(/Cambridge\s*(?:IELTS)?\s*(\d+)/i);
  if (camMatch) result.cambridge_no = camMatch[1];

  const testMatch = rawContent.match(/Test\s*(\d+)/i);
  if (testMatch) result.test_no = testMatch[1];

  if (result.cambridge_no && result.test_no) {
    result.title = `Cambridge IELTS ${result.cambridge_no} – Test ${result.test_no}`;
  }

  if (targetCategory === "writing") {
    let task2Match = text.match(/(?:^|\n)[#\s\*_]*(?:WRITING\s+TASK|TASK|PART)\s*(?:2|TWO)\b/i);
    if (!task2Match) {
      task2Match = text.match(/(?:^|\n)[#\s\*_]*(?:Write an essay|Task 2|Essay Writing)\b/i);
    }
    if (!task2Match) {
      task2Match = text.match(/(?:^|\n)[#\s\*_]*You should spend about 40 minutes on this task/i);
    }

    let task1Text = text;
    let task2Text = "";

    if (task2Match && task2Match.index! > 0) {
      task1Text = text.substring(0, task2Match.index!).trim();
      task2Text = text.substring(task2Match.index!).trim();
    }

    const imgMatch = task1Text.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i) || task1Text.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif))/i);
    const imageUrl = imgMatch ? imgMatch[1] : "";

    result.sections = [
      {
        section_no: 1,
        title: "Task 1 - Academic Writing",
        content: task1Text,
        answers: imageUrl ? { image_url: imageUrl } : {}
      },
      {
        section_no: 2,
        title: "Task 2 - Essay Writing",
        content: task2Text || "Write an essay responding to the prompt above.",
        answers: {}
      }
    ];
    return result;
  }

  const sectionSplitter = /(?:^|\r?\n)[#\t \*_]*(?:READING\s*PASSAGE|PASSAGE|WRITING\s+TASK|TASK|SPEAKING\s+PART|PART|SECTION)\s*(\d+)\b[^\r\n]*/gi;
  const rawMatches = Array.from(text.matchAll(sectionSplitter));
  const matches = rawMatches.filter(m => {
    const lineText = m[0].trim().toLowerCase();
    return !/based on|questions|minutes|paragraphs|which are|following pages/i.test(lineText);
  });
  const prefix = targetCategory === "speaking" ? "Part" : targetCategory === "reading" ? "Passage" : "Section";

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const secNo = parseInt(match[1]) || (i + 1);
      const startIndex = match.index!;
      const endIndex = (i < matches.length - 1) ? matches[i + 1].index! : text.length;
      let sectionText = text.substring(startIndex, endIndex).trim();

      // Remove any ANSWERS block trailing in section content
      sectionText = sectionText.replace(/(?:^|\n)(?:#+\s*)?\**\s*(?:ANSWERS?|ANSWER KEY|DÁP ÁN)\b\s*\**\s*[\r\n]+[\s\S]*$/i, "").trim();

      let content = sectionText;
      let answersObj: Record<string, string> = {};

      const answerBlockMatch = sectionText.match(/(?:Answers?|Answer Key|Đáp án)[:\n]([\s\S]+)$/i);
      if (answerBlockMatch) {
        content = sectionText.substring(0, answerBlockMatch.index).trim();
        const rawAnswersText = answerBlockMatch[1];
        const ansMatches = Array.from(rawAnswersText.matchAll(/(\d+)[\.\:\-\s]+([A-Z0-9\s\,\.\-]+?)(?=\s+\d+[\.\:\-]|\n|$)/gi));
        ansMatches.forEach(m => {
          answersObj[m[1]] = m[2].trim();
        });
      }

      // Try extracting real topic title
      const topicTitle = extractPassageTitle(content, secNo);

      // Separate passage text and questions with newlines / HTML breaks
      let formattedSectionContent = content;
      if (!formattedSectionContent.includes("<p>") && !formattedSectionContent.includes("<h1>")) {
        const qMatch = formattedSectionContent.match(/(?:^|\n)[#\s\*_]*(?:Questions?\s*\d+|Questions?\s*[\d+–\-]+)\b[#\s\*_]*(?=\r?\n|$)/i);
        if (qMatch && qMatch.index! > 0) {
          const passagePart = formattedSectionContent.substring(0, qMatch.index!).trim();
          const questionPart = formattedSectionContent.substring(qMatch.index!).trim();
          const pParas = passagePart.split(/\n\n+/).map((pText, pIdx) => {
            const trimmed = pText.trim();
            if (pIdx === 0 && topicTitle !== `${prefix} ${secNo}` && !trimmed.toLowerCase().includes(topicTitle.toLowerCase())) {
              return `${topicTitle}\n\n${trimmed}`;
            }
            return trimmed;
          }).join("\n\n");

          formattedSectionContent = `${pParas}\n\n### ${questionPart.split('\n')[0]}\n\n${questionPart.split('\n').slice(1).join('\n')}`;
        } else {
          const paragraphs = formattedSectionContent.split(/\n\n+/);
          formattedSectionContent = paragraphs
            .map((pText, pIdx) => {
              const trimmed = pText.trim();
              if (pIdx === 0 && topicTitle !== `${prefix} ${secNo}` && !trimmed.toLowerCase().includes(topicTitle.toLowerCase())) {
                return `${topicTitle}\n\n${trimmed}`;
              }
              return trimmed;
            })
            .join("\n\n");
        }
      }

      result.sections.push({
        section_no: secNo,
        title: topicTitle,
        content: markdownToHtml(formattedSectionContent),
        answers: answersObj
      });
    }
  } else {
    result.sections.push({
      section_no: 1,
      title: `${prefix} 1`,
      content: text,
      answers: {}
    });
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "reading";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc");

    let rawExtractedText = "";
    let docxImages: { fileName: string; url: string }[] = [];

    if (isPdf) {
      try {
        const pdfModule = require("pdf-parse");
        if (typeof pdfModule === "function") {
          const textResult = await pdfModule(Buffer.from(arrayBuffer));
          rawExtractedText = textResult.text || "";
        } else if (pdfModule?.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: new Uint8Array(arrayBuffer) });
          const textResult = await parser.getText();
          rawExtractedText = textResult.text || "";
          if (parser.destroy) await parser.destroy();
        }
      } catch (pdfErr) {
        console.error("PDFParse error:", pdfErr);
      }
    } else if (isDocx) {
      rawExtractedText = extractTextFromDocx(Buffer.from(arrayBuffer));
      try {
        docxImages = await extractDocxImages(Buffer.from(arrayBuffer));
      } catch (imgErr) {
        console.warn("[Docx Image Extraction Error]:", imgErr);
      }
    } else {
      rawExtractedText = Buffer.from(arrayBuffer).toString("utf-8");
    }

    // 1. Cut off ANSWERS block at the bottom of the document from main content text
    let answersText = "";
    let cleanExtractedText = rawExtractedText;

    const answersBlockMatch = rawExtractedText.match(/(?:^|\r?\n)[#\t \*_]*(?:ANSWERS|ANSWER\s+KEY|DÁP\s+ÁN)\b[^\n\r]*(?=[\r\n]+|$)/i);
    if (answersBlockMatch) {
      answersText = rawExtractedText.substring(answersBlockMatch.index);
      cleanExtractedText = rawExtractedText.substring(0, answersBlockMatch.index).trim();
    }

    // 2. Pre-trim: Remove all intro cover text/candidate instructions
    const isReading = category.toLowerCase() === "reading";
    const isWriting = category.toLowerCase() === "writing";

    const headerRegex = isReading
      ? /(?:READING\s*PASSAGE|PASSAGE)\s*1\b/i
      : isWriting
      ? /(?:WRITING\s*TASK|TASK)\s*1\b/i
      : /(?:READING\s*PASSAGE|PASSAGE|SECTION|PART|TASK)\s*1\b/i;

    const firstHeaderMatch = cleanExtractedText.match(headerRegex);
    if (firstHeaderMatch && firstHeaderMatch.index! > 0) {
      cleanExtractedText = cleanExtractedText.substring(firstHeaderMatch.index!);
    } else {
      cleanExtractedText = cleanExtractedText
        .replace(/^[\s\S]*?(?:INTERNATIONAL ENGLISH LANGUAGE TESTING SYSTEM|INSTRUCTIONS TO CANDIDATES|Candidate Name|Candidate Number|Academic Reading PRACTICE TEST|Do not open this question paper)[^\n]*\n?/gi, "")
        .replace(/^(?:\d+[\-\d\s]*\n+)+/g, "")
        .trim();
    }

    // 3. Parse ANSWERS block into section answer maps
    const parsedAnswersMap = parseAnswersBlock(answersText);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && cleanExtractedText.trim()) {
      try {
        const genAIInst = new GoogleGenerativeAI(apiKey);
        const genModel = genAIInst.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = "";

        if (isWriting) {
          const docxImgNote = docxImages.length > 0
            ? `\nEXTRACTED DOCX IMAGES FOR TASK 1 CHART/DIAGRAM:\n${docxImages.map(i => i.url).join("\n")}\nPlease assign the primary chart image URL "${docxImages[0].url}" into Section 1 "answers" object as {"image_url": "${docxImages[0].url}"}.`
            : "";

          prompt = `You are an expert Cambridge IELTS Writing exam content extractor and parser.
Analyze the following test document text for skill category "writing".

STRICT RULES FOR WRITING EXAM:
1. WRITING TASKS (EXTRACT ALL TASKS PRESENT IN THE DOCUMENT):
   - If the document contains ONLY 1 task (e.g. Task 1 or Task 2), return EXACTLY 1 section.
   - If the document contains 2 tasks (Task 1 & Task 2), return EXACTLY 2 sections.

2. TASK TITLES ("title"):
   - Section 1 title: "Task 1 - Academic Writing" (or "Task 2 - Essay Writing" if only Task 2 is present).
   - Section 2 title: "Task 2 - Essay Writing".

3. TASK PROMPT CONTENT ("content"):
   - Extract the full prompt text for each present task.
   - Include ALL task instructions, word count notes (e.g., "Write at least 150 words", "Write at least 250 words"), and prompt questions.
   - Format in clean plain text with double-newlines (\n\n) between paragraphs.
   - DO NOT include any answer key text (Writing has no answer key, only essay prompts).

4. TASK CHART/DIAGRAM IMAGE ("answers"):
   - For Task 1: Check if the prompt text contains an image URL (e.g. https://... or markdown image syntax ![...](url)). If present or provided below, set "answers" to {"image_url": "URL"}. If no image URL is present, set "answers" to {}.
   - For Task 2: Set "answers" to {}.
${docxImgNote}

Return a valid JSON object matching this exact TypeScript structure:
{
  "title": string (e.g. "Cambridge IELTS 18 – Test 1 WRITING"),
  "cambridge_no": string,
  "test_no": string,
  "category": "writing",
  "duration_minutes": "60",
  "sections": Array<{
    "section_no": number (1-based index),
    "title": string (e.g. "Task 1 - Academic Writing" or "Task 2 - Essay Writing"),
    "content": string (Full prompt),
    "answers": Record<string, string> (e.g. {"image_url": "URL"} or {})
  }>
}

Here is the clean test document text:
---
${cleanExtractedText.slice(0, 50000)}
---`;
        } else {
          prompt = `You are an expert Cambridge IELTS exam content extractor and parser.
Analyze the following test document text for skill category "${category}".

STRICT FORMATTING & EXTRACTION RULES:
1. TRIMMING COVER PAGE (CRITICAL - ONLY KEEP PASSAGES AND QUESTIONS):
   - DISCARD and REMOVE all cover page text, candidate name fields, candidate instructions, instructions to candidates, time limits, and introductory headers before the first Reading Passage starts.
   - Section 1 content MUST start directly at "READING PASSAGE 1" (or its title). NEVER include cover page instructions or candidates info.

2. READING PASSAGES (ALL 3 PASSAGES REQUIRED):
   - Locate and extract ALL 3 Reading Passages from the document.
   - Section 1 = Reading Passage 1 (Questions 1–13)
   - Section 2 = Reading Passage 2 (Questions 14–26)
   - Section 3 = Reading Passage 3 (Questions 27–40)

3. PASSAGE TITLE ("title"):
   - Extract the ACTUAL main topic title of each passage from the text (e.g. "URBAN FARMING", "FOREST MANAGEMENT IN PENNSYLVANIA, USA", "CONQUERING EARTH'S SPACE JUNK PROBLEM").

4. SEPARATE PASSAGE TEXT & QUESTIONS WITH PLAIN TEXT / MARKDOWN ("content"):
   - Extract the complete Reading Passage text first.
   - Immediately under the Reading Passage, include the COMPLETE Questions section for that passage.
   - CRITICAL: Include ALL question items AND question instructions/requirements (e.g., "Questions 1-5: Do the following statements agree...", "Choose TRUE, FALSE, or NOT GIVEN", "Choose the correct letter A, B, C or D", "Complete the summary below", "Choose NO MORE THAN TWO WORDS"). DO NOT omit question instructions!
   - Format the content exactly like the layout in the original document (retaining separate paragraphs, list formatting like "1.", "2.", bold elements for questions/keywords, block text layouts, matching options, columns) but strictly do NOT use any style, class attributes, or font settings.
   - Use clean, standard markdown / plain text to preserve the original structure:
     - Use double-newlines (\n\n) to separate paragraphs and question blocks.
     - Use simple markdown headers like "### Questions X–Y" for question section headers.
     - Do NOT use HTML tags (no <p>, <h3>, <br>, <h1>, etc.). Keep it as clean plain text with standard double-newlines.
   - Do NOT include any ANSWERS key text in the content field.

5. ANSWERS KEY AT BOTTOM OF FILE ("answers"):
   - Locate the Answer Key section at the bottom of the document (usually under heading "ANSWERS", "ANSWER KEY", "SECTION 1", "SECTION 2", "SECTION 3").
   - Extract the answer for EACH individual question (Q1, Q2, Q3, ..., Q40).
   - Each section should contain ONLY its respective answers:
     - Section 1: answers for Q1 to Q13.
     - Section 2: answers for Q14 to Q26.
     - Section 3: answers for Q27 to Q40.
   - Format as a flat JSON dictionary where keys are string representations of the question numbers and values are the answer string.

Return a valid JSON object matching this exact TypeScript structure:
{
  "title": string (e.g. "Cambridge IELTS 18 – Test 1 ${category.toUpperCase()}"),
  "cambridge_no": string (e.g. "18"),
  "test_no": string (e.g. "1"),
  "category": "${category}",
  "duration_minutes": string (e.g. "${category === "speaking" ? "15" : "60"}"),
  "sections": Array<{
    "section_no": number (1-based index: 1, 2, 3),
    "title": string (The ACTUAL passage title in UPPERCASE, e.g. "URBAN FARMING"),
    "content": string (Full passage text, followed by double-newlines and the COMPLETE Questions section with all instructions and items without any HTML tags or trailing ANSWERS text),
    "answers": Record<string, string> (Answers formatted as JSON object {"1": "FALSE", "2": "TRUE", "3": "NOT GIVEN", ...})
  }>
}

Here is the clean test document text:
---
${cleanExtractedText.slice(0, 50000)}
---`;
        }

        const geminiPromise = genModel.generateContent(prompt);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini API Timeout (8s limit reached)")), 8000)
        );

        const result = (await Promise.race([geminiPromise, timeoutPromise])) as any;
        const text = result.response.text();
        const parsed = cleanAndParseJSON(text);

        if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          // If writing and docx images exist, ensure task 1 gets the image URL if missing
          if (isWriting) {
            // Ensure writing always has 2 sections: Task 1 and Task 2
            const sec1 = parsed.sections.find((s: any) => s.section_no === 1) || parsed.sections[0];
            let sec2 = parsed.sections.find((s: any) => s.section_no === 2) || parsed.sections[1];

            if (sec1) {
              sec1.title = "Task 1 - Academic Writing";
              if (typeof sec1.answers !== "object" || !sec1.answers) {
                sec1.answers = {};
              }
              if (!sec1.answers.image_url && docxImages.length > 0) {
                sec1.answers.image_url = docxImages[0].url;
              }

              // Check if Task 2 is lumped inside Task 1 content or if Section 2 prompt is missing/placeholder
              const fullContent = sec1.content || "";
              const task2Match = fullContent.match(/(?:^|\n)[#\s\*_]*(?:WRITING\s+TASK|TASK|PART)\s*(?:2|TWO)\b/i)
                || fullContent.match(/(?:^|\n)[#\s\*_]*(?:Write an essay|Task 2|Essay Writing)\b/i)
                || fullContent.match(/(?:^|\n)[#\s\*_]*You should spend about 40 minutes on this task/i);

              if (task2Match && task2Match.index! > 0) {
                const t1Prompt = fullContent.substring(0, task2Match.index!).trim();
                const t2Prompt = fullContent.substring(task2Match.index!).trim();

                sec1.content = t1Prompt;
                if (!sec2 || !sec2.content || sec2.content.includes("Write an essay responding")) {
                  if (!sec2) {
                    sec2 = { section_no: 2, title: "Task 2 - Essay Writing", content: t2Prompt, answers: {} };
                    parsed.sections.push(sec2);
                  } else {
                    sec2.content = t2Prompt;
                  }
                }
              }
            }

            if (sec2) {
              sec2.title = "Task 2 - Essay Writing";
              if (typeof sec2.answers !== "object" || !sec2.answers) {
                sec2.answers = {};
              }
            }
          } else {
            parsed.sections.forEach((sec: any) => {
              const secNo = sec.section_no || 1;
              if (sec.content) {
                sec.content = sec.content.replace(/(?:^|\n)(?:#+\s*)?\**\s*(?:ANSWERS?|ANSWER KEY|DÁP ÁN)\b\s*\**\s*[\r\n]+[\s\S]*$/i, "").trim();
                
                if (secNo === 1) {
                  const p1Match = sec.content.match(/(?:READING\s*PASSAGE|PASSAGE)\s*1\b/i);
                  if (p1Match && p1Match.index! > 0) {
                    sec.content = sec.content.substring(p1Match.index!).trim();
                  }
                  sec.content = sec.content
                    .replace(/^(?:<p>)?[\s\S]*?(?:INTERNATIONAL ENGLISH LANGUAGE TESTING SYSTEM|INSTRUCTIONS TO CANDIDATES|Candidate Name|Academic Reading PRACTICE TEST)[^\n]*?(?:<\/p>|\n)?/gi, "")
                    .trim();
                }
              }

              const fallbackSecAns = secNo === 1 ? parsedAnswersMap.sec1 : secNo === 2 ? parsedAnswersMap.sec2 : parsedAnswersMap.sec3;

              let isLumped = false;
              if (sec.answers && typeof sec.answers === "object") {
                const keys = Object.keys(sec.answers);
                if (keys.length < 5) {
                  for (const k of keys) {
                    if (typeof sec.answers[k] === "string" && sec.answers[k].split(/\s+/).length > 3) {
                      isLumped = true;
                      break;
                    }
                  }
                }
              }

              if (!sec.answers || Object.keys(sec.answers).length === 0 || isLumped) {
                sec.answers = rekeyAnswers(fallbackSecAns, secNo);
              } else {
                sec.answers = rekeyAnswers(sec.answers, secNo);
              }
            });
          }

          return NextResponse.json({
            success: true,
            fileName: file.name,
            parsed: parsed,
            rawText: cleanExtractedText,
            source: "gemini"
          });
        }
      } catch (geminiError) {
        console.warn("[Gemini Exam Parse] Fallback to regex parser due to API error:", geminiError);
      }
    }

    // Fallback to local regex text parser
    const fallbackParsed = fallbackParseExamContent(cleanExtractedText, category);
    if (isWriting && docxImages.length > 0 && fallbackParsed.sections.length > 0) {
      const sec1 = fallbackParsed.sections[0];
      if (!sec1.answers.image_url) {
        sec1.answers.image_url = docxImages[0].url;
      }
    } else if (!isWriting) {
      fallbackParsed.sections.forEach((sec: any) => {
        const secNo = sec.section_no || 1;
        const fallbackSecAns = secNo === 1 ? parsedAnswersMap.sec1 : secNo === 2 ? parsedAnswersMap.sec2 : parsedAnswersMap.sec3;
        if (!sec.answers || Object.keys(sec.answers).length === 0) {
          sec.answers = rekeyAnswers(fallbackSecAns, secNo);
        } else {
          sec.answers = rekeyAnswers(sec.answers, secNo);
        }
      });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      parsed: fallbackParsed,
      rawText: cleanExtractedText,
      source: "fallback"
    });
  } catch (err: any) {
    console.error("Parse file error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to read file" },
      { status: 500 }
    );
  }
}




