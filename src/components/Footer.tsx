import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Headphones,
  BookOpen,
  MessageCircle,
  PenTool,
  BookType,
  GraduationCap,
  FileText,
  Gift,
  FileSignature,
  FileBadge2,
  Languages,
  Info,
  Lightbulb,
  ShieldCheck,
  HelpCircle,
  Mail,
  Headset,
  Book,
  Shield,
  FileCode2,
  Send,
  Leaf
} from "lucide-react";

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-[#f2f6ed] relative pt-16 pb-6 overflow-hidden border-t border-[#e8f0e1]">
      {/* (Optional) Background decorations if provided later */}
      <div className="max-w-[1300px] mx-auto px-4 md:px-8 relative z-20">

        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 mb-12">

          {/* Column 1: Brand & Info (Left) */}
          <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col items-start relative z-20 pr-0 lg:pr-8">
            <Link href="/" className="mb-4">
              <img
                src="/assets/logo-final.png"
                alt="Quali IELTS Logo"
                className="h-9 object-contain"
              />
            </Link>
            <p className="text-[#4a5a43] text-[13px] mb-4 leading-relaxed max-w-[280px]">
              Nền tảng luyện thi IELTS toàn diện với lộ trình cá nhân hóa và công nghệ AI thông minh, giúp bạn đạt mục tiêu IELTS dễ dàng hơn mỗi ngày.
            </p>

            {/* Mascot Image */}
            <div className="relative w-full h-[260px] -ml-6 mb-4 mt-2 hidden md:block">
              <img
                src="/assets/logo-final.png"
                alt="Mascot"
                className="w-full h-full object-contain object-left pointer-events-none scale-110 origin-left"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex items-center gap-3 mt-auto">
              <span className="text-[#1f3e1b] font-extrabold text-[13px]">Follow us</span>
              <a href="#" className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
                </svg>
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform">
                {/* TikTok */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.33 6.33 0 0 0 6.33-6.33V11.1c1.4.92 3 1.45 4.7 1.45V9.1c-1.07 0-2.1-.38-2.71-2.41z" />
                </svg>
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:scale-110 transition-transform">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.49 6.2c-.23-1.03-.98-1.85-2.01-2.09C19.64 3.7 12 3.7 12 3.7s-7.64 0-9.48.41C1.49 4.35.74 5.17.51 6.2.02 8.35.02 12 .02 12s0 3.65.49 5.8c.23 1.03.98 1.85 2.01 2.09 1.84.41 9.48.41 9.48.41s7.64 0 9.48-.41c1.03-.24 1.78-1.06 2.01-2.09.49-2.15.49-5.8.49-5.8s0-3.65-.49-5.8zM9.54 15.56V8.44l6.46 3.56-6.46 3.56z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden lg:block w-[1px] bg-[#dce5d5] self-stretch mx-2"></div>

          {/* Right Side (Links & Newsletter) */}
          <div className="flex-1 flex flex-col justify-between relative z-20 gap-8 lg:gap-12">
            
            {/* Links Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              {/* Luyện thi */}
              <div className="lg:pl-6 xl:pl-10 border-none lg:border-none">
                <h3 className="flex items-center gap-2 font-black text-[#1b3d1e] text-[15px] mb-6">
                  <Leaf size={16} className="text-[#568140] fill-current" /> Luyện thi
                </h3>
                <ul className="space-y-4">
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Headphones size={16} strokeWidth={1.5} className="text-[#647c59]" /> Listening</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><BookOpen size={16} strokeWidth={1.5} className="text-[#647c59]" /> Reading</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><MessageCircle size={16} strokeWidth={1.5} className="text-[#647c59]" /> Speaking</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><PenTool size={16} strokeWidth={1.5} className="text-[#647c59]" /> Writing</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><BookType size={16} strokeWidth={1.5} className="text-[#647c59]" /> Vocab & Grammar</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><GraduationCap size={16} strokeWidth={1.5} className="text-[#647c59]" /> Định hướng tự học</Link></li>
                </ul>
              </div>

              {/* Tài nguyên */}
              <div className="lg:pl-6 xl:pl-10 border-none lg:border-l lg:border-[#dce5d5]">
                <h3 className="flex items-center gap-2 font-black text-[#1b3d1e] text-[15px] mb-6">
                  <Leaf size={16} className="text-[#568140] fill-current" /> Tài nguyên
                </h3>
                <ul className="space-y-4">
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><FileText size={16} strokeWidth={1.5} className="text-[#647c59]" /> Bài viết</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Gift size={16} strokeWidth={1.5} className="text-[#647c59]" /> Tài liệu miễn phí</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><FileSignature size={16} strokeWidth={1.5} className="text-[#647c59]" /> Đề thi thử</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><FileBadge2 size={16} strokeWidth={1.5} className="text-[#647c59]" /> Từ vựng theo chủ đề</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Languages size={16} strokeWidth={1.5} className="text-[#647c59]" /> Ngữ pháp</Link></li>
                </ul>
              </div>

              {/* Về chúng tôi */}
              <div className="lg:pl-6 xl:pl-10 border-none lg:border-l lg:border-[#dce5d5]">
                <h3 className="flex items-center gap-2 font-black text-[#1b3d1e] text-[15px] mb-6">
                  <Leaf size={16} className="text-[#568140] fill-current" /> Về chúng tôi
                </h3>
                <ul className="space-y-4">
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Info size={16} strokeWidth={1.5} className="text-[#647c59]" /> Giới thiệu</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Lightbulb size={16} strokeWidth={1.5} className="text-[#647c59]" /> Phương pháp học</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><ShieldCheck size={16} strokeWidth={1.5} className="text-[#647c59]" /> Cam kết chất lượng</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><HelpCircle size={16} strokeWidth={1.5} className="text-[#647c59]" /> Câu hỏi thường gặp</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Mail size={16} strokeWidth={1.5} className="text-[#647c59]" /> Liên hệ</Link></li>
                </ul>
              </div>

              {/* Hỗ trợ */}
              <div className="lg:pl-6 xl:pl-10 border-none lg:border-l lg:border-[#dce5d5]">
                <h3 className="flex items-center gap-2 font-black text-[#1b3d1e] text-[15px] mb-6">
                  <Leaf size={16} className="text-[#568140] fill-current" /> Hỗ trợ
                </h3>
                <ul className="space-y-4">
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Headset size={16} strokeWidth={1.5} className="text-[#647c59]" /> Trung tâm hỗ trợ</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Book size={16} strokeWidth={1.5} className="text-[#647c59]" /> Hướng dẫn sử dụng</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><Shield size={16} strokeWidth={1.5} className="text-[#647c59]" /> Chính sách bảo mật</Link></li>
                  <li><Link href="#" className="flex items-center gap-3 text-[13px] text-[#4a5c43] font-medium hover:text-[#568140] transition-colors"><FileCode2 size={16} strokeWidth={1.5} className="text-[#647c59]" /> Điều khoản sử dụng</Link></li>
                </ul>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="bg-[#eaf1e3] border border-[#d6e5c9] rounded-[24px] p-6 lg:px-8 lg:py-5 flex flex-col lg:flex-row items-center justify-between gap-6 w-full lg:ml-6 xl:ml-10">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-full bg-[#f2f6ed] border border-[#d6e5c9] flex items-center justify-center flex-shrink-0 relative">
                  <Mail className="text-[#568140]" size={24} strokeWidth={1.5} />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-[#f2f6ed] rounded-full p-0.5">
                    <Leaf className="w-4 h-4 text-[#3b5c37] fill-current" />
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1b3d1e] text-[15px] mb-1">Nhận tài liệu & mẹo học IELTS miễn phí!</h4>
                  <p className="text-[12px] text-[#4a5c43] font-medium">Đăng ký nhận tài liệu mới nhất và mẹo học hiệu quả mỗi tuần.</p>
                </div>
              </div>

              <form className="flex w-full lg:w-auto lg:flex-1 max-w-[480px] bg-white rounded-lg overflow-hidden p-1 shadow-sm border border-[#e2ebd9]">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="flex-1 bg-transparent px-4 py-1.5 text-[13px] text-black outline-none placeholder-[#a1ab9b]"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#3e5f39] hover:bg-[#2d472a] text-white px-6 py-2 rounded-md text-[13px] font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  Đăng ký <Send size={14} strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom copyright & Dinosaur */}
        <div className="border-t border-[#dce5d5] pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-[#4a5c43] relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-[#647c59]" />
              <span>© 2024 Quali IELTS. All rights reserved.</span>
            </div>
            
            <div className="hidden md:block w-[1px] h-[16px] bg-[#dce5d5]"></div>
            
            <div className="flex items-center gap-2 font-bold text-[#4a5c43]">
              <span className="text-[#e29368] text-sm">🧡</span> Đồng hành cùng bạn trên hành trình chinh phục IELTS
            </div>
          </div>

          <div className="hidden md:block relative right-[100px]">
            <img
              src="/assets/footer/fly-dinosaur.png"
              alt="Fly Dinosaur"
              className="w-[225px] object-contain pointer-events-none"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
