"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { VipGate } from "@/components/VipGate";
import { Link, useRouter } from "@/i18n/navigation";
import { Calendar, Trophy, BookOpen, Clock, Lock, CheckCircle2, ChevronRight, Sparkles, BookHeadphones, Pencil, Brain, Flame } from "lucide-react";
import { ActivityModal } from "@/components/daily/ActivityModal";

interface StudentStreakDetail {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  lastStudyTimestamp: string | null;
  dailyGoalMinutes: number;
  todayMinutes: number;
  lastGoalMetDate: string | null;
  history: Record<string, number>;
}

export default function RoadmapPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState<StudentStreakDetail | null>(null);
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeActivity, setActiveActivity] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStreak();
    fetchDailyPlan();
  }, [user]);

  const fetchStreak = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/streak", {
        headers: {
          "Authorization": `Bearer ${session?.access_token || ""}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        setStreak(result.streak);
      }
    } catch (err) {
      console.error("Lỗi khi tải streak:", err);
    }
  };

  const fetchDailyPlan = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      if (!token) return;

      const today = new Date().toISOString().split('T')[0];

      // Query database directly first
      const { data: dbPlan, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .maybeSingle();

      const isOldStyle = dbPlan && Array.isArray(dbPlan.tasks) && dbPlan.tasks.length > 0 && !dbPlan.tasks[0].type;

      if (dbPlan && dbPlan.tasks && !isOldStyle) {
        setPlan(dbPlan);
      } else {
        // If not found or contains old-style textual tasks, trigger generate
        const res = await fetch("/api/student/daily/generate", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const result = await res.json();
          setPlan({
            tasks: result.activities,
            completed_count: 0,
            xp_earned: 0,
            date: today
          });
        }
      }
    } catch (err) {
      console.error("Lỗi khi lấy daily plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityComplete = async (result: { itemIds: string[]; results: any[]; xpEarned: number }) => {
    if (!activeActivity) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      if (!token) return;

      const res = await fetch('/api/student/daily/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activityId: activeActivity.id,
          itemIds: result.itemIds,
          itemType: activeActivity.type,
          results: result.results,
          xpEarned: result.xpEarned
        })
      });

      if (res.ok) {
        setActiveActivity(null);
        await fetchDailyPlan();
        await fetchStreak();
      }
    } catch (err) {
      console.error("Error completing activity:", err);
    }
  };

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <VipGate>
      <div className="min-h-screen bg-[#FBF8EF] text-slate-800 py-10 px-6 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E9EFE0] text-[#5D6B2D] border border-[#D5DFC6] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Lộ Trình Học AI Hàng Ngày
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1e234c] leading-tight">
                Nhiệm vụ học hôm nay
              </h1>
              <p className="text-slate-500 font-bold text-sm mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#B38F4D]" />
                {todayStr}
              </p>
            </div>

            {/* Streak widget */}
            {streak && (
              <div className="flex items-center gap-4 bg-white border-2 border-slate-200/80 p-4 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Flame className="w-7 h-7 text-orange-500 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Streak Hiện Tại</p>
                  <p className="text-xl font-black text-slate-800 leading-none mt-0.5">{streak.currentStreak} Ngày</p>
                </div>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 border-4 border-[#5D6B2D] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-black animate-pulse text-xs uppercase tracking-widest">Đang khởi tạo lộ trình học tập hàng ngày...</p>
            </div>
          ) : plan ? (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease_both]">
              {/* Progress Summary Card */}
              <div className="bg-gradient-to-br from-[#46531F] to-[#2A3114] text-[#FFF8EB] p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute right-[-10%] top-[-10%] w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <p className="text-xs font-black text-white/70 uppercase tracking-widest mb-1">Tiến Độ Ngày Hôm Ngành</p>
                    <h2 className="text-2xl font-black text-white mb-4">
                      Hoàn thành {plan.completed_count || 0} / {plan.tasks?.length || 5} bài tập
                    </h2>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-gradient-to-r from-[#B38F4D] to-[#E5C158] rounded-full transition-all duration-500" 
                        style={{ width: `${((plan.completed_count || 0) / (plan.tasks?.length || 5)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/15 px-6 py-4 rounded-2xl flex flex-col items-center shrink-0 min-w-[140px]">
                    <Trophy className="w-8 h-8 text-[#E5C158] mb-1 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Tổng XP Tích Lũy</span>
                    <span className="text-2xl font-black text-white mt-0.5">+{plan.xp_earned || 0} XP</span>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-4">
                {plan.tasks?.map((task: any, index: number) => {
                  const isCompleted = task.completed;
                  const isLocked = task.locked;
                  
                  return (
                    <div 
                      key={task.id}
                      onClick={() => {
                        if (!isLocked && !isCompleted) {
                          setActiveActivity(task);
                        }
                      }}
                      className={`group flex items-center justify-between border-2 p-5 rounded-2xl transition-all ${
                        isCompleted 
                          ? "bg-slate-50 border-slate-200/60 opacity-70 cursor-default" 
                          : isLocked 
                          ? "bg-slate-100/50 border-slate-200/50 cursor-not-allowed opacity-60" 
                          : "bg-white border-slate-200/80 hover:border-[#5D6B2D] hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon status */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                          isCompleted 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : isLocked 
                            ? "bg-slate-200 text-slate-400 border border-slate-300/40" 
                            : "bg-[#F7F8F2] text-[#5D6B2D] border border-[#E9EFE0] group-hover:scale-105 transition-transform"
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : isLocked ? <Lock className="w-5 h-5 text-slate-400" /> : task.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              isCompleted 
                                ? "bg-emerald-50 text-emerald-700" 
                                : isLocked 
                                ? "bg-slate-200 text-slate-500" 
                                : "bg-[#E9EFE0] text-[#5D6B2D]"
                            }`}>
                              {task.skill}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {task.estimatedMinutes} phút
                            </span>
                          </div>

                          <h3 className={`text-base font-black mt-1 ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {task.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                          isCompleted 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : isLocked 
                            ? "bg-slate-100 text-slate-400 border border-slate-200/50" 
                            : "bg-white text-[#B38F4D] border border-slate-200/80 shadow-sm"
                        }`}>
                          +{task.xp} XP
                        </span>
                        
                        {!isCompleted && !isLocked && (
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border-2 border-slate-200 border-dashed">
              <Trophy className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Không thể tải hoặc tạo lộ trình học tập hàng ngày.</p>
              <button 
                onClick={fetchDailyPlan}
                className="mt-4 px-6 py-2.5 bg-[#5D6B2D] text-[#FFF8EB] rounded-xl font-black text-sm uppercase tracking-wider hover:bg-[#46531F] transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render active exercise Modal */}
      {activeActivity && (
        <ActivityModal
          activity={activeActivity}
          onComplete={handleActivityComplete}
          onClose={() => setActiveActivity(null)}
        />
      )}
    </VipGate>
  );
}
