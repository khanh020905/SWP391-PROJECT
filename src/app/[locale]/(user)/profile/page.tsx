"use client";
import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Calendar, Phone, Heart, User, Key, Camera } from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user } = useAuth();
  if (!user) return null;

  const initialsFallback = (user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase();
  const dateFormatted = new Date(user.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
              <h2 className="text-2xl font-black">{user.user_metadata?.name || "Người dùng"}</h2>
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
                {user.user_metadata?.phone || "Chưa thiết lập"}
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
            {user.user_metadata?.bio || "Chưa có lời giới thiệu nào. Hãy viết gì đó về bản thân bạn nhé!"}
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
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Cập nhật họ tên, số điện thoại và tiểu sử bản thân.</p>
        </Link>

        <Link
          href="/settings/password"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#3B5C37]/30 hover:shadow-md transition-all group no-underline text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#fff4e6] text-[#3B5C37] flex items-center justify-center mb-3">
            <Key className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-[#0d153a] text-xs group-hover:text-[#3B5C37] transition-colors">{t("changePassword")}</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Thiết lập mật khẩu bảo mật cao để bảo vệ tài khoản.</p>
        </Link>

        <Link
          href="/settings/avatar"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#3B5C37]/30 hover:shadow-md transition-all group no-underline text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#fff4e6] text-[#3B5C37] flex items-center justify-center mb-3">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-[#0d153a] text-xs group-hover:text-[#3B5C37] transition-colors">{t("uploadAvatar")}</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Tải lên hình ảnh đại diện mới hoặc gỡ bỏ ảnh hiện tại.</p>
        </Link>
      </div>
    </div>
  );
}
