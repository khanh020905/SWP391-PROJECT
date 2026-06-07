"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Calendar,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trophy,
  ArrowRight,
  Play,
  Check,
  Undo2,
  Flame
} from "lucide-react";

interface PhaseTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedHours: number;
}

interface LearningPhase {
  id: string;
  title: string;
  description: string;
  skills: string[];
  tasks: PhaseTask[];
}

interface StudentRoadmap {
  userId: string;
  currentBand: number;
  targetBand: number;
  targetDate: string;
  dailyHours: number;
  focusSkills: string[];
  status: "PROPOSED" | "ACTIVE" | "COMPLETED";
  phases: LearningPhase[];
  createdAt: string;
  updatedAt: string;
}

export default function RoadmapPage() {
  const { user } = useAuth();
  const params = useParams();
  const locale = params?.locale || "vi";
  const [roadmap, setRoadmap] = useState<StudentRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Setup form states
  const [currentBand, setCurrentBand] = useState<number>(5.0);
  const [targetBand, setTargetBand] = useState<number>(6.5);
  const [dailyHours, setDailyHours] = useState<number>(2.0);
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [focusSkills, setFocusSkills] = useState<string[]>([
    "Listening",
    "Reading",
    "Writing",
    "Speaking"
  ]);

  // AI Generation simulation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Active dashboard states
  const [activePhaseTab, setActivePhaseTab] = useState<string>("phase_1");
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Fetch roadmap on mount
  useEffect(() => {
    if (!user) return;
    fetchRoadmap();
  }, [user]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        headers: {
          "Authorization": `Bearer ${session?.access_token || ""}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap);
        if (data.roadmap) {
          // Pre-populate form with saved values if proposed/active
          setCurrentBand(data.roadmap.currentBand);
          setTargetBand(data.roadmap.targetBand);
          setDailyHours(data.roadmap.dailyHours);
          setTargetDate(data.roadmap.targetDate);
          setFocusSkills(data.roadmap.focusSkills);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải lộ trình:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (skill: string) => {
    if (focusSkills.includes(skill)) {
      setFocusSkills(focusSkills.filter(s => s !== skill));
    } else {
      setFocusSkills([...focusSkills, skill]);
    }
  };

  // Simulate AI generating roadmap
  const startAIGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetBand <= currentBand) {
      alert("Band mục tiêu phải lớn hơn Band hiện tại!");
      return;
    }
    if (focusSkills.length === 0) {
      alert("Vui lòng chọn ít nhất một kỹ năng cần tập trung!");
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress(0);

    // AI steps simulation text
    const stepsCount = 4;
    const intervalTime = 600;

    // Simulate progress bar filling
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    // Simulate switching steps
    const stepInterval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= stepsCount - 1) {
          clearInterval(stepInterval);
          return stepsCount - 1;
        }
        return prev + 1;
      });
    }, intervalTime);

    // Call API after simulation completes
    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/student/roadmap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`
          },
          body: JSON.stringify({
            action: "GENERATE",
            currentBand,
            targetBand,
            dailyHours,
            targetDate,
            focusSkills
          })
        });

        if (res.ok) {
          const data = await res.json();
          setRoadmap(data.roadmap);
          setIsEditingGoals(false);
        }
      } catch (err) {
        console.error("Lỗi khi tạo lộ trình:", err);
      } finally {
        setIsGenerating(false);
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      }
    }, 2800);
  };

  const activateRoadmap = async () => {
    try {
      setActionLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({ action: "ACTIVATE" })
      });

      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap);
        setActivePhaseTab("phase_1");
        // Reload page header to fetch new notification & updates
        window.dispatchEvent(new Event("visibilitychange"));
      }
    } catch (err) {
      console.error("Lỗi kích hoạt lộ trình:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTask = async (phaseId: string, taskId: string, completed: boolean) => {
    if (!roadmap) return;

    // Optimistically update UI
    const updatedPhases = roadmap.phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, completed };
            }
            return task;
          })
        };
      }
      return phase;
    });

    setRoadmap({ ...roadmap, phases: updatedPhases });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          action: "TOGGLE_TASK",
          phaseId,
          taskId,
          completed
        })
      });

      if (!res.ok) {
        // Rollback on failure
        fetchRoadmap();
      }
    } catch (err) {
      console.error("Lỗi cập nhật tiến độ:", err);
      fetchRoadmap();
    }
  };

  const resetRoadmap = async () => {
    if (!confirm("Bạn có chắc muốn đặt lại lộ trình học? Toàn bộ dữ liệu tiến trình hiện tại sẽ bị xóa.")) {
      return;
    }

    try {
      setActionLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({ action: "DELETE" })
      });

      if (res.ok) {
        setRoadmap(null);
        setIsEditingGoals(false);
      }
    } catch (err) {
      console.error("Lỗi reset lộ trình:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper calculation for overall progress
  const getProgressStats = () => {
    if (!roadmap) return { total: 0, completed: 0, percentage: 0 };
    let total = 0;
    let completed = 0;
    roadmap.phases.forEach(p => {
      p.tasks.forEach(t => {
        total++;
        if (t.completed) completed++;
      });
    });
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const getBandBadge = (band: number) => {
    if (band >= 7.5) return "bg-red-50 text-red-600 border-red-100";
    if (band >= 6.5) return "bg-orange-50 text-orange-600 border-orange-100";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  };

  const getBandTitle = (band: number) => {
    if (band >= 8.0) return "Expert User";
    if (band >= 7.0) return "Good User";
    if (band >= 6.0) return "Competent User";
    return "Modest User";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#5e6792] animate-pulse">Đang tải lộ trình học AI...</p>
      </div>
    );
  }

  // 1. AI Generation Simulation Screen
  if (isGenerating) {
    const steps = [
      "Đang quét hồ sơ học viên & kỹ năng mục tiêu...",
      "Đang đo khoảng cách chênh lệch band điểm hiện tại và đích...",
      "Đang phân bổ giáo trình Cambridge IELTS tương thích...",
      "AI đang biên soạn danh sách nhiệm vụ ôn tập cá nhân hóa..."
    ];

    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col items-center justify-center min-h-[500px] text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3B5C37]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B38F4D]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Animated Scanner Ring */}
        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3B5C37]/30 animate-spin" style={{ animationDuration: "12s" }} />
          <div className="absolute inset-2 rounded-full border border-double border-[#B38F4D]/40 animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
          
          {/* Central AI glowing brain/sparkle bubble */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center shadow-lg relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-black text-[#0d153a] mb-2">Trợ Lý AI Đang Thiết Lập Lộ Trình</h3>
        
        {/* Progress bar */}
        <div className="w-full max-w-md bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-200/50">
          <div 
            className="h-full bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] transition-all duration-300 rounded-full" 
            style={{ width: `${generationProgress}%` }}
          />
        </div>

        {/* Dynamic status list */}
        <div className="w-full max-w-sm text-left space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
          {steps.map((step, idx) => {
            const isDone = generationStep > idx;
            const isActive = generationStep === idx;
            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                  isDone || isActive ? "opacity-100" : "opacity-35"
                }`}
              >
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 border-2 border-[#3B5C37] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className={`font-bold ${isActive ? "text-[#3B5C37]" : "text-[#5e6792]"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. SETUP FORM STATE (No Roadmap yet, or Editing goals)
  if (!roadmap || isEditingGoals) {
    const durationWeeks = Math.ceil(
      (new Date(targetDate).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const durationMonths = Math.max(1, Math.round(durationWeeks / 4.3));

    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-8 text-left relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#3B5C37]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

        {/* Heading */}
        <div className="border-b border-slate-100 pb-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3B5C37] to-[#8eb08a] flex items-center justify-center text-white shrink-0 shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0d153a]">
              {roadmap ? "Cập Nhật Mục Tiêu Học Tập" : "Thiết Lập Lộ Trình Học IELTS Với AI"}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Cung cấp mục tiêu và khả năng hiện tại của bạn, trợ lý AI sẽ tự động phân tích và chia nhỏ giáo trình giúp bạn đạt điểm mong muốn.
            </p>
          </div>
        </div>

        {/* Banner test năng lực */}
        {!roadmap && (
          <div className="bg-gradient-to-r from-amber-500/10 to-[#B38F4D]/25 border border-[#B38F4D]/35 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700">
                <Sparkles className="w-4 h-4 text-[#B38F4D] animate-bounce" />
                <span className="text-xs font-black uppercase tracking-wider">Kiểm Tra Năng Lực Đầu Vào</span>
              </div>
              <h3 className="text-sm font-black text-[#0d153a]">Bạn chưa biết Band điểm IELTS hiện tại của mình?</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Tham gia làm bài kiểm tra nhanh 10 phút (Listening, Reading, Grammar) để AI phân tích chính xác trình độ và tự động thiết kế lộ trình tối ưu cho bạn.
              </p>
            </div>
            <Link
              href={`/${locale}/roadmap/diagnostic-test`}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] hover:opacity-95 text-white font-extrabold text-xs shadow-md transition-all text-center flex items-center justify-center gap-1.5 shrink-0 self-start md:self-center cursor-pointer"
            >
              <span>Làm Test Đầu Vào Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <form onSubmit={startAIGeneration} className="space-y-6">
          {/* Band Score Sliders */}
          <div className="grid md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            {/* Current Band Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-[#0d153a] uppercase tracking-wider">Band Điểm Hiện Tại</label>
                <span className="text-xs font-black text-[#3B5C37] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                  Band {currentBand.toFixed(1)} — {getBandTitle(currentBand)}
                </span>
              </div>
              <input
                type="range"
                min="3.0"
                max="8.5"
                step="0.5"
                value={currentBand}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentBand(val);
                  if (targetBand <= val) {
                    setTargetBand(Math.min(9.0, val + 1.0));
                  }
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3B5C37]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>3.0</span>
                <span>4.5</span>
                <span>6.0</span>
                <span>7.5</span>
                <span>8.5</span>
              </div>
            </div>

            {/* Target Band Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-[#0d153a] uppercase tracking-wider">Band Điểm Mục Tiêu</label>
                <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-100">
                  Band {targetBand.toFixed(1)} — {getBandTitle(targetBand)}
                </span>
              </div>
              <input
                type="range"
                min={(currentBand + 0.5).toString()}
                max="9.0"
                step="0.5"
                value={targetBand}
                onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#B38F4D]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>{(currentBand + 0.5).toFixed(1)}</span>
                <span>6.0</span>
                <span>7.0</span>
                <span>8.0</span>
                <span>9.0</span>
              </div>
            </div>
          </div>

          {/* Target Date and Daily Hours */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Target Date */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Ngày Thi Dự Kiến
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none"
              />
              <p className="text-[10px] text-slate-400 font-semibold">
                Thời gian tự học còn lại: <strong className="text-[#3B5C37]">{durationWeeks} tuần (~{durationMonths} tháng)</strong>.
              </p>
            </div>

            {/* Daily study hours */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Thời Gian Học Mỗi Ngày
              </label>
              <select
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-[#0d153a] focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] outline-none bg-white"
              >
                <option value={1.0}>1.0 giờ / ngày</option>
                <option value={1.5}>1.5 giờ / ngày</option>
                <option value={2.0}>2.0 giờ / ngày (Khuyên dùng)</option>
                <option value={3.0}>3.0 giờ / ngày (Cường độ cao)</option>
                <option value={4.0}>4.0 giờ / ngày (Cấp tốc)</option>
              </select>
              <p className="text-[10px] text-slate-400 font-semibold">
                Tổng quỹ thời gian dự kiến: <strong className="text-[#3B5C37]">{Math.round(durationWeeks * 7 * dailyHours)} giờ thực hành</strong>.
              </p>
            </div>
          </div>

          {/* Focus Skills */}
          <div className="space-y-3">
            <label className="text-xs font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slate-400" /> Kỹ Năng Cần Tập Trung
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Listening", "Reading", "Writing", "Speaking"].map((skill) => {
                const isChecked = focusSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillsChange(skill)}
                    className={`py-3 px-4 rounded-xl border-2 text-xs font-black transition-all text-center flex items-center justify-center gap-2 select-none cursor-pointer ${
                      isChecked
                        ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37] shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200 text-[#5e6792]"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 text-[#3B5C37]" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] hover:opacity-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{roadmap ? "Tái Tạo Lộ Trình AI" : "Thiết Lập Lộ Trình Bằng AI"}</span>
            </button>
            {roadmap && (
              <button
                type="button"
                onClick={() => setIsEditingGoals(false)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                <span>Hủy bỏ</span>
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  const stats = getProgressStats();

  // 3. PROPOSED ROADMAP VIEW (AI Proposed - Review before starting)
  if (roadmap.status === "PROPOSED") {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-8 text-left relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#B38F4D]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

        {/* Header summary of proposed roadmap */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#B38F4D] bg-orange-50 border border-orange-100/50 px-2.5 py-0.5 rounded-md">
                Lộ trình đề xuất từ AI
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Tạo ngày {new Date(roadmap.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#0d153a] flex items-center gap-1.5">
              IELTS Band {roadmap.currentBand.toFixed(1)}
              <ArrowRight className="w-4 h-4 text-[#B38F4D]" />
              Band {roadmap.targetBand.toFixed(1)}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5e6792] font-semibold">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {roadmap.dailyHours} giờ / ngày</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn thi: {new Date(roadmap.targetDate).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditingGoals(true)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:border-[#3B5C37]/30 hover:bg-slate-50 text-[#3B5C37] text-xs font-bold transition-all flex items-center gap-1.5 self-start md:self-center cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Chỉnh sửa mục tiêu</span>
          </button>
        </div>

        {/* Phase Timeline */}
        <div className="space-y-8 relative pl-6 md:pl-8 before:absolute before:left-2.5 md:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#3B5C37] before:to-amber-500/40">
          {roadmap.phases.map((phase, idx) => (
            <div key={phase.id} className="relative group">
              {/* Timeline dot marker */}
              <div className="absolute left-[-21px] md:left-[-29px] top-1.5 w-4.5 h-4.5 md:w-5.5 md:h-5.5 rounded-full bg-white border-4 border-[#3B5C37] group-hover:scale-110 transition-transform duration-300 flex items-center justify-center z-10" />

              <div className="space-y-4">
                {/* Phase title */}
                <div>
                  <h4 className="font-extrabold text-[#0d153a] text-sm group-hover:text-[#3B5C37] transition-colors leading-tight">
                    {phase.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {phase.description}
                  </p>
                  
                  {/* Skills badge list */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {phase.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Phase Tasks (Proposed list) */}
                <div className="bg-slate-50/40 rounded-2xl border border-slate-100 p-4 space-y-2.5 max-w-2xl">
                  {phase.tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 bg-white/90 p-3 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <div className="w-5 h-5 rounded-md bg-[#3B5C37]/5 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-3 h-3 text-[#3B5C37]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-[#0d153a] block leading-tight">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> Thời gian ước tính: {task.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Accept proposed roadmap block */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-[#0d153a]">Lộ trình này đã được AI tùy chỉnh hoàn toàn phù hợp với cấu hình của bạn.</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Nhấp nút bên phải để lưu lộ trình và bắt đầu đếm ngược thời gian ôn thi.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={activateRoadmap}
              disabled={actionLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B5C37] to-[#1f3e1b] text-white font-extrabold text-xs shadow-lg shadow-[#3B5C37]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Chấp Nhận & Bắt Đầu Học</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. ACTIVE STUDY DASHBOARD STATE
  const activePhase = roadmap.phases.find(p => p.id === activePhaseTab) || roadmap.phases[0];
  const totalDays = Math.ceil(
    (new Date(roadmap.targetDate).getTime() - new Date(roadmap.createdAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  const remainingDays = Math.max(
    0,
    Math.ceil((new Date(roadmap.targetDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
  );

  return (
    <div className="space-y-6 text-left">
      {/* 2-Column layout for Active Dashboard */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Left Column: Progress summary & overall metrics */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Progress Circular Dial Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B5C37]/5 blur-xl rounded-full" />
            <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider mb-4">Tiến Độ Lộ Trình</h3>
            
            {/* Progress Circular Ring */}
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  fill="none" 
                  stroke="url(#progressGrad)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray={`${(stats.percentage / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3B5C37" />
                    <stop offset="100%" stopColor="#B38F4D" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#0d153a] leading-none">{stats.percentage}%</span>
                <span className="text-[9px] text-slate-400 font-bold mt-1">Hoàn thành</span>
              </div>
            </div>

            <div className="space-y-1.5 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Nhiệm vụ:</span>
                <span className="text-[#0d153a] font-extrabold">{stats.completed} / {stats.total}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Còn lại:</span>
                <span className="text-[#0d153a] font-extrabold">{remainingDays} ngày ôn thi</span>
              </div>
            </div>
          </div>

          {/* Goal Profile summary */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider border-b border-slate-50 pb-2">Thông Tin Mục Tiêu</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                  <Target className="w-4.5 h-4.5 text-orange-500" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mục Tiêu Band</span>
                  <span className="text-xs font-bold text-[#0d153a]">Band {roadmap.currentBand.toFixed(1)} → {roadmap.targetBand.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                  <Clock className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cường Độ Học</span>
                  <span className="text-xs font-bold text-[#0d153a]">{roadmap.dailyHours} giờ / ngày</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                  <Calendar className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ngày Thi IELTS</span>
                  <span className="text-xs font-bold text-[#0d153a]">{new Date(roadmap.targetDate).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-3 flex flex-col gap-2">
              <button
                onClick={() => setIsEditingGoals(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#3B5C37] rounded-xl text-center text-[10px] font-black transition-all border border-slate-100 hover:border-slate-200 cursor-pointer"
              >
                Sửa mục tiêu / Tạo lại
              </button>
              
              <button
                onClick={resetRoadmap}
                className="w-full py-2 bg-white hover:bg-red-50 text-red-500 rounded-xl text-center text-[10px] font-black transition-all border border-slate-100 hover:border-red-100 cursor-pointer"
              >
                Đặt lại lộ trình học
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive tasks progress by phases */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Active Banner */}
          <div className="bg-gradient-to-r from-[#3B5C37] to-[#1f3e1b] rounded-3xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-xl rounded-full" />
            
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Lộ trình đang học
                </span>
                {remainingDays > 0 ? (
                  <span className="text-[9px] font-black bg-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Còn {remainingDays} ngày
                  </span>
                ) : (
                  <span className="text-[9px] font-black bg-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Đã hoàn tất kỳ ôn
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Chinh Phục IELTS Band {roadmap.targetBand.toFixed(1)}
              </h2>
              <p className="text-[10px] text-white/80 font-medium">
                Tập trung thực hành mỗi ngày theo từng nhiệm vụ dưới đây. AI sẽ ghi nhận và cập nhật trực tiếp tiến độ của bạn.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs font-black z-10 select-none shrink-0 self-start sm:self-center">
              <span>Đang học tập</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            </div>
          </div>

          {/* Phase selector tabs */}
          <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto">
            {roadmap.phases.map((phase) => {
              const isActive = activePhaseTab === phase.id;
              
              // Count tasks and completed tasks in this phase
              const phaseTasks = phase.tasks;
              const completedCount = phaseTasks.filter(t => t.completed).length;
              const totalCount = phaseTasks.length;
              const isPhaseDone = completedCount === totalCount && totalCount > 0;

              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhaseTab(phase.id)}
                  className={`pb-3 px-3 text-xs font-black shrink-0 relative transition-all duration-300 select-none border-b-2 outline-none cursor-pointer ${
                    isActive 
                      ? "text-[#3B5C37] border-[#3B5C37]" 
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {phase.id === "phase_1" ? "Giai đoạn 1" : phase.id === "phase_2" ? "Giai đoạn 2" : "Giai đoạn 3"}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isPhaseDone 
                        ? "bg-green-500 text-white" 
                        : isActive 
                          ? "bg-[#3B5C37]/15 text-[#3B5C37]" 
                          : "bg-slate-100 text-slate-400"
                    }`}>
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Phase description panel */}
          <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
            <h3 className="font-extrabold text-[#0d153a] text-xs uppercase tracking-wider mb-1">Mục tiêu Giai Đoạn</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">{activePhase.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {activePhase.skills.map((skill, sIdx) => (
                <span key={sIdx} className="text-[9px] font-black text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {activePhase.tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleTask(activePhase.id, task.id, !task.completed)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 hover:-translate-x-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md cursor-pointer select-none ${
                  task.completed 
                    ? "bg-slate-50/70 border-slate-100/80 opacity-70" 
                    : "bg-white border-slate-100 hover:border-[#3B5C37]/25"
                }`}
              >
                {/* Custom Checkbox */}
                <div className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  task.completed 
                    ? "bg-[#3B5C37] border-[#3B5C37] text-white" 
                    : "border-slate-300 bg-white hover:border-slate-400"
                }`}>
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {/* Task Details */}
                <div className="flex-1">
                  <span className={`text-xs font-bold block leading-tight transition-all ${
                    task.completed ? "text-slate-400 line-through" : "text-[#0d153a]"
                  }`}>
                    {task.title}
                  </span>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {task.estimatedHours}h luyện tập
                    </span>
                    {task.completed && (
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành & Cộng Streak
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
