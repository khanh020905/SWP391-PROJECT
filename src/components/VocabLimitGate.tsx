"use client";

import React, { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { BookOpen, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

const DAILY_VOCAB_LIMIT = 10;
const STORAGE_KEY = "vocab_daily_count";

export function useVocabLimit() {
  const { isVip } = useSubscription();
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Đọc count từ localStorage, reset nếu sang ngày mới
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { date, count: c } = JSON.parse(stored);
        const today = new Date().toDateString();
        if (date === today) {
          setCount(c);
        } else {
          // Ngày mới → reset
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
          setCount(0);
        }
      } catch {
        // Fallback if invalid JSON
        const today = new Date().toDateString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      }
    }
  }, []);

  const incrementCount = () => {
    if (isVip) return true;  // VIP không giới hạn

    const newCount = count + 1;
    if (newCount > DAILY_VOCAB_LIMIT) {
      setShowModal(true);
      return false;  // Không cho học thêm
    }

    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    setCount(newCount);
    return true;
  };

  const remaining = isVip ? Infinity : Math.max(0, DAILY_VOCAB_LIMIT - count);
  const isLimitReached = !isVip && count >= DAILY_VOCAB_LIMIT;

  return { count, remaining, isLimitReached, showModal, setShowModal, incrementCount };
}

// Modal thông báo hết giới hạn
export function VocabLimitModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "vi";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Đã đạt giới hạn 10 từ hôm nay!
        </h3>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          Tài khoản miễn phí chỉ được học <strong>10 từ mỗi ngày</strong>. Nâng cấp VIP để học không giới hạn và mở khóa toàn bộ tính năng.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => router.push(`/${locale}/pricing`)}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg shadow-green-600/20"
          >
            Nâng cấp VIP ngay
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-400 py-2 text-sm hover:text-gray-600 transition font-medium"
          >
            Để mai học tiếp
          </button>
        </div>
      </div>
    </div>
  );
}
