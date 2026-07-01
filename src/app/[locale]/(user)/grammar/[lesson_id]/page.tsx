"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Award, Volume2, HelpCircle } from "lucide-react";

interface Section {
  title: string;
  explanation: string;
  examples: string[];
  common_mistakes: string[];
  topic_tags?: string[];
}

interface LessonDetail {
  id: string;
  lesson_id: string;
  title: string;
  band: string;
  order_index: number;
  sections: Section[];
}

interface Question {
  text: string;
  options: string[];
  answer: number; // Index of the correct option
  explanation: string;
}

// Predefined exercises for all lessons
const LESSON_EXERCISES: Record<string, Question[]> = {
  gl_001: [
    {
      text: "I ________ to London three times so far.",
      options: ["went", "have gone", "have been", "was going"],
      answer: 2,
      explanation: "Dùng Present Perfect 'have been' để chỉ trải nghiệm (đã từng đi đến đâu và đã quay về) tính đến thời điểm hiện tại."
    },
    {
      text: "She ________ her IELTS exam yesterday.",
      options: ["finished", "has finished", "was finished", "finishes"],
      answer: 0,
      explanation: "Trạng từ thời gian xác định trong quá khứ 'yesterday' bắt buộc dùng thì quá khứ đơn (Past Simple)."
    },
    {
      text: "They ________ in this city since 2010.",
      options: ["lived", "are living", "have lived", "live"],
      answer: 2,
      explanation: "Từ nhận biết 'since + mốc thời gian' dùng để diễn tả sự việc bắt đầu trong quá khứ và vẫn kéo dài đến hiện tại, dùng Present Perfect."
    }
  ],
  gl_002: [
    {
      text: "If you heat ice to 0°C, it ________.",
      options: ["melted", "will melt", "melts", "would melt"],
      answer: 2,
      explanation: "Câu điều kiện loại 0 (Zero Conditional) dùng để diễn tả sự thật hiển nhiên hoặc quy luật tự nhiên: If + S1 + V(s/es), S2 + V(s/es)."
    },
    {
      text: "If she studies hard, she ________ the exam next week.",
      options: ["will pass", "passed", "passes", "would pass"],
      answer: 0,
      explanation: "Câu điều kiện loại 1 (First Conditional) nói về khả năng có thể xảy ra ở tương lai: If + Present Simple, S + will + V_inf."
    },
    {
      text: "If I ________ you, I would register for the test immediately.",
      options: ["am", "was", "were", "would be"],
      answer: 2,
      explanation: "Câu điều kiện loại 2 (Second Conditional) giả định tình huống không có thật ở hiện tại. Động từ to-be trong mệnh đề 'if' luôn dùng 'were' đối với tất cả các ngôi."
    }
  ],
  gl_003: [
    {
      text: "The passive voice sentence 'The report ________ next month' should be completed with:",
      options: ["will publish", "will be published", "published", "is published"],
      answer: 1,
      explanation: "Cấu trúc bị động thì tương lai đơn: will be + Past Participle (V3/ed)."
    },
    {
      text: "English ________ in over 50 countries as an official language.",
      options: ["is spoken", "speaks", "spoken", "has spoken"],
      answer: 0,
      explanation: "Sự thật hiển nhiên ở hiện tại, chủ ngữ 'English' nhận hành động nói nên dùng thể bị động hiện tại đơn: is + V3."
    },
    {
      text: "The grammar lessons ________ by the teacher before we arrived.",
      options: ["have been prepared", "had been prepared", "were prepared", "prepared"],
      answer: 1,
      explanation: "Sự việc hoàn thành trước một thời điểm/hành động khác trong quá khứ ('before we arrived') dùng bị động quá khứ hoàn thành: had been + V3."
    }
  ],
  gl_004: [
    {
      text: "________ internet has revolutionized the way people access information worldwide.",
      options: ["A", "An", "The", "No article"],
      answer: 2,
      explanation: "Sử dụng mạo từ 'The' trước các danh từ duy nhất hoặc các phát minh mang tính phổ thông như 'the internet', 'the radio'."
    },
    {
      text: "He wants to become ________ university professor after graduation.",
      options: ["a", "an", "the", "no article"],
      answer: 0,
      explanation: "Mặc dù 'university' bắt đầu bằng nguyên âm 'u', nhưng phiên âm bắt đầu bằng phụ âm /j/ (yoo-ni-ver-si-ty), do đó dùng mạo từ 'a'."
    },
    {
      text: "________ education is widely considered a powerful tool for social mobility.",
      options: ["A", "An", "The", "No article"],
      answer: 3,
      explanation: "Danh từ không đếm được chỉ khái niệm chung (như education, health) không đi kèm mạo từ khi nói chung chung."
    }
  ],
  gl_005: [
    {
      text: "The researcher ________ paper was published last week will present at the conference.",
      options: ["who", "which", "whose", "whom"],
      answer: 2,
      explanation: "Sử dụng đại từ quan hệ sở hữu 'whose' đứng trước danh từ sở hữu 'paper' (whose paper = bài báo của nhà nghiên cứu đó)."
    },
    {
      text: "This is the laboratory ________ the study on air pollution was conducted.",
      options: ["where", "which", "in that", "that"],
      answer: 0,
      explanation: "Dùng trạng từ quan hệ chỉ nơi chốn 'where' thay cho cụm 'in which'."
    },
    {
      text: "The new methodology, ________ had several limitations, was heavily criticized.",
      options: ["that", "which", "who", "where"],
      answer: 1,
      explanation: "Mệnh đề quan hệ không xác định (có dấu phẩy) chỉ dùng đại từ quan hệ 'which' cho vật, tuyệt đối không dùng 'that'."
    }
  ],
  gl_006: [
    {
      text: "To achieve a high score, candidates ________ follow the instructions carefully.",
      options: ["must", "might", "could", "may"],
      answer: 0,
      explanation: "Modal verb 'must' chỉ nghĩa bắt buộc, yêu cầu bắt buộc phải thực hiện trong phòng thi."
    },
    {
      text: "The government ________ invest more in renewable energy to combat climate change.",
      options: ["should", "shall", "ought", "would"],
      answer: 0,
      explanation: "'Should' dùng để đưa ra lời khuyên hoặc kiến nghị giải pháp (rất phổ biến trong IELTS Writing Task 2)."
    },
    {
      text: "Using plastic bags ________ be banned completely to protect marine life.",
      options: ["must", "can", "ought to", "might"],
      answer: 2,
      explanation: "'Ought to' dùng chỉ bổn phận hoặc sự cần thiết hành động khách quan."
    }
  ],
  gl_007: [
    {
      text: "The report stated that global temperatures ________ risen significantly in the past decade.",
      options: ["have", "had", "will", "are"],
      answer: 1,
      explanation: "Khi lùi thì trong câu gián tiếp (phía trước là quá khứ 'stated'), thì hiện tại hoàn thành 'have risen' được lùi thành quá khứ hoàn thành 'had risen'."
    },
    {
      text: "She asked the interviewer when the results ________ be announced.",
      options: ["will", "would", "are going to", "can"],
      answer: 1,
      explanation: "Lùi từ tương lai đơn 'will' thành tương lai trong quá khứ 'would' trong câu tường thuật gián tiếp."
    },
    {
      text: "He claimed that he ________ working on the project for two years.",
      options: ["has been", "had been", "is", "was"],
      answer: 1,
      explanation: "Lùi thì hiện tại hoàn thành tiếp diễn 'has been working' thành quá khứ hoàn thành tiếp diễn 'had been working' sau động từ dẫn quá khứ 'claimed'."
    }
  ],
  gl_008: [
    {
      text: "The more people use public transport, ________ the level of traffic congestion.",
      options: ["lower", "the lower", "the lowest", "more low"],
      answer: 1,
      explanation: "Cấu trúc so sánh kép (Double Comparative): The + comparative + S + V, the + comparative + S + V."
    },
    {
      text: "Academic writing is significantly ________ informal writing.",
      options: ["more formal than", "formal than", "as formal as", "most formal of"],
      answer: 0,
      explanation: "So sánh hơn đối với tính từ dài 'formal': more + adj + than."
    },
    {
      text: "This is by far ________ effective method we have tried.",
      options: ["the most", "most", "more", "the more"],
      answer: 0,
      explanation: "Cấu trúc nhấn mạnh so sánh nhất: by far + the + superlative."
    }
  ],
  gl_009: [
    {
      text: "The price of oil has increased. ________, the cost of transportation has risen.",
      options: ["However", "Consequently", "On the other hand", "Although"],
      answer: 1,
      explanation: "'Consequently' (Kết quả là, do đó) dùng để liên kết chỉ mối quan hệ nhân quả phù hợp nhất trong văn cảnh này."
    },
    {
      text: "________ the high cost of implementation, solar energy is becoming popular.",
      options: ["Despite", "Although", "In spite", "Even though"],
      answer: 0,
      explanation: "'Despite' cộng cụm danh từ chỉ sự nhượng bộ. 'In spite' thiếu giới từ 'of'."
    },
    {
      text: "Living in a city offers many jobs. ________, it also exposes residents to high noise levels.",
      options: ["Furthermore", "In addition", "However", "Therefore"],
      answer: 2,
      explanation: "'However' (Tuy nhiên) dùng để bắt đầu mệnh đề chỉ sự tương phản đối lập với câu phía trước."
    }
  ],
  gl_010: [
    {
      text: "________ many people agree that homework is necessary, others believe it causes stress.",
      options: ["While", "Because", "Since", "Due to"],
      answer: 0,
      explanation: "'While' (Trong khi) dùng để bắt đầu mệnh đề nhượng bộ thể hiện hai quan điểm đối lập trong câu phức."
    },
    {
      text: "The project was delayed ________ the lack of funding.",
      options: ["because", "due to", "although", "since"],
      answer: 1,
      explanation: "'Due to' đi kèm với cụm danh từ để chỉ nguyên nhân. 'Because' và 'since' phải đi kèm một mệnh đề."
    },
    {
      text: "He practiced speaking every day ________ he could achieve band 7.",
      options: ["so that", "in order to", "because of", "though"],
      answer: 0,
      explanation: "'So that' đi kèm mệnh đề chỉ mục đích."
    }
  ],
  gl_011: [
    {
      text: "Seldom ________ such a significant discovery been made in this field.",
      options: ["has", "have", "had", "did"],
      answer: 0,
      explanation: "Đảo ngữ với trạng từ tần suất phủ định 'Seldom': Seldom + trợ động từ + S + V. Vì danh từ số ít 'discovery', trợ động từ hiện tại hoàn thành là 'has'."
    },
    {
      text: "Not only ________ they lose the match, but they also lost their key player.",
      options: ["did", "have", "had", "do"],
      answer: 0,
      explanation: "Đảo ngữ quá khứ đơn: Not only + did + S + V_inf."
    },
    {
      text: "Under no circumstances ________ confidential data be shared.",
      options: ["should", "ought", "must to", "can to"],
      answer: 0,
      explanation: "Đảo ngữ với trợ động từ khuyết thiếu: Under no circumstances + modal verb + S + V."
    }
  ],
  gl_012: [
    {
      text: "________ of the new policy caused widespread debate.",
      options: ["The introduction", "Introduce", "Introducing", "To introduce"],
      answer: 0,
      explanation: "Danh từ hóa (Nominalisation) chuyển động từ thành danh từ làm chủ ngữ trang trọng hơn trong văn viết học thuật."
    },
    {
      text: "The sudden ________ in temperature surprised the scientists.",
      options: ["rise", "rose", "rising", "risen"],
      answer: 0,
      explanation: "Sử dụng danh từ 'rise' đi sau tính từ 'sudden'."
    },
    {
      text: "There is a need for a clear ________ of the problem.",
      options: ["explanation", "explain", "explaining", "explanatory"],
      answer: 0,
      explanation: "Cụm danh từ 'a clear explanation' sau giới từ 'for'."
    }
  ],
  gl_013: [
    {
      text: "The findings ________ suggest that there is a link between diet and health.",
      options: ["definitely", "would seem to", "must", "will"],
      answer: 1,
      explanation: "Dùng cụm ngôn từ giảm nhẹ (Hedging) 'would seem to' để tránh khẳng định quá tuyệt đối trong nghiên cứu khoa học."
    },
    {
      text: "It is ________ believed that carbon emissions cause global warming.",
      options: ["widely", "absolutely", "always", "certainly"],
      answer: 0,
      explanation: "'Widely believed' (Được tin tưởng rộng rãi) là collocation chuẩn thể hiện nhận định khách quan chung."
    },
    {
      text: "This trend ________ be attributed to the rise of social media usage.",
      options: ["cannot", "could possibly", "is bound to", "will certainly"],
      answer: 1,
      explanation: "'Could possibly' thể hiện khả năng phỏng đoán nhẹ nhàng, mang tính học thuật cao."
    }
  ],
  gl_014: [
    {
      text: "It is the government ________ should take immediate action to resolve this.",
      options: ["who", "that", "whom", "whose"],
      answer: 1,
      explanation: "Cấu trúc câu chẻ nhấn mạnh chủ ngữ (It is/was + Clause Focus + that...)."
    },
    {
      text: "What the public really wants ________ a reduction in taxes.",
      options: ["is", "are", "were", "been"],
      answer: 0,
      explanation: "Câu chẻ với Wh- (Wh-cleft): What + Clause + is/was + Focus."
    },
    {
      text: "It was in 2015 ________ the Paris Agreement was signed.",
      options: ["when", "that", "where", "which"],
      answer: 1,
      explanation: "Câu chẻ nhấn mạnh trạng từ chỉ thời gian: It was in + Year + that..."
    }
  ],
  gl_015: [
    {
      text: "By the time the new policy was implemented, emissions ________ already fallen.",
      options: ["have", "had", "did", "were"],
      answer: 1,
      explanation: "Hành động xảy ra trước một hành động quá khứ khác ('By the time ... was implemented') dùng thì Quá khứ hoàn thành."
    },
    {
      text: "He ________ working on this research project since last summer.",
      options: ["is", "was", "has been", "had been"],
      answer: 2,
      explanation: "Thì Hiện tại hoàn thành tiếp diễn diễn tả hành động bắt đầu từ quá khứ kéo dài liên tục tới hiện tại."
    },
    {
      text: "Next month, they ________ lived in this country for ten years.",
      options: ["will have", "have", "will have been", "would have"],
      answer: 0,
      explanation: "Thì Tương lai hoàn thành (will have + V3) diễn tả sự việc sẽ hoàn thành trước một thời điểm trong tương lai."
    }
  ],
  gl_016: [
    {
      text: "________ the economic benefits, the environmental costs cannot be ignored.",
      options: ["Notwithstanding", "Although", "In spite", "Even though"],
      answer: 0,
      explanation: "'Notwithstanding' đi kèm cụm danh từ với ý nghĩa 'mặc dù / bất chấp'."
    },
    {
      text: "Albeit ________, the progress they made was significant.",
      options: ["slow", "slowly", "slowness", "of slow"],
      answer: 0,
      explanation: "'Albeit' có thể đi kèm trực tiếp với một tính từ có vai trò như mệnh đề nhượng bộ rút gọn."
    },
    {
      text: "Much ________ I agree with the main goal, I cannot support this policy.",
      options: ["as", "though", "although", "even"],
      answer: 0,
      explanation: "Cấu trúc nhấn mạnh sự nhượng bộ: Much as + S + V (Dù cho rất...)."
    }
  ],
  gl_017: [
    {
      text: "________ the exam early, she went home to rest.",
      options: ["Having finished", "Finished", "To finish", "Finishes"],
      answer: 0,
      explanation: "Phân từ hoàn thành (Having + V3) dùng để rút gọn mệnh đề trạng ngữ chỉ hành động xảy ra và hoàn thành trước hành động trong mệnh đề chính."
    },
    {
      text: "________ from a distance, the building looks like a spaceship.",
      options: ["Seen", "Seeing", "Saw", "To see"],
      answer: 0,
      explanation: "Phân từ quá khứ (V3) dùng khi rút gọn mệnh đề trạng ngữ mang nghĩa bị động (Khi được nhìn từ xa...)."
    },
    {
      text: "Not ________ the answer, the student decided to leave the question blank.",
      options: ["knowing", "known", "to know", "knew"],
      answer: 0,
      explanation: "Dạng phủ định của mệnh đề phân từ: Not + V-ing."
    }
  ],
  gl_018: [
    {
      text: "It is crucial that the president ________ this issue immediately.",
      options: ["address", "addresses", "addressed", "should address to"],
      answer: 0,
      explanation: "Thức giả định (Subjunctive mood) sử dụng động từ nguyên thể không chia (V_bare) sau các tính từ khẩn thiết như 'crucial that'."
    },
    {
      text: "The committee recommended that the budget ________ increased.",
      options: ["be", "is", "was", "are"],
      answer: 0,
      explanation: "Cấu trúc giả định bị động: S + recommend + that + S + be + V3."
    },
    {
      text: "I demand that he ________ us the truth.",
      options: ["tell", "tells", "told", "should tell to"],
      answer: 0,
      explanation: "Thức giả định sau động từ yêu cầu 'demand that' sử dụng động từ nguyên thể không chia."
    }
  ],
  gl_019: [
    {
      text: "________, speaking tests are scored based on four criteria.",
      options: ["As far as I'm concerned", "Basically", "In terms of", "On the other hand"],
      answer: 1,
      explanation: "'Basically' (Về cơ bản) là từ nối định hướng (discourse marker) tóm lược ý quan trọng."
    },
    {
      text: "Learning English is hard. ________, it requires daily practice.",
      options: ["Specifically", "In other words", "On top of that", "Otherwise"],
      answer: 0,
      explanation: "'Specifically' (Cụ thể là) dùng để làm rõ, chi tiết hóa nhận định chung trước đó."
    },
    {
      text: "________, I think technology does more good than harm.",
      options: ["All in all", "Furthermore", "For instance", "Alternatively"],
      answer: 0,
      explanation: "'All in all' (Tóm lại) dùng để tổng hợp lại toàn bộ luận điểm trong nói và viết."
    }
  ],
  gl_020: [
    {
      text: "The candidate was praised for her intelligence, her diligence, and ________.",
      options: ["she was honest", "honesty", "being honest", "her honesty"],
      answer: 3,
      explanation: "Cấu trúc song hành (Parallel structure) yêu cầu các thành phần liệt kê cùng cấu trúc ngữ pháp (her + Noun)."
    },
    {
      text: "I like reading, writing, and ________ english.",
      options: ["to speak", "speaking", "speak", "speech"],
      answer: 1,
      explanation: "Cấu trúc song hành yêu cầu danh động từ 'speaking' đồng bộ cùng 'reading' và 'writing'."
    },
    {
      text: "The report is concise, informative, and ________.",
      options: ["easy to read", "easily read", "readability", "readable"],
      answer: 3,
      explanation: "Liệt kê chuỗi tính từ song hành: concise (adj), informative (adj), readable (adj)."
    }
  ]
};

// Fallback questions if a lesson does not have customized exercises
const FALLBACK_QUESTIONS: Question[] = [
  {
    text: "Identify the correct academic sentence structure:",
    options: [
      "The results was analyzed by researchers.",
      "The results were analyzed by researchers.",
      "The results have analyzed by researchers.",
      "The results analyze by researchers."
    ],
    answer: 1,
    explanation: "Chủ ngữ số nhiều 'results' đi cùng to-be số nhiều 'were' trong thể bị động quá khứ đơn."
  },
  {
    text: "Choose the word that fits best in an academic context: 'The government aims to ________ poverty.'",
    options: ["kill", "eradicate", "stop", "end"],
    answer: 1,
    explanation: "'Eradicate' (xóa sổ, loại bỏ hoàn toàn) là từ vựng mang tính học thuật (academic word) phù hợp nhất cho ngữ cảnh viết luận IELTS Task 2."
  },
  {
    text: "Which linking word shows concession?",
    options: ["Therefore", "Furthermore", "Although", "Consequently"],
    answer: 2,
    explanation: "'Although' (Mặc dù) dùng để chỉ sự nhượng bộ (concession), nối hai mệnh đề trái ngược nhau về mặt ý nghĩa."
  }
];

export default function GrammarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const lessonId = params.lesson_id as string;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTheory, setShowTheory] = useState(true);

  // Exercise States
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadLesson() {
      try {
        setLoading(true);
        const res = await fetch(`/api/grammar?lesson_id=${lessonId}`);
        if (!res.ok) throw new Error("Không thể tải chi tiết bài học");
        const data = await res.json();
        setLesson(data.lesson);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết bài học:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center text-gray-400 font-semibold text-xs">
        <div className="w-9 h-9 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mb-3" />
        Đang tải nội dung bài học...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-400 text-sm font-semibold">Không tìm thấy bài học ngữ pháp này.</p>
        <button
          onClick={() => router.push(`/${locale}/grammar`)}
          className="mt-4 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const questions = LESSON_EXERCISES[lesson.lesson_id] || FALLBACK_QUESTIONS;

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;

    let correctCount = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) {
        correctCount += 1;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    // Save to practice_history
    if (user) {
      setSaveStatus("saving");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session found");

        const res = await fetch("/api/grammar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            lessonId: lesson.lesson_id,
            lessonTitle: lesson.title,
            score: correctCount,
            totalQuestions: questions.length,
            band: lesson.band
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save practice history");
        }

        setSaveStatus("saved");
      } catch (err) {
        console.error("Lỗi khi lưu kết quả vào practice_history:", err);
        setSaveStatus("error");
      }
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    setSaveStatus(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] p-6 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => router.push(`/${locale}/grammar`)}
          className="flex items-center gap-2 text-xs font-black text-purple-600 hover:text-purple-700 transition mb-6 bg-transparent border-none outline-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          DANH SÁCH NGỮ PHÁP
        </button>

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <span className="border border-purple-500 text-purple-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block">
              Band {lesson.band} — LÝ THUYẾT & THỰC HÀNH
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-3 leading-tight uppercase">
              {lesson.title}
            </h1>
          </div>

          {/* Toggle content */}
          <div className="flex bg-white/60 p-1 rounded-xl border border-gray-200 shadow-sm shrink-0 self-start">
            <button
              onClick={() => setShowTheory(true)}
              className={`px-4 py-2 text-xs font-black rounded-lg transition duration-200 uppercase tracking-wider ${
                showTheory ? "bg-purple-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Lý thuyết
            </button>
            <button
              onClick={() => setShowTheory(false)}
              className={`px-4 py-2 text-xs font-black rounded-lg transition duration-200 uppercase tracking-wider ${
                !showTheory ? "bg-purple-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Bài tập ({questions.length})
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/*                    THEORY TAB CONTENT                   */}
        {/* ======================================================= */}
        {showTheory ? (
          <div className="mt-8 space-y-8 animate-fade-in">
            {lesson.sections && lesson.sections.map((section, sIdx) => (
              <section key={sIdx} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-[10px] font-black text-purple-600 tracking-widest uppercase block mb-1">
                    PHẦN {sIdx + 1}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">
                    {section.title}
                  </h3>
                </div>

                {/* Explanation */}
                <div className="text-sm font-semibold text-gray-600 leading-relaxed bg-[#F5F3EE]/30 p-5 rounded-2xl border border-gray-100">
                  <p>{section.explanation}</p>
                </div>

                {/* Examples */}
                {section.examples && section.examples.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                      Ví dụ minh họa (Ví dụ học thuật)
                    </h4>
                    <div className="space-y-2">
                      {section.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl text-sm font-bold text-gray-800 leading-relaxed"
                        >
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Mistakes */}
                {section.common_mistakes && section.common_mistakes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-wider mb-3">
                      Lỗi thường gặp cần tránh
                    </h4>
                    <div className="space-y-2">
                      {section.common_mistakes.map((mistake, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-sm font-bold text-red-700 leading-relaxed"
                        >
                          {mistake}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8 text-center mt-6">
              <p className="text-purple-700 font-black text-base">ĐÃ ĐỌC XONG PHẦN LÝ THUYẾT?</p>
              <p className="text-purple-500 text-xs font-semibold mt-1">
                Luyện tập ngay các câu hỏi trắc nghiệm thực hành để củng cố kiến thức ngữ pháp vừa học.
              </p>
              <button
                onClick={() => setShowTheory(false)}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-black text-xs transition duration-200 shadow-sm border-none cursor-pointer outline-none uppercase tracking-wider"
              >
                Làm bài tập ngay
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================= */
          /*                   EXERCISE TAB CONTENT                  */
          /* ======================================================= */
          <div className="mt-8 space-y-6 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h3 className="font-black text-xs text-purple-600 uppercase tracking-widest">
                    EXERCISE: MULTIPLE CHOICE PRACTICE
                  </h3>
                  <p className="text-gray-400 text-xs font-semibold mt-1">
                    Chọn đáp án đúng nhất cho các câu hỏi ngữ pháp học thuật dưới đây:
                  </p>
                </div>

                {/* Score Summary */}
                {submitted && (
                  <div className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-purple-800 font-black text-lg">Hoàn thành bài tập!</h4>
                      <p className="text-purple-600 text-xs font-semibold mt-1">
                        Kết quả đạt được: {score}/{questions.length} câu trả lời chính xác.
                      </p>
                      {saveStatus === "saved" && (
                        <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded mt-2 inline-block">
                          ✓ Đã lưu lịch sử học tập
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex flex-col items-center justify-center shadow">
                      <span className="text-2xl font-black">{score}</span>
                      <span className="text-[9px] font-bold border-t border-white/30 w-10 text-center">/{questions.length}</span>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-8">
                  {questions.map((q, qIdx) => {
                    const isCorrect = userAnswers[qIdx] === q.answer;
                    const isAnswered = userAnswers[qIdx] !== undefined;

                    return (
                      <div key={qIdx} className="space-y-3">
                        <p className="font-extrabold text-sm text-gray-900 leading-snug">
                          <span className="text-purple-600 font-black text-base">{qIdx + 1}.</span> {q.text}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-2.5 pl-4">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = userAnswers[qIdx] === optIdx;
                            const isCorrectOpt = q.answer === optIdx;

                            let optionStyle = "border-gray-200 bg-gray-50/50 hover:bg-gray-50 text-gray-700";
                            if (isSelected) {
                              optionStyle = "border-purple-600 bg-purple-50 text-purple-900 font-extrabold";
                            }

                            if (submitted) {
                              if (isCorrectOpt) {
                                optionStyle = "border-green-600 bg-green-50 text-green-900 font-extrabold ring-2 ring-green-600/10";
                              } else if (isSelected && !isCorrect) {
                                optionStyle = "border-red-600 bg-red-50 text-red-900 font-extrabold ring-2 ring-red-600/10";
                              } else {
                                optionStyle = "border-gray-200 bg-white text-gray-400 opacity-60";
                              }
                            }

                            return (
                              <label
                                key={optIdx}
                                onClick={() => handleOptionSelect(qIdx, optIdx)}
                                className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ${optionStyle}`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${qIdx}`}
                                  checked={isSelected}
                                  disabled={submitted}
                                  onChange={() => {}}
                                  className="accent-purple-600 shrink-0 w-4 h-4 cursor-pointer"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Question explanation after submit */}
                        {submitted && (
                          <div className={`mt-3 p-4 rounded-xl text-xs leading-relaxed font-semibold border ${
                            isCorrect ? "bg-green-50/20 border-green-100 text-green-700" : "bg-red-50/20 border-red-100 text-red-700"
                          }`}>
                            <div className="flex items-center gap-1.5 font-black uppercase mb-1">
                              {isCorrect ? (
                                <><CheckCircle className="w-4 h-4 text-green-600" /> Đúng</>
                              ) : (
                                <><XCircle className="w-4 h-4 text-red-600" /> Chưa chính xác</>
                              )}
                            </div>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3">
                {!submitted ? (
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl transition duration-200 shadow-sm uppercase tracking-wider border-none cursor-pointer outline-none"
                  >
                    Kiểm tra đáp án
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-black text-xs rounded-xl transition duration-200 shadow-sm uppercase tracking-wider cursor-pointer outline-none"
                  >
                    Làm lại bài
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowTheory(true)}
                  className="px-6 py-3.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 font-black text-xs rounded-xl transition duration-200 cursor-pointer outline-none uppercase tracking-wider"
                >
                  Xem lại lý thuyết
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
