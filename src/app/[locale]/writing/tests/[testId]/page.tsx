"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "@/i18n/navigation";
import { Clock, AlertCircle, Send, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import WritingGradeUI from "@/components/writing/WritingGradeUI";

import { supabase } from "@/lib/supabase";

export default function TestTakingEngine({ params }: { params: Promise<{ testId: string }> }) {
  const resolvedParams = use(params);
  const { testId } = resolvedParams;
  const category = "writing-tests";
  const router = useRouter();
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTestData() {
      setLoading(true);
      try {
        console.log('Current URL param (testId):', testId);
        
        const { data, error } = await supabase
          .from('writing_tasks')
          .select('*')
          .eq('youpass_id', testId)
          .single();

        if (error) throw error;

        if (data) {
          // Map database fields to frontend expectations
          const formattedData = {
            ...data,
            id: data.youpass_id,
            taskType: data.task_type,
            instruction: data.description,
            task1Title: data.title,
            task1Description: data.description,
            task2Title: data.title,
            task2Description: data.description,
            task1ImageUrl: data.cloudinary_url || data.thumbnail_url,
            guideHtml: data.guide_html,
          };
          setTestData(formattedData);
          setTimeLeft(60 * 60); // Default to 60 mins
        }
      } catch (err) {
        console.error("Error fetching writing task from Supabase:", err);
      }
      setLoading(false);
    }
    loadTestData();
  }, [category, testId]);

  // State
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Timer — only for reading (writing uses its own inline grading flow)
  useEffect(() => {
    if (!testData || category !== "reading") return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testData, category]);

  const handleAutoSubmit = () => {
    alert("Hết giờ! Hệ thống đang tự động nộp bài.");
    submitTest();
  };

  const submitTest = () => {
    setSubmitting(true);
    const submission = {
      testId,
      category,
      answers,
      timeSpent: (testData!.durationMinutes * 60) - timeLeft,
    };
    localStorage.setItem("ielts_mock_submission", JSON.stringify(submission));
    router.push(`/writing/tests/${testId}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-indigo-900 animate-pulse uppercase tracking-widest text-xs">Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy bài thi</h2>
        <p className="text-slate-500 mb-8 max-w-md">Có vẻ như bài thi này không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Link href="/" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Writing uses its own full-page layout — render directly, no test-shell wrapper
  if (category === "writing" || category === "writing-tests") {
    return (
      <WritingGradeUI
        testId={testId}
        taskType={testData.task_type || "task1"}
        title={testData.title || ""}
        description={testData.description}
        imageUrl={testData.cloudinary_url || testData.thumbnail_url}
        guideHtml={testData.guide_html}
      />
    );
  }

  const isWarning = timeLeft < 300; // Less than 5 mins

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Test Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Link href="/writing/tests" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-extrabold text-lg text-indigo-900 tracking-tight flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm uppercase">
              {category}
            </span>
            {testData.title}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center font-mono text-xl font-bold px-4 py-1.5 rounded-lg border transition-colors ${
            isWarning ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <Clock className={`w-5 h-5 mr-2 ${isWarning ? 'text-red-500' : 'text-slate-400'}`} />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={submitTest}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center shadow-md disabled:opacity-50"
          >
            {submitting ? 'Đang Nộp...' : 'Nộp Bài'}
            {!submitting && <Send className="w-4 h-4 ml-2" />}
          </button>
        </div>
      </header>

      {/* Test Body — Reading only */}
      <main className="flex-1 overflow-hidden flex">
        {category === "reading" && 'passage' in testData && (
          <>
            {/* Left Column: Passage */}
            <div className="w-1/2 h-full overflow-y-auto border-r border-slate-200 bg-white p-8 custom-scrollbar">
              <div className="max-w-2xl mx-auto">
                <div dangerouslySetInnerHTML={{ __html: (testData as any).passage }} />
              </div>
            </div>

            {/* Right Column: Questions */}
            <div className="w-1/2 h-full overflow-y-auto bg-slate-50 p-8 custom-scrollbar relative">
              <div className="max-w-2xl mx-auto space-y-8 pb-32">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                  <p className="text-sm font-medium">Đọc kỹ văn bản bên trái và chọn đáp án bên phải. Hệ thống sẽ tự động chấm điểm.</p>
                </div>

                {(testData as any).questions.map((q: any, i: number) => (
                  <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <p className="font-bold text-slate-800 mb-4 text-lg">
                      <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 w-7 h-7 rounded-full text-sm mr-2 mb-1">
                        {i + 1}
                      </span>
                      {q.text}
                    </p>

                    {q.type === "multiple_choice" || q.type === "true_false_not_given" ? (
                      <div className="space-y-3">
                        {q.options.map((opt: string) => (
                          <label key={opt} className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors ${
                            answers[q.id] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                              className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-slate-700 font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
                        placeholder="Nhập vào đây..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </div>
  );
}
