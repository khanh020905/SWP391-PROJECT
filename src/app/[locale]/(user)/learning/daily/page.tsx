"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import FlashcardApp from "@/components/FlashcardApp";

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

export default function DailyTasksPage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StudentStreakDetail | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStreak();
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

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: '#FBF8EF', fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif" }}>
      <FlashcardApp 
        userName={user?.user_metadata?.name || user?.email?.split('@')[0] || 'Học viên'} 
        streak={streak} 
        avatarUrl={user?.user_metadata?.avatar_url || ''} 
        role={user?.user_metadata?.role || 'STUDENT'} 
        initialView="daily"
      />
    </div>
  );
}
