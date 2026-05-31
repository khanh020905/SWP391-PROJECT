"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle2, Camera, Upload, Trash2 } from "lucide-react";

export default function SettingsAvatarPage() {
  const { user, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (loading || !user) return null;

  const initialsFallback = (user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg("");
    setSuccessMsg("");

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(selectedFile.type)) {
      setErrorMsg("Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, GIF.");
      return;
    }

    // Validate size (2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setErrorMsg("Dung lượng ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB.");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Chưa xác thực session đăng nhập.");

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải ảnh lên thất bại.");

      setSuccessMsg("Tải ảnh đại diện mới thành công!");
      setFile(null);
      setPreviewUrl(null);

      await supabase.auth.refreshSession();
      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi.");
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!user.user_metadata?.avatar_url) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      if (error) throw error;

      setSuccessMsg("Đã gỡ bỏ ảnh đại diện thành công!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-black text-[#0d153a]">Đổi ảnh đại diện</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Cập nhật hình ảnh cá nhân nổi bật trên hệ thống.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-xs animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-700 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-8 items-center">
        {/* Preview section */}
        <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Hình ảnh hiển thị</p>
          <div className="relative group">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-[#3B5C37] shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            ) : user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Current Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] text-white flex items-center justify-center text-5xl font-black shadow-lg">
                {initialsFallback}
              </div>
            )}
            <div className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-[#3B5C37] text-white flex items-center justify-center border-2 border-white shadow">
              <Camera className="w-4.5 h-4.5" />
            </div>
          </div>
          {previewUrl && (
            <span className="text-[9px] bg-[#3B5C37]/10 text-[#3B5C37] font-black px-2 py-0.5 rounded-full mt-3 animate-pulse">
              Xem trước ảnh mới
            </span>
          )}
        </div>

        {/* Drag/Click area and Upload section */}
        <div className="md:col-span-3 space-y-4">
          <div className="border-2 border-dashed border-[#e1e4ed] hover:border-[#3B5C37] transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-center relative cursor-pointer group bg-slate-50/50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-10 h-10 rounded-full bg-[#fff4e6] text-[#3B5C37] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#0d153a]">Nhấp chuột để chọn ảnh</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Chấp nhận định dạng JPG, PNG, WEBP hoặc GIF (Tối đa 2MB)</p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-semibold text-[#5e6792]">
              <span className="truncate max-w-[200px]">{file.name}</span>
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleUpload}
              disabled={isLoading || !file}
              className="px-6 h-12 bg-[#3B5C37] hover:bg-[#ff8e26] text-white font-bold text-xs rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer border-none outline-none"
            >
              Tải ảnh lên
            </button>
            
            {user.user_metadata?.avatar_url && (
              <button
                onClick={handleRemove}
                disabled={isLoading}
                className="px-6 h-12 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer outline-none gap-1.5"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Gỡ ảnh đại diện</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
