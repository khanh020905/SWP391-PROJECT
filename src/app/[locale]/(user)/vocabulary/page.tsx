"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Search, Volume2, Plus, Trash2, Heart, Sparkles, BookOpen } from "lucide-react";

interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  category: string | null;
  level: string | null;
}

interface FlashcardItem {
  word: string;
  category: string;
  frequency: number;
  meaning?: string;
  phonetic?: string;
}

interface NotebookItem {
  id: string;
  word: string;
  definition: string | null;
  example: string | null;
  category: string | null;
  created_at: string;
}

const CATEGORIES = [
  "Tất cả",
  "academic",
  "environment",
  "economy",
  "society",
  "health",
  "education",
  "government",
  "technology"
];

const LEVELS = ["Tất cả", "5.5", "6.0", "6.5", "7.0", "7.5", "B1", "B2", "C1"];

export default function VocabularyPage() {
  const { user } = useAuth();
  
  // Tabs: "dictionary" | "notebook"
  const [activePageTab, setActivePageTab] = useState<"dictionary" | "notebook">("dictionary");
  
  // Data States
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [savedWords, setSavedWords] = useState<Record<string, NotebookItem>>({});
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  // Flashcards state
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Notebook tab filter
  const [notebookSearchQuery, setNotebookSearchQuery] = useState("");

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch public vocabulary & flashcards from backend API to bypass client RLS
      const apiRes = await fetch("/api/vocabulary");
      if (!apiRes.ok) throw new Error("Không thể tải danh sách từ vựng");
      const { words: wordsData, flashcards: flashData } = await apiRes.json();

      if (wordsData) {
        setWords(wordsData);
        if (wordsData.length > 0) {
          setSelectedWord(wordsData[0]);
        }
      }

      if (flashData) {
        // Map vocabulary meanings/phonetics to flashcards if available
        const wordsMap = new Map(wordsData?.map((w: any) => [w.word.toLowerCase(), w]) || []);
        const mappedFlash = flashData.map((f: any) => {
          const matched = wordsMap.get(f.word.toLowerCase());
          return {
            ...f,
            meaning: matched?.meaning || "Đang cập nhật...",
            phonetic: matched?.phonetic || ""
          };
        });
        setFlashcards(mappedFlash);
      }

      // Fetch user notebook if logged in
      if (user) {
        const { data: notebookData } = await supabase
          .from("user_notebook")
          .select("*")
          .eq("user_id", user.id);
        
        if (notebookData) {
          const savedMap: Record<string, NotebookItem> = {};
          notebookData.forEach((item: NotebookItem) => {
            savedMap[item.word.toLowerCase()] = item;
          });
          setSavedWords(savedMap);
        }
      }
    } catch (err) {
      console.error("Error fetching vocabulary database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Audio Pronunciation
  const handlePronounce = (word: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Save to Notebook
  const handleSaveToNotebook = async (item: VocabularyItem) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("user_notebook").upsert(
        {
          user_id: user.id,
          word: item.word.toLowerCase(),
          definition: item.meaning,
          example: item.example || "",
          category: item.category || "",
          source: "dictionary"
        },
        { onConflict: "user_id,word" }
      );

      if (error) throw error;

      // Update state
      setSavedWords(prev => ({
        ...prev,
        [item.word.toLowerCase()]: {
          id: "",
          word: item.word.toLowerCase(),
          definition: item.meaning,
          example: item.example,
          category: item.category,
          created_at: new Date().toISOString()
        }
      }));
    } catch (err) {
      console.error("Error saving word to notebook:", err);
    }
  };

  // Remove from Notebook
  const handleRemoveFromNotebook = async (word: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("user_notebook")
        .delete()
        .eq("user_id", user.id)
        .eq("word", word.toLowerCase());

      if (error) throw error;

      setSavedWords(prev => {
        const updated = { ...prev };
        delete updated[word.toLowerCase()];
        return updated;
      });
    } catch (err) {
      console.error("Error deleting word from notebook:", err);
    }
  };

  // Flip Flashcard
  const toggleFlip = (word: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [word]: !prev[word]
    }));
  };

  // Filtering Logic
  const filteredWords = words.filter(w => {
    const matchesSearch = w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "Tất cả" || w.category === selectedCategory;
    const matchesLevel = selectedLevel === "Tất cả" || w.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const filteredNotebook = Object.values(savedWords).filter(item => {
    return item.word.toLowerCase().includes(notebookSearchQuery.toLowerCase()) ||
      (item.definition && item.definition.toLowerCase().includes(notebookSearchQuery.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-[#F5F3EE] p-6 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* ================= HEADER ================= */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-green-600 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 mb-2">
              <BookOpen className="w-4 h-4" /> VOCABULARY
            </p>
            <h1 className="leading-tight">
              <span className="text-black font-black text-5xl tracking-tight">IELTS </span>
              <span className="text-green-600 font-black text-5xl tracking-tight">DICTIONARY</span>
            </h1>
            <p className="text-gray-500 text-sm font-semibold mt-2 max-w-xl">
              Kho từ vựng IELTS theo chủ đề và band điểm. Click vào từ để xem phát âm, ví dụ ngữ cảnh, và lưu vào sổ tay học tập của riêng bạn.
            </p>
          </div>

          {/* PAGE TABS */}
          <div className="flex bg-white/60 p-1.5 rounded-xl border border-gray-200/50 shadow-sm self-start">
            <button
              onClick={() => setActivePageTab("dictionary")}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition duration-200 ${
                activePageTab === "dictionary"
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Từ điển IELTS
            </button>
            <button
              onClick={() => setActivePageTab("notebook")}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition duration-200 ${
                activePageTab === "notebook"
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Sổ tay của tôi ({Object.keys(savedWords).length})
            </button>
          </div>
        </header>

        {activePageTab === "dictionary" ? (
          /* ======================================================= */
          /*                       TAB: TỪ ĐIỂN                      */
          /* ======================================================= */
          <div>
            {/* SEARCH AND FILTERS */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6 flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm từ vựng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#F5F3EE]/40 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition outline-none"
                />
              </div>

              {/* Filters Group */}
              <div className="flex flex-col gap-3">
                {/* Category Pills */}
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Chủ đề</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                          selectedCategory === cat
                            ? "bg-green-600 text-white shadow-sm"
                            : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Pills */}
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Trình độ</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevel(lvl)}
                        className={`px-3 py-1 text-xs font-extrabold rounded-lg transition ${
                          selectedLevel === lvl
                            ? "bg-green-600 text-white shadow-sm"
                            : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DUAL-COLUMN CONTENT */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
              
              {/* Left Column: Word List */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col h-[600px]">
                <div className="text-xs font-black text-gray-400 uppercase tracking-wider pb-3 border-bottom border-gray-100 mb-2">
                  Danh sách từ ({filteredWords.length})
                </div>
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-semibold text-xs">
                    <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mb-3" />
                    Đang tải danh sách từ...
                  </div>
                ) : filteredWords.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-semibold text-xs text-center p-6">
                    Không tìm thấy từ nào phù hợp với bộ lọc.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                    {filteredWords.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedWord(item)}
                        className={`p-3.5 rounded-xl cursor-pointer hover:bg-green-50/50 transition border-l-3 ${
                          selectedWord?.id === item.id
                            ? "border-green-600 bg-green-50 text-gray-900"
                            : "border-transparent text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm tracking-tight">{item.word}</span>
                          <span className="text-[10px] font-black bg-green-100/80 text-green-700 px-2 py-0.5 rounded-md">
                            {item.level || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10.5px] text-gray-400 font-bold">{item.phonetic || "—"}</p>
                          <p className="text-[10.5px] text-gray-500 font-semibold truncate max-w-[120px]">{item.meaning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Word Detail */}
              <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
                {selectedWord ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-gray-100">
                      <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">{selectedWord.word}</h2>
                        <p className="text-gray-400 text-base font-semibold mt-1">{selectedWord.phonetic || "/—/"}</p>
                        <div className="flex gap-1.5 mt-3">
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase">
                            Level: {selectedWord.level || "N/A"}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase">
                            Chủ đề: {selectedWord.category || "General"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePronounce(selectedWord.word)}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition duration-200 flex items-center gap-1.5 shadow-sm border border-gray-200"
                        >
                          <Volume2 className="w-4 h-4 text-green-600" />
                          Phát âm
                        </button>
                        
                        {savedWords[selectedWord.word.toLowerCase()] ? (
                          <button
                            disabled
                            className="px-4 py-2.5 bg-gray-100 text-gray-400 font-extrabold text-xs rounded-xl cursor-not-allowed border border-gray-200"
                          >
                            Đã lưu ✓
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSaveToNotebook(selectedWord)}
                            disabled={!user}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl transition duration-200 flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Lưu vào sổ tay
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Definition */}
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Ý nghĩa</span>
                      <p className="text-xl font-bold text-gray-900 leading-snug">{selectedWord.meaning}</p>
                    </div>

                    {/* Example */}
                    {selectedWord.example && (
                      <div className="p-5 bg-green-50/50 border border-green-200/50 border-l-4 border-l-green-600 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600 block mb-2">Ví dụ ngữ cảnh</span>
                        <p className="text-gray-700 font-semibold italic text-sm leading-relaxed">
                          "{selectedWord.example}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 font-semibold text-xs min-h-[350px]">
                    Chọn một từ ở cột trái để xem chi tiết bài học.
                  </div>
                )}
              </div>
            </div>

            {/* ================= FLASHCARD QUICK REVIEW ================= */}
            {flashcards.length > 0 && (
              <section className="mt-12 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      TỪ THƯỜNG GẶP TRONG IELTS
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      Lật nhanh các thẻ flashcard để ghi nhớ phản xạ nghĩa của từ.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
                  {flashcards.map((card) => {
                    const isFlipped = flippedCards[card.word];
                    return (
                      <div
                        key={card.word}
                        onClick={() => toggleFlip(card.word)}
                        className={`w-64 h-36 rounded-2xl border flex-shrink-0 cursor-pointer p-5 flex flex-col justify-between transition-all duration-300 relative ${
                          isFlipped
                            ? "bg-green-600 border-green-700 text-white shadow-md transform rotate-y-180"
                            : "bg-[#F5F3EE]/50 border-gray-200 text-gray-900 hover:border-green-400 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                            isFlipped ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                          }`}>
                            Tần suất: {card.frequency}
                          </span>
                          <span className={`text-[9px] font-bold ${isFlipped ? "text-white/60" : "text-gray-400"}`}>
                            {card.category}
                          </span>
                        </div>

                        <div className="text-center py-2">
                          {isFlipped ? (
                            <p className="font-extrabold text-base leading-snug">{card.meaning}</p>
                          ) : (
                            <>
                              <p className="font-black text-xl tracking-tight">{card.word}</p>
                              {card.phonetic && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{card.phonetic}</p>}
                            </>
                          )}
                        </div>

                        <div className="text-right">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${
                            isFlipped ? "text-white/60" : "text-green-600"
                          }`}>
                            {isFlipped ? "Click để lật lại" : "Click để xem nghĩa"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* ======================================================= */
          /*                      TAB: SỔ TAY CÁ NHÂN                */
          /* ======================================================= */
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Sổ tay từ vựng của tôi</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Lưu trữ tất cả các từ vựng bạn đã đánh dấu để ôn tập riêng.
                </p>
              </div>

              {/* Notebook Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trong sổ tay..."
                  value={notebookSearchQuery}
                  onChange={(e) => setNotebookSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:border-green-600 transition outline-none"
                />
              </div>
            </div>

            {!user ? (
              <div className="text-center py-12 text-gray-400 font-semibold text-sm">
                Vui lòng đăng nhập để lưu trữ và xem từ vựng cá nhân.
              </div>
            ) : filteredNotebook.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-semibold text-sm">
                {notebookSearchQuery ? "Không tìm thấy từ vựng phù hợp." : "Sổ tay của bạn hiện chưa có từ vựng nào."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotebook.map((item) => (
                  <div
                    key={item.word}
                    className="p-5 border border-gray-200 rounded-2xl bg-[#F5F3EE]/30 hover:border-green-300 hover:shadow-sm transition flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-lg text-gray-900">{item.word}</h3>
                        <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {item.category || "General"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-700 mt-2 leading-snug">{item.definition}</p>
                      {item.example && (
                        <p className="text-xs text-gray-500 italic mt-2 border-l-2 border-green-500/30 pl-2 leading-relaxed">
                          "{item.example}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200/50 pt-3 mt-1">
                      <button
                        onClick={() => handlePronounce(item.word)}
                        className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-green-600 transition"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveFromNotebook(item.word)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition flex items-center gap-1"
                        title="Xóa khỏi sổ tay"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
