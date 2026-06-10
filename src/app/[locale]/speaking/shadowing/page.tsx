"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import { 
  Headphones, LayoutGrid, Mic, Video, BookOpen, Music, PlaySquare, 
  User, Globe, Circle, CheckCircle2, Percent, Upload, Play,
  FileText, ArrowLeft, Clock, X, Loader2, Link as LinkIcon, Info
} from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function ShadowingMockupPage() {
  const [activeTab, setActiveTab] = useState("shadowing");
  const router = useRouter();

  // DB Data State
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters State
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState("all");
  const [activeOwner, setActiveOwner] = useState("all");

  // Stats
  const [stats, setStats] = useState({ total: 0, studying: 0, completed: 0, average: 0 });

  // Custom Video Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Preview Data
  const [previewData, setPreviewData] = useState<any>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoadingVideos(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data, error } = await supabase
        .from("shadowing_videos")
        .select("id, youtube_id, title, thumbnail_url, category, level, duration, segments, is_custom, is_community, user_id")
        .order("created_at", { ascending: false });
        
        if (!error && data) {
          const localVideos: VideoLesson[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('custom_lesson_meta_')) {
              try {
                const meta = JSON.parse(localStorage.getItem(key) || "{}");
                meta.is_local = true;
                if (!data.some((v: any) => v.youtube_id === meta.youtube_id)) {
                  localVideos.push(meta);
                }
              } catch (e) {}
            }
          }
          const allVideos = [...localVideos, ...(data as VideoLesson[])];
          setVideos(allVideos);
          
          let studying = 0;
          let completed = 0;
          let totalScore = 0;
          let scoreCount = 0;
          
          allVideos.forEach((v) => {
          const progStr = localStorage.getItem(`shadowing_progress_${v.id}`);
          if (progStr) {
            try {
              const prog = JSON.parse(progStr);
              if (prog.currentIdx > 0) studying++;
              if (prog.currentIdx >= v.segments - 1) completed++;
            } catch (e) {}
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
            } catch (e) {}
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
    loadData();
  }, []);

  const filteredVideos = videos.filter(v => {
    if (activeCategory !== "all" && v.category !== activeCategory) return false;
    if (activeLevel !== "all" && !v.level?.startsWith(activeLevel)) return false;
    if (activeOwner === "mine" && v.user_id !== currentUser?.id) return false;
    if (activeOwner === "community" && !v.is_community) return false;
    return true;
  });

  const handleFilterOwner = (owner: string) => {
    if (owner === "mine" && !currentUser) {
      alert("Vui lòng đăng nhập để xem video của bạn.");
      return;
    }
    setActiveOwner(owner);
  };

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

      // Add to local storage fallback
      const meta = {
        youtube_id: videoId,
        title: previewData?.title || `Custom Video`,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        category: "Custom",
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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 flex pt-[72px]">
        {/* Sidebar */}
        <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col h-[calc(100vh-72px)] sticky top-[72px] overflow-y-auto hidden lg:flex">
          <div className="p-5 flex items-center gap-3 border-b border-gray-50 pb-6 mt-2">
            <div className="bg-[#6b824a] p-2 rounded-xl text-white">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-[#1b3d1e] text-lg leading-tight">Luyện Shadowing</h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Chọn chủ đề luyện nói</p>
            </div>
          </div>

          <div className="p-4 space-y-1">
            <button onClick={() => { setActiveCategory("all"); setActiveLevel("all"); setActiveOwner("all"); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm ${activeCategory === "all" && activeOwner === "all" && activeLevel === "all" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50 transition-colors"}`}>
              <LayoutGrid className="h-5 w-5" />
              Tất cả bài học
            </button>
            <button onClick={() => setActiveCategory("IELTS Speaking")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeCategory === "IELTS Speaking" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <Mic className="h-5 w-5" />
              IELTS Speaking <span className="text-lg leading-none ml-auto">🔥</span>
            </button>
            <button onClick={() => setActiveCategory("TED-Ed")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeCategory === "TED-Ed" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <Video className="h-5 w-5" />
              TED-Ed
            </button>
            <button onClick={() => setActiveCategory("Real Easy English")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeCategory === "Real Easy English" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <BookOpen className="h-5 w-5" />
              Real Easy English
            </button>
            <button onClick={() => setActiveCategory("BBC Learning English")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeCategory === "BBC Learning English" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <Music className="h-5 w-5" />
              BBC Learning English
            </button>
            <button onClick={() => setActiveCategory("Kurzgesagt")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeCategory === "Kurzgesagt" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <PlaySquare className="h-5 w-5" />
              Kurzgesagt
            </button>
            <div className="my-3 border-t border-gray-100 mx-3"></div>
            <button onClick={() => handleFilterOwner("mine")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeOwner === "mine" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <User className="h-5 w-5" />
              Của tôi
            </button>
            <button onClick={() => handleFilterOwner("community")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeOwner === "community" ? "bg-[#f0f3ea] text-[#3B5C37]" : "text-gray-500 hover:bg-gray-50"}`}>
              <Globe className="h-5 w-5" />
              Cộng đồng
            </button>
          </div>

          <div className="mt-2 px-7">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Cấp độ</h3>
            <div className="space-y-2">
              <button onClick={() => setActiveLevel(activeLevel === "C1" ? "all" : "C1")} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${activeLevel === "C1" ? "bg-red-50" : "hover:bg-gray-50"}`}>
                <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                <span className="text-xs font-bold text-gray-600">C1 - Nâng cao</span>
              </button>
              <button onClick={() => setActiveLevel(activeLevel === "B2" ? "all" : "B2")} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${activeLevel === "B2" ? "bg-green-50" : "hover:bg-gray-50"}`}>
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                <span className="text-xs font-bold text-gray-600">B2 - Trung cấp</span>
              </button>
              <button onClick={() => setActiveLevel(activeLevel === "A2" ? "all" : "A2")} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${activeLevel === "A2" ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                <span className="text-xs font-bold text-gray-600">A2 - Sơ cấp</span>
              </button>
            </div>
          </div>

          <div className="mt-8 px-7 pb-8">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Tổng quan</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Headphones className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-black text-[#141c41]">{stats.total} <span className="font-semibold text-gray-500 ml-1">Bài học</span></span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-black text-[#141c41]">{stats.studying} <span className="font-semibold text-gray-500 ml-1">Đang học</span></span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-black text-[#141c41]">{stats.completed} <span className="font-semibold text-gray-500 ml-1">Đã hoàn thành</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-black text-yellow-600">{stats.average}% <span className="font-semibold text-gray-500 ml-1 text-[#141c41]">Trung bình</span></span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto">
            <Link href="/speaking" className="inline-flex items-center gap-2 text-sm font-bold text-[#667064] hover:text-[#3B5C37] transition-colors mb-6 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Quay lại Speaking
            </Link>

            <h1 className="text-[32px] font-black text-[#141c41] mb-2 tracking-tight">Luyện Shadowing</h1>
            <p className="text-gray-500 font-medium mb-8 text-[15px]">Chọn chủ đề để luyện kỹ năng nói một cách tự nhiên</p>

            {/* Toggle */}
            <div className="inline-flex items-center bg-white rounded-full p-1.5 border border-gray-200 mb-10 shadow-sm">
              <button 
                onClick={() => setActiveTab("shadowing")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[13px] transition-colors ${activeTab === "shadowing" ? "bg-[#6b824a] text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Headphones className="h-4 w-4" />
                SHADOWING
              </button>
              <button 
                onClick={() => setActiveTab("dictation")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[13px] transition-colors ${activeTab === "dictation" ? "bg-[#6b824a] text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <FileText className="h-4 w-4" />
                DICTATION
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-black text-[#141c41]">Tất cả bài học</h2>
              <span className="bg-[#f0f3ea] text-[#6b824a] px-3 py-1 rounded-full text-[11px] font-black border border-[#d8e2ce]">
                599 bài học
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hero Upload Card */}
              <div className="md:col-span-2 bg-[#fdf5e6] rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-sm flex flex-col justify-center">
                <div className="relative z-10 max-w-[65%]">
                  <span className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-[11px] font-black text-orange-500 mb-5 shadow-sm">
                    <span className="text-yellow-400 text-sm leading-none">✨</span> MỚI
                  </span>
                  <h2 className="text-3xl md:text-[34px] font-black text-[#141c41] mb-4 leading-[1.15]">
                    Luyện với nội dung <span className="text-orange-500">bạn</span> yêu thích
                  </h2>
                  <p className="text-gray-600 font-medium mb-8 text-[15px] leading-relaxed max-w-sm">
                    Upload video hoặc audio của riêng bạn để luyện Shadowing và Dictation với tid.
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-b from-[#f98821] to-[#e86b0a] text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-3 shadow-[0_8px_20px_rgba(232,107,10,0.3)] hover:scale-[1.02] transition-transform w-fit"
                  >
                    <Upload className="h-5 w-5" />
                    UPLOAD VIDEO / AUDIO
                    <div className="flex flex-col items-start ml-2 text-left">
                      <span className="text-[10px] font-bold text-orange-200 uppercase tracking-wide">Bắt đầu ngay</span>
                    </div>
                  </button>
                </div>

                {/* Decorative floating elements */}
                <div className="absolute right-0 top-0 bottom-0 w-[45%] flex items-center justify-center pointer-events-none">
                  <div className="relative w-full h-full">
                    {/* Yellow headphone block */}
                    <div className="absolute top-[15%] left-[20%] bg-[#fbbc05] w-14 h-14 rounded-2xl rotate-12 flex items-center justify-center shadow-lg">
                      <Headphones className="h-7 w-7 text-white" />
                    </div>
                    {/* Purple mic block */}
                    <div className="absolute bottom-[20%] left-[10%] bg-[#a154f2] w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    {/* White upload block */}
                    <div className="absolute top-[30%] right-[10%] bg-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl rotate-[15deg]">
                      <Upload className="h-8 w-8 text-orange-500" />
                    </div>
                    {/* Main video player block */}
                    <div className="absolute bottom-[30%] right-[20%] bg-white w-32 h-20 rounded-2xl shadow-xl flex items-center justify-center relative">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center pl-1 shadow-md">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                      <span className="absolute bottom-2 right-3 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">CC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Cards */}
              {isLoadingVideos ? (
                <div className="md:col-span-3 flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6b824a] mb-4" />
                  <p className="text-gray-500 font-medium">Đang tải bài học...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="md:col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <Headphones className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium text-lg">Chưa có bài học nào</p>
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <div 
                    key={video.id || video.youtube_id}
                    onClick={() => {
                      if ((video as any).is_local) {
                        router.push(`/speaking/shadowing/${video.youtube_id}?custom=true&mode=shadowing`);
                      } else if (video.is_community || video.is_custom) {
                        router.push(`/speaking/shadowing/${video.id}?saved=true&mode=shadowing`);
                      } else {
                        router.push(`/speaking/shadowing/${video.youtube_id}?mode=shadowing`);
                      }
                    }}
                    className="bg-white rounded-3xl overflow-hidden border border-[#f0f2f5] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col p-1.5"
                  >
                    <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-[20px]">
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`; }}
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                        {video.is_custom && (
                          <span className="bg-[#e11d48] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">Custom</span>
                        )}
                        {video.is_community && (
                          <span className="bg-[#059669] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">Cộng đồng</span>
                        )}
                      </div>

                      {/* Bottom overlay */}
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-1 rounded-md flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration || "--:--"}
                      </div>
                    </div>
                    <div className="p-4 pt-5 flex-1 flex flex-col">
                      <h3 className="font-black text-[#141c41] text-[13px] line-clamp-2 leading-relaxed group-hover:text-green-700 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-gray-400 text-[11px] mt-auto pt-3 font-semibold">
                        {video.segments} phân đoạn
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Add Custom Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#141c41]">Thêm video tuỳ chỉnh</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {modalStep === 1 ? (
                // Step 1: URL Input
                <div className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-2">
                      Đường dẫn YouTube
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6b824a] focus:border-transparent transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchCaptions()}
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <div className="bg-[#f0f3ea] p-4 rounded-xl border border-[#d8e2ce]">
                    <p className="text-[13px] text-[#3B5C37] font-medium leading-relaxed">
                      <strong>Lưu ý:</strong> Video cần có phụ đề tiếng Anh do người dùng tạo (không phải tự động) và thời lượng dưới 20 phút.
                    </p>
                  </div>

                  <button
                    onClick={handleFetchCaptions}
                    disabled={isLoading}
                    className="w-full bg-[#6b824a] hover:bg-[#5a6e3e] text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
                  <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <img 
                      src={`https://img.youtube.com/vi/${previewData?.videoId}/hqdefault.jpg`}
                      alt="Thumbnail"
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="font-bold text-[#141c41]">{previewData?.segments?.length} phân đoạn</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md">
                        Tiếng Anh
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 text-[#6b824a] rounded border-gray-300 focus:ring-[#6b824a]"
                      checked={saveToLibrary}
                      onChange={(e) => setSaveToLibrary(e.target.checked)}
                    />
                    <div>
                      <p className="font-bold text-[#141c41] text-sm">Lưu vào thư viện của tôi</p>
                      <p className="text-xs text-gray-500 mt-0.5">Video sẽ được lưu lại để bạn có thể tiếp tục học lần sau trên mọi thiết bị.</p>
                    </div>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalStep(1)}
                      className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                      disabled={isLoading}
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleSaveVideo}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-[#6b824a] to-[#5a6e3e] hover:from-[#5a6e3e] hover:to-[#4a5c32] text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
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
