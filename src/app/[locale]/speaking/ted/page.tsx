"use client";

import React, { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import {
  Play, Headphones, Search, ArrowLeft, Clock, Circle, CheckCircle2,
  Percent, ArrowRight, Video, Sparkles, Flame, GraduationCap,
  LayoutGrid, Mic, BookOpen, Music, PlaySquare, User, Globe, Upload, X, Loader2, Link as LinkIcon, Info, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VideoLesson {
  id: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  category: string;
  level: string;
  duration: string;
  segments: number;
  is_custom: boolean;
  is_community: boolean;
  user_id: string | null;
}

export default function TedShadowingPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState("all");
  const [stats, setStats] = useState({ total: 0, studying: 0, completed: 0, average: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Custom Video Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  useEffect(() => {
    async function loadTedData() {
      setIsLoadingVideos(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data, error } = await supabase
        .from("shadowing_videos")
        .select("id, youtube_id, title, thumbnail_url, category, level, duration, segments, is_custom, is_community, user_id")
        .eq("category", "TED-Ed")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVideos(data as VideoLesson[]);

        let studying = 0;
        let completed = 0;
        let totalScore = 0;
        let scoreCount = 0;

        data.forEach((v) => {
          const progStr = localStorage.getItem(`shadowing_progress_${v.id}`);
          if (progStr) {
            try {
              const prog = JSON.parse(progStr);
              if (prog.currentIdx > 0) studying++;
              if (prog.currentIdx >= v.segments - 1) completed++;
            } catch (e) { }
          }
          const resStr = localStorage.getItem(`shadowing_results_${v.id}`);
          if (resStr) {
            try {
              const res = JSON.parse(resStr);
              Object.values(res).forEach((val: any) => {
                if (typeof val.score === 'number') {
                  totalScore += val.score;
                  scoreCount++;
                }
              });
            } catch (e) { }
          }
        });

        setStats({
          total: data.length,
          studying,
          completed,
          average: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
        });
      }
      setIsLoadingVideos(false);
    }
    loadTedData();
  }, []);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = activeLevel === "all" || v.level?.startsWith(activeLevel);
    return matchesSearch && matchesLevel;
  });

  const handleFetchCaptions = async () => {
    if (!youtubeUrl) {
      setErrorMsg("Vui lòng nhập đường dẫn YouTube");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/youtube-captions?videoId=${encodeURIComponent(youtubeUrl)}`, {
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setErrorMsg(data.reason === "global"
            ? "Hệ thống đang quá tải. Vui lòng thử lại sau."
            : "Bạn đã vượt quá giới hạn tạo video tuỳ chỉnh hôm nay.");
        } else {
          setErrorMsg(data.error || "Có lỗi xảy ra khi lấy dữ liệu.");
        }
        setIsLoading(false);
        return;
      }

      setPreviewData(data);
      setModalStep(2);
    } catch (error) {
      setErrorMsg("Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVideo = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const videoId = previewData.videoId;

      // Always save to localStorage first
      localStorage.setItem(`custom_lesson_${videoId}`, JSON.stringify(previewData.segments));

      let finalDuration = "--:--";
      const lastSeg = previewData?.segments?.[previewData.segments.length - 1];
      if (lastSeg) {
        const totalSeconds = Math.round(lastSeg.start_time + lastSeg.duration);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        finalDuration = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      let finalCategory = "Custom";
      const lowercaseTitle = (previewData?.title || "").toLowerCase();
      if (
        lowercaseTitle.includes("ted") || 
        lowercaseTitle.includes("sumo") || 
        lowercaseTitle.includes("catnip") || 
        lowercaseTitle.includes("best ideas") || 
        lowercaseTitle.includes("toys") || 
        lowercaseTitle.includes("venice") || 
        lowercaseTitle.includes("bitten") || 
        lowercaseTitle.includes("masquerade")
      ) {
        finalCategory = "TED-Ed";
      }

      // Add to local storage fallback
      const meta = {
        youtube_id: videoId,
        title: previewData?.title || `Custom Video`,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        category: finalCategory,
        level: "Custom",
        duration: finalDuration,
        segments: previewData?.segments?.length || 0,
        is_custom: true,
        is_community: false,
        user_id: currentUser?.id || null
      };
      localStorage.setItem(`custom_lesson_meta_${videoId}`, JSON.stringify(meta));

      // If user wants to save to library and is logged in
      if (saveToLibrary && session) {
        const res = await fetch('/api/shadowing/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            videoId: videoId,
            segments: previewData.segments,
            title: previewData.title || `Custom Video ${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          })
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409) {
            router.push(`/speaking/shadowing/${data.id}?saved=true&mode=shadowing&yid=${data.youtubeId}`);
            return;
          }
          setErrorMsg(data.error || "Có lỗi xảy ra khi lưu video.");
          setIsLoading(false);
          return;
        }

        // Redirect to saved lesson
        router.push(`/speaking/shadowing/${data.id}?saved=true&mode=shadowing&yid=${data.youtubeId}`);
      } else {
        // Redirect to local lesson
        router.push(`/speaking/shadowing/${videoId}?custom=true&mode=shadowing`);
      }
    } catch (error) {
      setErrorMsg("Không thể lưu video. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0505] text-[#f5f5f5] flex flex-col font-sans selection:bg-[#E62B1E] selection:text-white">
      <Navbar />

      <main className="flex-1 flex pt-[72px]">
        {/* Sidebar */}
        <aside className="w-[280px] bg-[#120a0a] border-r border-[#261313] flex flex-col h-[calc(100vh-72px)] sticky top-[72px] overflow-y-auto hidden lg:flex shrink-0">
          <div className="p-5 flex items-center gap-3 border-b border-[#261313] pb-6 mt-2">
            <div className="bg-[#E62B1E] p-2 rounded-xl text-white shadow-[0_0_15px_rgba(230,43,30,0.4)]">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-white text-lg tracking-tight flex items-center gap-1.5 leading-tight">
                TED-Ed <span className="text-[#E62B1E]">Shadow</span>
              </h1>
              <p className="text-[9px] text-[#8a7f7f] font-black uppercase tracking-widest mt-0.5">Luyện Shadowing</p>
            </div>
          </div>

          <div className="p-4 space-y-1">
            <Link href="/speaking/shadowing" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-white transition-colors">
              <LayoutGrid className="h-5 w-5" />
              Tất cả bài học
            </Link>
            <Link href="/speaking/shadowing" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-white transition-colors">
              <Mic className="h-5 w-5" />
              IELTS Speaking
            </Link>
            <Link href="/speaking/ted" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm bg-[#E62B1E]/10 border border-[#E62B1E]/30 text-white shadow-[0_4px_12px_rgba(230,43,30,0.15)] transition-all">
              <Video className="h-5 w-5 text-[#E62B1E]" />
              TED-Ed <span className="text-[9px] font-black bg-[#E62B1E] text-white px-1.5 py-0.5 rounded ml-auto">Active</span>
            </Link>
            <Link href="/speaking/shadowing" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-white transition-colors">
              <BookOpen className="h-5 w-5" />
              Real Easy English
            </Link>
            <Link href="/speaking/shadowing" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-white transition-colors">
              <Music className="h-5 w-5" />
              BBC Learning English
            </Link>
            <Link href="/speaking/shadowing" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-[#b5a9a9] hover:bg-[#1a0f0f] hover:text-white transition-colors">
              <PlaySquare className="h-5 w-5" />
              Kurzgesagt
            </Link>
          </div>

          <div className="mt-4 px-7 border-t border-[#261313] pt-5">
            <h3 className="text-[10px] font-bold text-[#8a7f7f] uppercase tracking-widest mb-4">Cấp độ</h3>
            <div className="space-y-2">
              <button onClick={() => setActiveLevel(activeLevel === "C1" ? "all" : "C1")} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeLevel === "C1" ? "bg-[#E62B1E]/10 text-white border border-[#E62B1E]/30" : "text-[#b5a9a9] hover:bg-[#1a0f0f]"}`}>
                <Circle className="h-2.5 w-2.5 fill-[#E62B1E] text-[#E62B1E]" />
                <span className="text-xs font-bold">C1 - Nâng cao</span>
              </button>
              <button onClick={() => setActiveLevel(activeLevel === "B2" ? "all" : "B2")} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeLevel === "B2" ? "bg-green-950/20 text-white border border-green-800/30" : "text-[#b5a9a9] hover:bg-[#1a0f0f]"}`}>
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                <span className="text-xs font-bold">B2 - Trung cấp</span>
              </button>
              <button onClick={() => setActiveLevel(activeLevel === "A2" ? "all" : "A2")} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeLevel === "A2" ? "bg-blue-950/20 text-white border border-blue-800/30" : "text-[#b5a9a9] hover:bg-[#1a0f0f]"}`}>
                <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                <span className="text-xs font-bold">A2 - Sơ cấp</span>
              </button>
            </div>
          </div>

          <div className="mt-4 px-7 border-t border-[#261313] pt-5 pb-8">
            <h3 className="text-[10px] font-bold text-[#8a7f7f] uppercase tracking-widest mb-4">Tổng quan</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#b5a9a9] font-medium flex items-center gap-2"><Headphones className="h-4 w-4 text-[#8a7f7f]" /> Total lessons</span>
                <span className="text-xs font-black text-white">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#b5a9a9] font-medium flex items-center gap-2"><User className="h-4 w-4 text-[#8a7f7f]" /> Studying</span>
                <span className="text-xs font-black text-amber-500">{stats.studying}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#b5a9a9] font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#8a7f7f]" /> Completed</span>
                <span className="text-xs font-black text-[#E62B1E]">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#b5a9a9] font-medium flex items-center gap-2"><Percent className="h-4 w-4 text-[#E62B1E]" /> Average score</span>
                <span className="text-xs font-black text-white">{stats.average}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto space-y-8">

            {/* Top Navigation Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link
                href="/speaking"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#b5a9a9] hover:text-[#E62B1E] transition-colors group w-fit"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Quay lại Speaking
              </Link>

              {/* Search Box */}
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a7f7f]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm video..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#120a0a] border border-[#261313] rounded-xl text-sm text-white placeholder-[#8a7f7f] focus:outline-none focus:border-[#E62B1E] focus:ring-1 focus:ring-[#E62B1E] transition-all"
                />
              </div>
            </div>

            {/* Premium TED Brand Hero Banner */}
            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1c0a0a] via-[#120505] to-[#0a0505] border border-[#3d1616] p-8 md:p-10 shadow-[0_24px_50px_rgba(230,43,30,0.12)] flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              {/* Radial red glow overlay */}
              <div className="absolute right-0 top-0 w-80 h-80 bg-[#E62B1E]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

              <div className="relative z-10 max-w-[65%] space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-[#E62B1E]/15 border border-[#E62B1E]/30 px-3.5 py-1 rounded-full text-xs font-black text-[#E62B1E] uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  MỚI
                </span>
                <h2 className="text-3xl md:text-[34px] font-black text-white tracking-tight leading-[1.15]">
                  Luyện với nội dung <span className="text-[#E62B1E]">bạn</span> yêu thích
                </h2>
                <p className="text-[#b5a9a9] font-medium text-sm leading-relaxed max-w-sm">
                  Dán link video YouTube để tự động chuyển ngữ và luyện nói đuổi ngay lập tức.
                </p>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-b from-[#E62B1E] to-[#b81f14] text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-3 shadow-[0_8px_20px_rgba(230,43,30,0.3)] hover:scale-[1.02] transition-transform w-fit border-none cursor-pointer"
                >
                  <Upload className="h-5 w-5" />
                  UPLOAD VIDEO / AUDIO
                </button>
              </div>

              {/* Decorative graphic block */}
              <div className="relative w-full md:w-[30%] aspect-video bg-[#1a0f0f] border border-[#3d1616] rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="w-12 h-12 bg-[#E62B1E] rounded-full flex items-center justify-center pl-1 shadow-lg">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
                <span className="absolute bottom-2 right-3 bg-[#E62B1E] text-white text-[8px] font-black px-1.5 py-0.5 rounded">TED</span>
              </div>
            </div>

            {/* Video Lessons Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#261313] pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  Danh sách bài học TED
                  <span className="bg-[#1a0f0f] text-[#E62B1E] border border-[#3d1616] px-2.5 py-0.5 rounded-full text-xs font-black">
                    {filteredVideos.length} bài học
                  </span>
                </h3>
              </div>

              {isLoadingVideos ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-10 h-10 border-4 border-[#E62B1E]/20 border-t-[#E62B1E] rounded-full animate-spin mb-4" />
                  <p className="text-xs text-[#8a7f7f] font-bold">Đang tải bài học TED-Ed...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-[#120a0a] rounded-3xl border border-[#261313] text-center p-6">
                  <Headphones className="h-12 w-12 text-[#3d1616] mb-4" />
                  <h4 className="text-base font-black text-white mb-1">Không tìm thấy video phù hợp</h4>
                  <p className="text-xs text-[#8a7f7f] max-w-xs leading-relaxed">Hãy thử tìm kiếm với từ khóa khác.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => router.push(`/speaking/shadowing/${video.id}?saved=true&mode=shadowing&yid=${video.youtube_id}`)}
                      className="bg-[#120a0a] rounded-3xl overflow-hidden border border-[#261313] hover:border-[#E62B1E]/40 hover:shadow-[0_12px_36px_rgba(230,43,30,0.12)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col p-1.5"
                    >
                      <div className="relative aspect-video bg-[#0a0505] overflow-hidden rounded-[20px]">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`; }}
                        />

                        <div className="absolute top-2.5 left-2.5">
                          <span className="bg-[#E62B1E] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md">
                            {video.level || "C1"}
                          </span>
                        </div>

                        <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-white/5">
                          <Clock className="h-3 w-3 text-[#E62B1E]" />
                          {video.duration || "5:00"}
                        </div>
                      </div>

                      <div className="p-4 pt-5 flex-1 flex flex-col justify-between space-y-4">
                        <h4 className="font-black text-white text-sm line-clamp-2 leading-relaxed group-hover:text-[#E62B1E] transition-colors">
                          {video.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-[#8a7f7f] font-bold border-t border-[#261313] pt-3">
                          <span>{video.segments} phân đoạn</span>
                          <span className="text-[#E62B1E] inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                            Luyện tập ngay <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      </main>

      {/* Add Custom Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#120a0a] border border-[#261313] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#f5f5f5]">
            <div className="flex items-center justify-between p-6 border-b border-[#261313]">
              <h2 className="text-xl font-black text-white">Thêm video tuỳ chỉnh</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8a7f7f] hover:text-white hover:bg-[#1a0f0f] p-2 rounded-full transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {modalStep === 1 ? (
                // Step 1: URL Input
                <div className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-bold text-[#b5a9a9] mb-2">
                      Đường dẫn YouTube
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-[#8a7f7f]" />
                      </div>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#0a0505] border border-[#261313] rounded-xl text-sm font-medium focus:outline-none focus:border-[#E62B1E] focus:ring-1 focus:ring-[#E62B1E] transition-all text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchCaptions()}
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-rose-400 font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <div className="bg-[#1a0f0f] p-4 rounded-xl border border-[#3d1616]">
                    <p className="text-[13px] text-[#b5a9a9] font-medium leading-relaxed">
                      <strong>Lưu ý:</strong> Video cần có phụ đề tiếng Anh do người dùng tạo (không phải tự động) và thời lượng dưới 20 phút.
                    </p>
                  </div>

                  <button
                    onClick={handleFetchCaptions}
                    disabled={isLoading}
                    className="w-full bg-[#E62B1E] hover:bg-[#b81f14] text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Đang lấy phụ đề...
                      </>
                    ) : (
                      "Tiếp tục"
                    )}
                  </button>
                </div>
              ) : (
                // Step 2: Preview & Save
                <div className="space-y-6">
                  <div className="bg-[#0a0505] rounded-2xl overflow-hidden border border-[#261313]">
                    <img
                      src={`https://img.youtube.com/vi/${previewData?.videoId}/hqdefault.jpg`}
                      alt="Thumbnail"
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#b5a9a9]">
                        <FileText className="h-5 w-5" />
                        <span className="font-bold text-white">{previewData?.segments?.length} phân đoạn</span>
                      </div>
                      <span className="bg-emerald-950/40 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-800/30">
                        Tiếng Anh
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-rose-400 font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-4 border border-[#261313] rounded-xl cursor-pointer hover:bg-[#1a0f0f] transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-[#E62B1E] rounded border-[#261313] bg-[#0a0505] focus:ring-[#E62B1E]"
                      checked={saveToLibrary}
                      onChange={(e) => setSaveToLibrary(e.target.checked)}
                    />
                    <div>
                      <p className="font-bold text-white text-sm">Lưu vào thư viện của tôi</p>
                      <p className="text-xs text-[#8a7f7f] mt-0.5">Video sẽ được lưu lại để bạn có thể tiếp tục học lần sau trên mọi thiết bị.</p>
                    </div>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalStep(1)}
                      className="px-6 py-3.5 bg-[#1a0f0f] hover:bg-[#261313] text-[#b5a9a9] rounded-xl font-bold transition-colors border-none cursor-pointer"
                      disabled={isLoading}
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleSaveVideo}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-[#E62B1E] to-[#b81f14] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        "Bắt đầu luyện tập"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
