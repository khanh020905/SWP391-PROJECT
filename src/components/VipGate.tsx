"use client";

import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter, useParams } from "next/navigation";
import { Lock } from "lucide-react";

interface VipGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;  // UI thay thế nếu không phải VIP
  showUpgradeModal?: boolean;  // Hiện modal thay thế
}

export function VipGate({ children, fallback }: VipGateProps) {
  const { isVip, isLoading } = useSubscription();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "vi";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isVip) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  // Default: hiện banner upgrade
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl min-h-[300px]">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tính năng VIP
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Nâng cấp tài khoản để truy cập không giới hạn tất cả bài thi và lộ trình học cá nhân hoá.
          </p>
          <button
            onClick={() => router.push(`/${locale}/pricing`)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition w-full shadow-lg shadow-purple-600/20"
          >
            Xem gói VIP
          </button>
        </div>
      </div>
      {/* Obfuscate / blur underlying children */}
      <div className="select-none pointer-events-none blur-md filter opacity-40">
        {children}
      </div>
    </div>
  );
}

interface VipUpgradeModalProps {
  onClose: () => void;
}

export function VipUpgradeModal({ onClose }: VipUpgradeModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "vi";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-purple-600" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Mở khóa tính năng VIP
        </h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Tài khoản miễn phí chỉ được thử sức với <strong>1 bài thi duy nhất</strong> ở mỗi kỹ năng. Nâng cấp VIP để mở khóa tất cả các đề thi và tính năng học tập cao cấp.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              router.push(`/${locale}/pricing`);
            }}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20"
          >
            Nâng cấp VIP ngay
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-400 py-2 text-sm hover:text-gray-600 transition font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
