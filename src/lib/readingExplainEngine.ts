import { READING_PASSAGE_1 } from "@/lib/readingMockData";
import { READING_ANSWER_KEY } from "@/lib/readingAnswerKey";
import type { ReadingQuestion, TfngOption } from "@/types/reading";

type GradeMeta = {
  keywords: string[];
  evidenceParagraphId?: string;
  evidenceQuote?: string;
  scanSummary: string;
  analysis: string;
  conclusion: string;
  tip?: string;
};

function getParagraphText(paragraphId?: string) {
  if (!paragraphId) return "";
  return (
    READING_PASSAGE_1.paragraphs.find((p) => p.id === paragraphId)?.text ?? ""
  );
}

function tfLabelFromCorrect(correct: string): TfngOption | "UNKNOWN" {
  const u = correct.trim().toUpperCase();
  if (u === "TRUE") return "TRUE";
  if (u === "FALSE") return "FALSE";
  if (u === "NOT GIVEN") return "NOT GIVEN";
  return "UNKNOWN";
}

function buildForQuestionId(questionId: number, userAnswer: string): GradeMeta {
  // NOTE: Mock data is fixed for now; we provide evidence-based explanations
  // to guarantee correctness (no hallucinated reasoning).
  switch (questionId) {
    case 1: {
      // Q1: TRUE
      return {
        keywords: ["Proponents", "greenhouse gas emissions", "reduces"],
        evidenceParagraphId: "p1",
        evidenceQuote:
          "growing food where it is consumed reduces transportation costs and greenhouse gas emissions",
        scanSummary:
          "Xác định “greenhouse gas emissions” trong câu hỏi trùng với ý “greenhouse gas emissions” trong passage.",
        analysis:
          "Đoạn A nói rằng người ủng hộ cho rằng trồng thực phẩm ngay nơi tiêu thụ giúp giảm “greenhouse gas emissions”.",
        conclusion: "Kết luận: mệnh đề trong câu hỏi khớp với passage → TRUE.",
        tip: "Với TF/NG, hãy gạch “nghĩa lõi” trong câu hỏi (ví dụ: emissions) rồi tìm đúng cụm tương ứng trong passage.",
      };
    }
    case 2: {
      // Q2: FALSE
      return {
        keywords: ["higher nutritional value", "rural", "cities"],
        evidenceParagraphId: "p2",
        evidenceQuote:
          "fruit and vegetables are often picked unripe to survive long journeys, losing nutritional value along the way",
        scanSummary:
          "Câu hỏi nói rau củ từ nông thôn luôn có dinh dưỡng cao hơn, nhưng passage lại nói bị mất giá trị dinh dưỡng khi vận chuyển đường dài.",
        analysis:
          "Đoạn B giải thích rau quả thường được hái khi chưa chín để sống sót trong hành trình dài và “losing nutritional value” trên đường đi.",
        conclusion:
          "Kết luận: câu hỏi đảo ngược ý → FALSE.",
        tip: "TF/NG: để ý từ phủ định/điểm khác biệt (không chín → mất dinh dưỡng) thay vì chỉ nhìn “rural/cities”.",
      };
    }
    case 3: {
      // Q3: TRUE
      return {
        keywords: ["supply chain disruptions", "affect", "food availability", "empty shelves"],
        evidenceParagraphId: "p2",
        evidenceQuote:
          "supply chain disruptions ... can leave city supermarket shelves empty within days",
        scanSummary:
          "Tìm “supply chain disruptions” và hệ quả trực tiếp đến “food availability” trong các siêu thị thành phố.",
        analysis:
          "Đoạn B nêu rõ khi chuỗi cung ứng bị gián đoạn (fuel price hikes/extreme weather), siêu thị có thể trống “within days”.",
        conclusion: "Kết luận: passage ủng hộ mệnh đề → TRUE.",
        tip: "Với câu dạng ‘X can lead to Y’, hãy kiểm tra trực tiếp quan hệ nguyên nhân–kết quả trong đúng đoạn.",
      };
    }
    case 4: {
      // Q4: NOT GIVEN
      return {
        keywords: ["governments", "made urban farming", "main source of food"],
        scanSummary:
          "Câu hỏi hỏi về việc ‘chính phủ đã biến canh tác đô thị thành nguồn lương thực chính’. Passage có bàn về lợi ích/khó khăn nhưng không nói rõ chính sách hay mức độ ‘main source’.",
        analysis:
          "Trong các đoạn của passage, không có thông tin khẳng định chính phủ ở hầu hết thành phố đã ‘made urban farming the main source of food’.",
        conclusion:
          "Kết luận: Không đủ dữ kiện → NOT GIVEN.",
        tip: "Nếu passage không nêu ‘chính phủ/nguồn lương thực chính’ hoặc không có số liệu/chính sách cụ thể → chọn NOT GIVEN.",
      };
    }
    case 5: {
      // Q5: MCQ B
      return {
        keywords: ["advantage", "vertical hydroponics", "physical space", "ten times the yield"],
        evidenceParagraphId: "p3",
        evidenceQuote:
          "drastically reducing the physical footprint required ... can produce up to ten times the yield",
        scanSummary:
          "Đọc đoạn C để tìm ‘ưu điểm’ liên quan đến diện tích và năng suất.",
        analysis:
          "Đoạn C nêu rõ thủy canh đứng giúp giảm mạnh ‘physical footprint’ và cho năng suất cao (up to ten times the yield) trên cùng diện tích.",
        conclusion:
          "Kết luận: phù hợp với lựa chọn B (higher yields in a smaller physical space).",
        tip: "MCQ: hãy tìm ‘đúng ý ưu điểm’ thay vì chọn theo từ đồng nghĩa bề mặt.",
      };
    }
    case 6: {
      // Q6: MCQ D
      return {
        keywords: ["use up to", "less water", "95%"],
        evidenceParagraphId: "p3",
        evidenceQuote:
          "uses up to 95% less water",
        scanSummary:
          "Trong câu hỏi có mốc con số 95% → tìm đúng câu trong passage.",
        analysis:
          "Đoạn C ghi rõ vertical farming ‘uses up to 95% less water’.",
        conclusion:
          "Kết luận: đáp án đúng là D (95% less water).",
        tip: "Khi câu hỏi chứa con số phần trăm, ưu tiên tìm câu có con số y hệt trong passage.",
      };
    }
    case 7: {
      // Q7: MCQ B
      return {
        keywords: ["critics", "energy", "electricity", "LED lighting", "climate control"],
        evidenceParagraphId: "p4",
        evidenceQuote:
          "critics point out ... energy consumption ... require substantial electricity",
        scanSummary:
          "Xác định ‘critics are mainly concerned about’ → đọc đoạn D để tìm mối lo chính.",
        analysis:
          "Đoạn D nói các trang trại thẳng đứng phụ thuộc nhiều vào LED lighting và climate control, cần điện lớn; nếu điện từ nhiên liệu hóa thạch thì footprint còn tệ hơn.",
        conclusion:
          "Kết luận: mối lo chính là ‘energy requirements of vertical farms’ → lựa chọn B.",
        tip: "TF/MCQ: từ ‘mainly concerned’ thường dẫn tới lý do chính được nhắc đầu đoạn/ câu kết của đoạn.",
      };
    }
    case 8: {
      // Matching: Paragraph B
      return {
        keywords: ["Historically", "segregated from urban life", "industrial revolution", "transport networks"],
        evidenceParagraphId: "p2",
        evidenceQuote:
          "Historically, food production was strictly segregated from urban life ... pushed farms further into rural areas",
        scanSummary:
          "Paragraph B nói về lịch sử tách biệt sản xuất nông nghiệp khỏi đời sống đô thị.",
        analysis:
          "Các câu đầu của đoạn B nhấn mạnh ‘strictly segregated’ và tác động của industrial revolution đẩy nông trại ra xa đô thị.",
        conclusion:
          "Kết luận: đúng với heading ‘Historical separation of farms and cities’ (ii).",
        tip: "Matching headings: đọc câu chủ đề đầu đoạn để tìm ‘mạch ý’ chính, không ghép theo chi tiết phụ.",
      };
    }
    case 9: {
      // Matching: Paragraph E
      return {
        keywords: ["Community engagement", "shared allotment gardens", "neighbourhood ties"],
        evidenceParagraphId: "p5",
        evidenceQuote:
          "Shared allotment gardens ... strengthening neighbourhood ties and improving mental wellbeing",
        scanSummary:
          "Paragraph E tập trung vào lợi ích xã hội/cộng đồng từ các không gian trồng chung.",
        analysis:
          "Đoạn mô tả cư dân tham gia trực tiếp, củng cố kết nối hàng xóm và cải thiện sức khỏe tinh thần.",
        conclusion:
          "Kết luận: phù hợp heading ‘Community benefits of shared growing spaces’ (iii).",
        tip: "Nếu đoạn nhắc rõ ‘community/residents/neighbourhood’, đó thường là nhóm headings về lợi ích cộng đồng.",
      };
    }
    case 10: {
      // Matching: Paragraph F
      return {
        keywords: ["Looking ahead", "technological advances", "automated monitoring", "drone pollination"],
        evidenceParagraphId: "p6",
        evidenceQuote:
          "Looking ahead, experts predict that technological advances ... Automated monitoring systems ... drone pollination",
        scanSummary:
          "Paragraph F nói về tương lai và công nghệ sẽ phát triển thế nào.",
        analysis:
          "Đoạn nêu rõ các tiến bộ công nghệ (automated monitoring, drone pollination) và dự báo xu hướng.",
        conclusion:
          "Kết luận: đúng heading ‘Future technological developments’ (iv).",
        tip: "Matching: từ khóa như ‘Looking ahead / predict / future’ gần như luôn thuộc nhóm headings về tương lai.",
      };
    }
    case 11: {
      // Fill: LED lighting
      return {
        keywords: ["artificial", "LED lighting", "climate control systems"],
        evidenceParagraphId: "p4",
        evidenceQuote:
          "Vertical farms rely heavily on artificial LED lighting and climate control systems",
        scanSummary:
          "Chỗ trống nằm giữa ‘artificial ____’ và ‘climate control systems’ → cụm ‘LED lighting’ là tự nhiên nhất.",
        analysis:
          "Đoạn D nêu rõ trang trại thẳng đứng dựa nặng vào ‘artificial LED lighting’ cùng hệ climate control.",
        conclusion: "Kết luận: đáp án là LED lighting.",
        tip: "Fill in the blank: nhìn ngữ pháp xung quanh (tính từ + danh từ) để chọn cụm khớp vai trò trong câu.",
      };
    }
    case 12: {
      // Fill: diseases
      return {
        keywords: ["detect", "plant", "at an early stage", "automated systems"],
        evidenceParagraphId: "p6",
        evidenceQuote:
          "detect plant diseases early",
        scanSummary:
          "Tìm câu nói ‘automated monitoring’ giúp phát hiện vấn đề ở giai đoạn sớm.",
        analysis:
          "Đoạn F ghi rõ automated monitoring systems có thể ‘detect plant diseases early’.",
        conclusion: "Kết luận: đáp án là diseases.",
        tip: "Fill blank: ưu tiên danh từ phù hợp với verb ‘detect’ (phát hiện) và đúng ngữ cảnh của câu.",
      };
    }
    case 13: {
      // Fill: zoning
      return {
        keywords: ["scaling", "require", "revised", "regulations", "zoning"],
        evidenceParagraphId: "p6",
        evidenceQuote:
          "Scaling urban agriculture ... will require coordinated investment, revised zoning regulations",
        scanSummary:
          "Câu hỏi nói ‘revised ____ regulations’ → trong đoạn có cụm ‘revised zoning regulations’.",
        analysis:
          "Đoạn F nêu rõ để mở rộng quy mô cần đầu tư phối hợp và ‘revised zoning regulations’.",
        conclusion: "Kết luận: đáp án là zoning.",
        tip: "Nếu câu hỏi có ‘revised X regulations’, hãy tìm đúng cụm danh từ chỉ loại quy định trong passage.",
      };
    }
    default: {
      return {
        keywords: [],
        scanSummary: "Không có dữ liệu giải thích chi tiết cho câu này.",
        analysis: "—",
        conclusion: `Không thể tạo giải thích nâng cao cho câu ${questionId}.`,
      };
    }
  }
}

export function buildReadingExplanationVi(
  question: ReadingQuestion,
  userAnswer: string,
  isCorrect: boolean
): { correctAnswer: string; isCorrect: boolean; explanationVi: string; tipVi?: string } {
  const correctAnswer = READING_ANSWER_KEY[question.id] ?? "";

  const meta = buildForQuestionId(question.id, userAnswer);
  const evidenceParagraphText = getParagraphText(meta.evidenceParagraphId);
  const evidenceSnippet =
    evidenceParagraphText.length > 260
      ? `${evidenceParagraphText.slice(0, 260)}...`
      : evidenceParagraphText;
  const user = userAnswer?.trim() ? userAnswer.trim() : "(không trả lời)";
  const topLine =
    question.type === "tfng"
      ? tfLabelFromCorrect(correctAnswer)
      : isCorrect
        ? "ĐÚNG"
        : "SAI";

  // Create a structure close to the example the user provided.
  const explanationVi = [
    `Giải thích`,
    `${topLine}`,
    ``,
    `Câu hỏi: “${question.prompt}”`,
    `Đáp án học sinh: ${user}`,
    `Đáp án chuẩn: ${correctAnswer}`,
    ``,
    `Bước 1: xác định keyword`,
    meta.keywords.length ? meta.keywords.map((k) => `- ${k}`).join("\n") : `- (không xác định được keyword cụ thể)`,
    ``,
    `Bước 2: scan đoạn liên quan`,
    `- Đoạn: ${meta.evidenceParagraphId ?? "(không xác định)"}`,
    meta.scanSummary,
    ``,
    `Bước 3: phân tích`,
    meta.evidenceQuote ? `- Trích ý: “${meta.evidenceQuote}”` : `- Trích ý: (không có)`,
    evidenceParagraphText
      ? `- Bài viết (đoạn ${meta.evidenceParagraphId}): ${evidenceSnippet}`
      : "",
    meta.analysis,
    ``,
    `Kết luận: ${meta.conclusion}`,
  ]
    .filter(Boolean)
    .join("\n");

  const tipVi = meta.tip;

  return {
    correctAnswer,
    isCorrect: isCorrect || false,
    explanationVi,
    tipVi,
  };
}

