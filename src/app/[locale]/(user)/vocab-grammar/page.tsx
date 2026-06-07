"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, FolderPlus, Folder, Star, Trash2, Volume2, Plus, X, 
  BookOpen, Heart, Sparkles, ArrowLeft, ArrowRight, Layers, HelpCircle, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function VocabGrammarPage() {
  // Vocabulary & Collections States
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "flashcards">("list");
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dictionary Search State
  const [dictSearchWord, setDictSearchWord] = useState("");
  const [lookupEntries, setLookupEntries] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [vocabNote, setVocabNote] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // New Collection Form State
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [createColStatus, setCreateColStatus] = useState<string | null>(null);

  // Flashcards Study State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Get authenticated headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || "";
    const headers: any = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["x-mock-user-id"] = "usr_2"; // Fallback for local testing
    }
    return headers;
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const vocabRes = await fetch("/api/student/vocabulary", { headers });
      if (vocabRes.ok) {
        const data = await vocabRes.json();
        setSavedWords(data.vocabularies || []);
      }
      
      const colRes = await fetch("/api/student/vocabulary/collections", { headers });
      if (colRes.ok) {
        const data = await colRes.json();
        setCollections(data.collections || []);
      }
    } catch (e) {
      console.error("Error loading vocabulary data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dictionary Lookup Handler
  const handleDictLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dictSearchWord.trim()) return;
    
    setLookupLoading(true);
    setHasSearched(true);
    setSaveStatus(null);
    setVocabNote("");
    setSelectedCollectionId("");
    setIsFavorite(false);

    try {
      const res = await fetch(`/api/student/vocabulary/lookup?word=${encodeURIComponent(dictSearchWord.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setLookupEntries(data.entries || []);
        
        // Check if word already exists in saved list
        const saved = savedWords.find(v => v.word.toLowerCase() === dictSearchWord.trim().toLowerCase());
        if (saved) {
          setVocabNote(saved.notes || "");
          setSelectedCollectionId(saved.collectionId || "");
          setIsFavorite(saved.isFavorite);
        }
      } else {
        setLookupEntries([]);
      }
    } catch (error) {
      console.error("Error looking up word:", error);
      setLookupEntries([]);
    } finally {
      setLookupLoading(false);
    }
  };

  // Text pronunciation voice audio
  const playPronunciation = (word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Save vocabulary item
  const handleSaveVocab = async (entry: any) => {
    setSaveStatus("saving");
    try {
      const headers = await getAuthHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/student/vocabulary", {
        method: "POST",
        headers,
        body: JSON.stringify({
          word: entry.word,
          partOfSpeech: entry.partOfSpeech,
          definition: entry.definition,
          translation: entry.translation,
          exampleSentence: entry.exampleSentence,
          ipa: entry.ipaUk || entry.ipaUs,
          collectionId: selectedCollectionId || null,
          isFavorite: isFavorite,
          notes: vocabNote
        })
      });

      if (res.ok) {
        await fetchData();
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      console.error("Error saving word:", e);
      setSaveStatus("error");
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (item: any) => {
    try {
      const headers = await getAuthHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/student/vocabulary", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          vocabId: item.id,
          isFavorite: !item.isFavorite
        })
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  // Delete Vocabulary
  const handleDeleteVocab = async (vocabId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa từ vựng này khỏi bộ sưu tập cá nhân?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/student/vocabulary?vocabId=${vocabId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        await fetchData();
        // Shift flashcard index if out of range
        if (currentCardIndex >= Math.max(1, filteredWords.length - 1)) {
          setCurrentCardIndex(Math.max(0, filteredWords.length - 2));
        }
      }
    } catch (e) {
      console.error("Error deleting word:", e);
    }
  };

  // Create New Collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setCreateColStatus("creating");
    try {
      const headers = await getAuthHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/student/vocabulary/collections", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newCollectionName.trim(),
          description: newCollectionDesc.trim()
        })
      });

      if (res.ok) {
        await fetchData();
        setCreateColStatus("success");
        setNewCollectionName("");
        setNewCollectionDesc("");
        setTimeout(() => {
          setShowNewCollectionModal(false);
          setCreateColStatus(null);
        }, 1000);
      } else {
        setCreateColStatus("error");
      }
    } catch (e) {
      console.error("Error creating collection:", e);
      setCreateColStatus("error");
    }
  };

  // Delete Collection
  const handleDeleteCollection = async (colId: string) => {
    if (!confirm("Bạn muốn xóa bộ sưu tập này? Các từ vựng bên trong sẽ không bị xóa, chỉ được đưa về trạng thái Chưa phân loại.")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/student/vocabulary/collections?collectionId=${colId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        await fetchData();
        if (selectedCollectionFilter === colId) {
          setSelectedCollectionFilter("all");
        }
      }
    } catch (e) {
      console.error("Error deleting collection:", e);
    }
  };

  // Filter words
  const filteredWords = savedWords.filter(v => {
    // 1. Filter by collection/favorites
    if (selectedCollectionFilter === "favorites") {
      if (!v.isFavorite) return false;
    } else if (selectedCollectionFilter === "none") {
      if (v.collectionId) return false;
    } else if (selectedCollectionFilter !== "all") {
      if (v.collectionId !== selectedCollectionFilter) return false;
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.word.toLowerCase().includes(q) ||
        v.definition.toLowerCase().includes(q) ||
        v.translation.toLowerCase().includes(q) ||
        (v.notes && v.notes.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Title Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3B5C37]/5 to-transparent rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-[#3B5C37]/10 text-[#3B5C37] rounded-lg">
              Vocab & Grammar Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0f1738] mb-1">Bộ sưu tập từ vựng cá nhân</h1>
          <p className="text-xs text-slate-400 font-medium max-w-lg">
            Tra từ điển Cambridge tối tân, tạo các bộ thẻ từ vựng và tự luyện tập với Flashcards để ghi nhớ nhanh hơn.
          </p>
        </div>

        {/* Stats Summary Panel */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-[9px] font-black text-slate-400 block">TỔNG SỐ TỪ</span>
            <span className="text-lg font-black text-[#3B5C37]">{savedWords.length}</span>
          </div>
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-[9px] font-black text-slate-400 block">YÊU THÍCH</span>
            <span className="text-lg font-black text-amber-500">{savedWords.filter(w => w.isFavorite).length}</span>
          </div>
          <div className="text-center px-3">
            <span className="text-[9px] font-black text-slate-400 block">THƯ MỤC</span>
            <span className="text-lg font-black text-indigo-500">{collections.length}</span>
          </div>
        </div>
      </div>

      {/* Cambridge Dictionary Lookup Search Box */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-sm font-black text-[#0f1738] mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="text-[#3B5C37]">✦</span> Tra Từ Điển Cambridge
        </h2>
        
        <form onSubmit={handleDictLookup} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập từ tiếng Anh bất kỳ để tra nghĩa học thuật..."
              value={dictSearchWord}
              onChange={(e) => setDictSearchWord(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold placeholder-slate-400 outline-none focus:border-[#3B5C37] focus:bg-white transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-6 bg-[#3B5C37] hover:bg-[#2d472a] text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Tra từ</span>
          </button>
        </form>

        {/* Lookup Results area */}
        {lookupLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 border-3 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-400">Đang truy vấn Cambridge Dictionary...</p>
          </div>
        )}

        {!lookupLoading && hasSearched && lookupEntries.length === 0 && (
          <div className="text-center py-8 bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
            <p className="text-xs font-black text-rose-500">Không tìm thấy định nghĩa cho từ "{dictSearchWord}".</p>
            <p className="text-[10px] text-slate-400 mt-1">Hãy chắc chắn rằng bạn đã gõ đúng chính tả.</p>
          </div>
        )}

        {!lookupLoading && lookupEntries.length > 0 && (
          <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-5 animate-scale-in">
            {/* Word Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-[#0d153a] tracking-tight">{lookupEntries[0].word}</h2>
                  <button 
                    onClick={() => playPronunciation(lookupEntries[0].word)}
                    className="w-7 h-7 rounded-lg bg-[#3B5C37]/10 hover:bg-[#3B5C37]/20 text-[#3B5C37] flex items-center justify-center transition-colors cursor-pointer border-none outline-none"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mt-2">
                  {lookupEntries[0].ipaUk && (
                    <span className="text-xs font-mono text-slate-500">
                      <span className="font-sans font-black text-[9px] uppercase px-1 bg-rose-50 text-rose-600 rounded mr-1">UK</span>
                      {lookupEntries[0].ipaUk}
                    </span>
                  )}
                  {lookupEntries[0].ipaUs && lookupEntries[0].ipaUs !== lookupEntries[0].ipaUk && (
                    <span className="text-xs font-mono text-slate-500 border-l border-slate-200 pl-3">
                      <span className="font-sans font-black text-[9px] uppercase px-1 bg-sky-50 text-sky-600 rounded mr-1">US</span>
                      {lookupEntries[0].ipaUs}
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle Favorite Star */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  isFavorite 
                    ? "bg-amber-50 border-amber-200 text-amber-500" 
                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                <svg className={`w-5 h-5 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.242.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.773-.569-.373-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>

            {/* Definitions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ĐỊNH NGHĨA Cambridge</span>
                {lookupEntries.map((entry, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                        {entry.partOfSpeech}
                      </span>
                      {entry.level && (
                        <span className="text-[9px] font-black text-[#B38F4D] bg-[#B38F4D]/10 px-2 py-0.5 rounded">
                          {entry.level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">{entry.definition}</p>
                    <p className="text-xs font-black text-[#3B5C37]">{entry.translation}</p>
                    {entry.exampleSentence && (
                      <p className="text-[11px] text-slate-500 font-medium font-serif leading-relaxed border-t border-slate-100 pt-2 italic mt-2">
                        &ldquo;{entry.exampleSentence}&rdquo;
                      </p>
                    )}
                    <button
                      onClick={() => handleSaveVocab(entry)}
                      className="w-full mt-3 py-2 bg-[#3B5C37] hover:bg-[#2d472a] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                    >
                      <span>Lưu định nghĩa này</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Save settings form */}
              <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-4 h-fit">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TÙY CHỌN BỘ TỪ CỦA BẠN</span>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Lưu vào bộ sưu tập</label>
                  <select
                    value={selectedCollectionId}
                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#3B5C37] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Chưa phân loại --</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ghi chú cá nhân</label>
                  <textarea
                    value={vocabNote}
                    onChange={(e) => setVocabNote(e.target.value)}
                    placeholder="Ghi chú thêm về collocation, từ đồng nghĩa hoặc ngữ cảnh sử dụng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#3B5C37] focus:bg-white transition-all h-24 resize-none"
                  />
                </div>

                {saveStatus === "saving" && (
                  <p className="text-xs font-bold text-slate-400 animate-pulse text-center">Đang lưu từ vựng...</p>
                )}
                {saveStatus === "success" && (
                  <p className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                    ✓ Đã lưu thành công vào bộ từ của bạn!
                  </p>
                )}
                {saveStatus === "error" && (
                  <p className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                    ❌ Lỗi khi lưu từ vựng.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Folder/Collection Manager Panel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#0f1738] uppercase tracking-wider flex items-center gap-2">
            <span className="text-indigo-500">📁</span> Thư mục từ vựng ({collections.length + 3})
          </h2>
          <button
            onClick={() => setShowNewCollectionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold border-none transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Tạo thư mục mới</span>
          </button>
        </div>

        {/* Modal for new collection */}
        {showNewCollectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNewCollectionModal(false)} />
            <form onSubmit={handleCreateCollection} className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4 z-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-[#0d153a] text-sm">Tạo Thư Mục Từ Mới</h3>
                <button type="button" onClick={() => setShowNewCollectionModal(false)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tên thư mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Reading Collocations, Speaking C2..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Mô tả ngắn</label>
                <textarea
                  placeholder="Mô tả mục đích học tập của bộ từ này..."
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white h-20 resize-none"
                />
              </div>

              {createColStatus === "creating" && <p className="text-[11px] text-slate-400 text-center animate-pulse">Đang tạo...</p>}
              {createColStatus === "success" && <p className="text-[11px] text-emerald-600 text-center font-bold">✓ Tạo thành công!</p>}
              {createColStatus === "error" && <p className="text-[11px] text-rose-600 text-center font-bold">❌ Có lỗi xảy ra.</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer border-none"
              >
                Tạo thư mục
              </button>
            </form>
          </div>
        )}

        {/* Collections Folders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {/* All Folder */}
          <div
            onClick={() => {
              setSelectedCollectionFilter("all");
              setCurrentCardIndex(0);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 shadow-sm ${
              selectedCollectionFilter === "all"
                ? "bg-[#3B5C37] border-[#3B5C37] text-white shadow-md scale-102"
                : "bg-white border-slate-100 hover:border-slate-300 text-slate-800"
            }`}
          >
            <BookOpen className={`w-6 h-6 mb-2 ${selectedCollectionFilter === "all" ? "text-amber-300" : "text-[#3B5C37]"}`} />
            <div>
              <h3 className="font-extrabold text-xs leading-tight">Tất cả từ</h3>
              <span className={`text-[10px] font-bold ${selectedCollectionFilter === "all" ? "text-emerald-100" : "text-slate-400"}`}>
                {savedWords.length} từ vựng
              </span>
            </div>
          </div>

          {/* Favorites Folder */}
          <div
            onClick={() => {
              setSelectedCollectionFilter("favorites");
              setCurrentCardIndex(0);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 shadow-sm ${
              selectedCollectionFilter === "favorites"
                ? "bg-amber-500 border-amber-500 text-white shadow-md scale-102"
                : "bg-white border-slate-100 hover:border-slate-300 text-slate-800"
            }`}
          >
            <Heart className={`w-6 h-6 mb-2 ${selectedCollectionFilter === "favorites" ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
            <div>
              <h3 className="font-extrabold text-xs leading-tight">Yêu thích</h3>
              <span className={`text-[10px] font-bold ${selectedCollectionFilter === "favorites" ? "text-amber-100" : "text-slate-400"}`}>
                {savedWords.filter(w => w.isFavorite).length} từ vựng
              </span>
            </div>
          </div>

          {/* Uncategorized Folder */}
          <div
            onClick={() => {
              setSelectedCollectionFilter("none");
              setCurrentCardIndex(0);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 shadow-sm ${
              selectedCollectionFilter === "none"
                ? "bg-slate-700 border-slate-700 text-white shadow-md scale-102"
                : "bg-white border-slate-100 hover:border-slate-300 text-slate-800"
            }`}
          >
            <Layers className={`w-6 h-6 mb-2 ${selectedCollectionFilter === "none" ? "text-slate-200" : "text-slate-500"}`} />
            <div>
              <h3 className="font-extrabold text-xs leading-tight">Chưa phân loại</h3>
              <span className={`text-[10px] font-bold ${selectedCollectionFilter === "none" ? "text-slate-200" : "text-slate-400"}`}>
                {savedWords.filter(w => !w.collectionId).length} từ vựng
              </span>
            </div>
          </div>

          {/* Custom Folders */}
          {collections.map(col => {
            const isActive = selectedCollectionFilter === col.id;
            const count = savedWords.filter(w => w.collectionId === col.id).length;

            return (
              <div
                key={col.id}
                onClick={() => {
                  setSelectedCollectionFilter(col.id);
                  setCurrentCardIndex(0);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 shadow-sm group ${
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-102"
                    : "bg-white border-slate-100 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex justify-between items-start">
                  <Folder className={`w-6 h-6 ${isActive ? "text-indigo-200" : "text-indigo-500"}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(col.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer p-0.5 rounded hover:bg-slate-100/50 transition-all ${
                      isActive ? "hover:bg-indigo-500 group-hover:opacity-100 text-white" : ""
                    }`}
                    title="Xóa thư mục"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h3 className="font-extrabold text-xs leading-tight truncate pr-2" title={col.name}>{col.name}</h3>
                  <span className={`text-[10px] font-bold ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                    {count} từ vựng
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Saved Words List & Flashcards Section */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        
        {/* Toggle Mode Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#0f1738]">Danh sách từ trong thư mục</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2.5 py-0.5 rounded-full">
              {filteredWords.length} từ
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none outline-none select-none ${
                activeTab === "list"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dạng danh sách</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("flashcards");
                setCurrentCardIndex(0);
                setIsCardFlipped(false);
              }}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none outline-none select-none ${
                activeTab === "flashcards"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Thẻ từ Flashcards</span>
            </button>
          </div>
        </div>

        {/* Saved Word filter search box */}
        {activeTab === "list" && (
          <div className="space-y-4">
            <div className="relative w-full max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Lọc từ vựng đã lưu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold placeholder-slate-400 outline-none focus:border-[#3B5C37] focus:bg-white"
              />
            </div>

            {filteredWords.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-extrabold text-slate-500">Chưa có từ vựng nào</p>
                <p className="text-[10px] text-slate-400 mt-1">Lưu các từ mới từ kết quả tìm kiếm Cambridge hoặc các bài Review để bắt đầu ôn tập.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWords.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 flex flex-col justify-between space-y-3 relative hover:border-slate-300 transition-all shadow-sm hover:shadow-md duration-300"
                  >
                    <div>
                      {/* Top badge level & word & stars */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-black text-[#0f1738]">{item.word}</h3>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-slate-900 text-white rounded">
                              {item.partOfSpeech}
                            </span>
                          </div>
                          {item.ipa && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400">{item.ipa}</span>
                              <button 
                                onClick={() => playPronunciation(item.word)}
                                className="p-0.5 text-slate-400 hover:text-[#3B5C37] bg-transparent border-none outline-none cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Favorite & Delete Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleFavorite(item)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-amber-500 transition-all cursor-pointer border-none bg-transparent"
                            title={item.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                          >
                            <Star className={`w-4.5 h-4.5 ${item.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleDeleteVocab(item.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all cursor-pointer border-none bg-transparent"
                            title="Xóa từ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Definitions */}
                      <div className="space-y-1.5 mt-3">
                        <p className="text-xs text-slate-700 font-extrabold leading-relaxed">{item.definition}</p>
                        <p className="text-xs text-[#3B5C37] font-black">{item.translation}</p>
                      </div>

                      {/* Example */}
                      {item.exampleSentence && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100/60 mt-3 text-[11px]">
                          <p className="text-slate-600 font-medium font-serif italic leading-relaxed">&ldquo;{item.exampleSentence}&rdquo;</p>
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="bg-yellow-50/50 border border-yellow-100 p-2.5 rounded-xl text-[10px] text-slate-600 mt-2">
                          <strong className="text-slate-700 font-black block mb-0.5">Ghi chú:</strong>
                          <p className="font-semibold leading-relaxed">{item.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Created At Timestamp */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] font-black text-slate-400">
                      <span>ĐÃ LƯU: {new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                      {item.collectionId && (
                        <span className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">
                          {collections.find(c => c.id === item.collectionId)?.name || "Bộ từ"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive 3D Flashcard Deck */}
        {activeTab === "flashcards" && (
          <div className="flex flex-col items-center justify-center py-6">
            {filteredWords.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 w-full max-w-lg">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-extrabold text-slate-500">Thư mục này chưa có từ để làm Flashcards</p>
                <p className="text-[10px] text-slate-400 mt-1">Lưu thêm từ để kích hoạt tính năng ôn tập.</p>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-6">
                
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                    <span>TIẾN ĐỘ ÔN TẬP</span>
                    <span>{currentCardIndex + 1} / {filteredWords.length} thẻ từ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${((currentCardIndex + 1) / filteredWords.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3D Card Container */}
                <div 
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="w-full aspect-[4/3] bg-transparent cursor-pointer [perspective:1000px] select-none"
                >
                  <div 
                    className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${
                      isCardFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                  >
                    {/* Front Face: English word */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-slate-900 to-[#1e244d] text-white rounded-3xl p-8 flex flex-col justify-between items-center shadow-lg border border-slate-800 [backface-visibility:hidden]">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[8px] font-black bg-white/10 text-white/70 px-2 py-0.5 rounded-full tracking-widest uppercase">
                          Học từ vựng
                        </span>
                        <div className="flex items-center gap-1">
                          {filteredWords[currentCardIndex].isFavorite && (
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          )}
                          <span className="text-[9px] bg-[#3B5C37] text-white px-2 py-0.5 rounded font-black uppercase">
                            {filteredWords[currentCardIndex].partOfSpeech}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-2">
                        <h2 className="text-3xl font-black tracking-tight">{filteredWords[currentCardIndex].word}</h2>
                        {filteredWords[currentCardIndex].ipa && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-mono text-slate-300">{filteredWords[currentCardIndex].ipa}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playPronunciation(filteredWords[currentCardIndex].word);
                              }}
                              className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border-none outline-none"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 animate-pulse">
                        <span>Click vào thẻ để xem nghĩa và ví dụ</span>
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      </p>
                    </div>

                    {/* Back Face: Meaning & Translation */}
                    <div className="absolute inset-0 w-full h-full bg-white text-[#0f1738] rounded-3xl p-8 flex flex-col justify-between items-center border border-slate-200 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
                      <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">
                          Giải nghĩa
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          Đã thuộc từ này?
                        </span>
                      </div>

                      <div className="w-full space-y-3.5 py-4 text-left">
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-relaxed">
                            {filteredWords[currentCardIndex].definition}
                          </p>
                          <p className="text-sm font-black text-[#3B5C37] mt-1.5 leading-snug">
                            {filteredWords[currentCardIndex].translation}
                          </p>
                        </div>

                        {filteredWords[currentCardIndex].exampleSentence && (
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs">
                            <span className="text-[8px] font-black text-slate-400 block mb-0.5">VÍ DỤ TRONG BÀI</span>
                            <p className="text-slate-600 font-medium font-serif italic leading-relaxed">&ldquo;{filteredWords[currentCardIndex].exampleSentence}&rdquo;</p>
                          </div>
                        )}

                        {filteredWords[currentCardIndex].notes && (
                          <p className="text-[10px] text-slate-500 font-semibold italic bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                            <strong>Ghi chú:</strong> {filteredWords[currentCardIndex].notes}
                          </p>
                        )}
                      </div>

                      <div className="w-full text-center text-[9px] font-bold text-slate-400">
                        Click để quay lại mặt trước
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back / Next actions */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.max(0, prev - 1));
                      setIsCardFlipped(false);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Trước</span>
                  </button>

                  <button
                    disabled={currentCardIndex === filteredWords.length - 1}
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.min(filteredWords.length - 1, prev + 1));
                      setIsCardFlipped(false);
                    }}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
                  >
                    <span>Tiếp theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
