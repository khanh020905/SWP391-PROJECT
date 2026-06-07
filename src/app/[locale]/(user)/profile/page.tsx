"use client";
import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { 
  Mail, 
  Calendar, 
  Phone, 
  Heart, 
  User, 
  Key, 
  Camera, 
  Flame, 
  Trophy,
  Target,
  Clock,
  Check,
  Plus,
  Timer,
  Activity,
  AlertCircle
} from "lucide-react";

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

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user } = useAuth();
  
  const [streak, setStreak] = useState<StudentStreakDetail | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState(false);
  const [loggingMinutes, setLoggingMinutes] = useState(false);
  const [customGoal, setCustomGoal] = useState<number>(30);
  const [logAmount, setLogAmount] = useState<number>(15);

  useEffect(() => {
    if (!user) return;
    fetchStreak();
  }, [user]);

  const fetchStreak = async () => {
    try {
      setLoadingStreak(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/streak", {
        headers: {
          "Authorization": `Bearer ${session?.access_token || ""}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        setStreak(result.streak);
        if (result.streak) {
          setCustomGoal(result.streak.dailyGoalMinutes || 30);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải streak học tập:", err);
    } finally {
      setLoadingStreak(false);
    }
  };

  const handleUpdateGoal = async (newGoal: number) => {
    try {
      setUpdatingGoal(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/streak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          action: "UPDATE_GOAL",
          dailyGoalMinutes: newGoal
        })
      });
      if (res.ok) {
        const result = await res.json();
        setStreak(result.streak);
      }
    } catch (err) {
      console.error("Lỗi cập nhật mục tiêu:", err);
    } finally {
      setUpdatingGoal(false);
    }
  };

  const handleLogMinutes = async (minutesToAdd: number) => {
    try {
      setLoggingMinutes(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/streak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          action: "LOG_MINUTES",
          minutes: minutesToAdd,
          activity: `Đã tự học thêm ${minutesToAdd} phút ôn tập`
        })
      });
      if (res.ok) {
        const result = await res.json();
        setStreak(result.streak);
        // Dispatch event so that layouter header updates its streak too
        window.dispatchEvent(new Event("visibilitychange"));
        window.dispatchEvent(new Event("progress-updated"));
      }
    } catch (err) {
      console.error("Lỗi ghi nhận thời gian học:", err);
    } finally {
      setLoggingMinutes(false);
    }
  };

  if (!user) return null;

  const initialsFallback = (user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase();
  const dateFormatted = new Date(user.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate week grid completion
  const getDaysOfCurrentWeek = () => {
    const current = new Date();
    const week = [];
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(current.setDate(diff));
    
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      
      const offset = nextDay.getTimezoneOffset();
      const localDate = new Date(nextDay.getTime() - offset * 60 * 1000);
      const dateStr = localDate.toISOString().split("T")[0];
      
      week.push({
        dateStr,
        dayName: dayNames[i],
        label: nextDay.getDate(),
        isToday: dateStr === new Date().toISOString().split("T")[0]
      });
    }
    return week;
  };

  const weekDays = getDaysOfCurrentWeek();
  const dailyGoal = streak?.dailyGoalMinutes || 30;
  const todayMinutes = streak?.todayMinutes || 0;
  const progressPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Cover Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0d153a] to-[#B38F4D] p-8 text-white overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B5C37]/10 blur-2xl rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          {user.user_metadata?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white text-[#3B5C37] flex items-center justify-center text-4xl font-black shadow-lg">
              {initialsFallback}
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-black">{user.user_metadata?.name || t("fallback.name")}</h2>
              <span className="text-[10px] font-black tracking-wider text-white bg-[#3B5C37] px-2.5 py-1 rounded-full uppercase">
                {user.user_metadata?.role || "STUDENT"}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1">{user.email}</p>
          </div>
          <Link
            href="/profile/edit"
            className="px-5 py-2.5 bg-[#3B5C37] hover:bg-[#ff8e26] text-white text-xs font-bold rounded-2xl shadow-lg transition-all"
          >
            {t("editProfile")}
          </Link>
        </div>
      </div>

      {/* Goal & Streak Premium Dashboard */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
        
        {/* Top summary row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          
          {/* Flame streak status */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0d153a] text-sm">Mục Tiêu & Chuỗi Ngày Học (Streak)</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Đặt mục tiêu thời lượng học và duy trì chuỗi học mỗi ngày.</p>
            </div>
          </div>

          {/* Active streak counts */}
          <div className="flex items-center gap-6 bg-slate-50/50 px-6 py-3 rounded-2xl border border-slate-100/80 w-full lg:w-auto justify-around">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chuỗi hiện tại</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-xl font-black text-[#0d153a]">{streak?.currentStreak || 0}</span>
                <span className="text-lg">🔥</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chuỗi kỷ lục</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-xl font-black text-yellow-600">{streak?.longestStreak || 0}</span>
                <span className="text-lg">👑</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core controls grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left panel: Daily Goal setup */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-400" /> Cài đặt mục tiêu ngày
              </label>
              <p className="text-[10px] text-slate-400 font-medium">Chọn số phút tự học tối thiểu mỗi ngày.</p>
            </div>

            <div className="flex gap-2">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setCustomGoal(mins);
                    handleUpdateGoal(mins);
                  }}
                  disabled={updatingGoal}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold text-center transition-all select-none cursor-pointer ${
                    customGoal === mins
                      ? "border-[#3B5C37] bg-[#3B5C37]/5 text-[#3B5C37] font-black shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 text-[#5e6792]"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Quick manual log time for testing */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#0d153a] uppercase tracking-wider flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-slate-400" /> Tự ghi nhận thời gian
                </span>
                <span className="text-[9px] bg-[#3B5C37]/15 text-[#3B5C37] px-2 py-0.5 rounded font-black">Nhập tay</span>
              </div>
              
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={logAmount}
                  onChange={(e) => setLogAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center text-[#0d153a] bg-white outline-none focus:border-[#3B5C37]"
                />
                <button
                  onClick={() => handleLogMinutes(logAmount)}
                  disabled={loggingMinutes}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#3B5C37] hover:bg-[#ff8e26] text-white text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Học {logAmount} phút</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Today's progress status & Weekly grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Progress bar */}
            <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-[#0d153a] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> Tiến độ hôm nay
                </span>
                <span className="font-black text-[#3B5C37] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {todayMinutes} / {dailyGoal} phút ({progressPercent}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    progressPercent >= 100 
                      ? "bg-gradient-to-r from-emerald-500 to-[#3B5C37]" 
                      : "bg-gradient-to-r from-orange-400 to-[#B38F4D]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progressPercent >= 100 ? (
                <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Chúc mừng! Bạn đã hoàn thành mục tiêu học tập hôm nay. Streak được an toàn!
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Hãy tích lũy thêm {dailyGoal - todayMinutes} phút tự học hôm nay để kéo dài chuỗi ngày nhé!
                </p>
              )}
            </div>

            {/* Mon-Sun Visual calendar grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Lịch sử hoàn thành tuần này</span>
              
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((day) => {
                  // Check historical status
                  const dayMinutes = day.isToday ? todayMinutes : (streak?.history?.[day.dateStr] || 0);
                  const isGoalCompleted = dayMinutes >= dailyGoal;
                  const hasStudied = dayMinutes > 0;

                  return (
                    <div 
                      key={day.dateStr} 
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                        day.isToday 
                          ? "border-[#3B5C37] bg-white ring-1 ring-[#3B5C37]/30" 
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <span className={`text-[10px] font-black ${
                        day.isToday ? "text-[#3B5C37] font-black" : "text-slate-400"
                      }`}>
                        {day.dayName}
                      </span>
                      <span className="text-[9px] text-slate-300 font-bold block mt-0.5">{day.label}</span>
                      
                      <div className="mt-3.5 flex items-center justify-center">
                        {isGoalCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm relative group cursor-help" title={`${dayMinutes} phút`}>
                            <Flame className="w-4 h-4 fill-white" />
                          </div>
                        ) : hasStudied ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center font-black text-[10px] cursor-help" title={`${dayMinutes} phút`}>
                            {dayMinutes}m
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 text-slate-300 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Info Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        <h3 className="font-extrabold text-[#0d153a] text-lg">{t("detailedInfo")}</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#3B5C37]">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{tc("email")}</p>
              <p className="text-xs font-bold text-[#0d153a] mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#3B5C37]">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("joinDate")}</p>
              <p className="text-xs font-bold text-[#0d153a] mt-0.5">{dateFormatted}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#3B5C37]">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("phone")}</p>
              <p className="text-xs font-bold text-[#0d153a] mt-0.5">
                {user.user_metadata?.phone || t("fallback.phone")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#3B5C37]">
              <Heart className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("status")}</p>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                {t("statusActive")}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{t("bio")}</p>
          <p className="text-xs text-[#5e6792] leading-relaxed">
            {user.user_metadata?.bio || t("fallback.bio")}
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/profile/edit"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#3B5C37]/30 hover:shadow-md transition-all group no-underline text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#fff4e6] text-[#3B5C37] flex items-center justify-center mb-3">
            <User className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-[#0d153a] text-xs group-hover:text-[#3B5C37] transition-colors">{t("editProfile")}</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">{t("desc.editProfile")}</p>
        </Link>

        <Link
          href="/settings/password"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#3B5C37]/30 hover:shadow-md transition-all group no-underline text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#fff4e6] text-[#3B5C37] flex items-center justify-center mb-3">
            <Key className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-[#0d153a] text-xs group-hover:text-[#3B5C37] transition-colors">{t("changePassword")}</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">{t("desc.changePassword")}</p>
        </Link>

        <Link
          href="/settings/avatar"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#3B5C37]/30 hover:shadow-md transition-all group no-underline text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#fff4e6] text-[#3B5C37] flex items-center justify-center mb-3">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-[#0d153a] text-xs group-hover:text-[#3B5C37] transition-colors">{t("uploadAvatar")}</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">{t("desc.uploadAvatar")}</p>
        </Link>
      </div>
    </div>
  );
}
