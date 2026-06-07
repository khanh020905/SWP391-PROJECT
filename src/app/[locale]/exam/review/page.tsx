"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Sparkles, Check, X, CheckCircle, XCircle, AlertCircle, 
  ChevronDown, ChevronUp, Play, Pause, Volume2, Info, 
  BookOpen, Clock, Award, Headphones, ArrowLeft, ArrowRight, 
  Search, Filter, BookMarked, Compass, Calendar, ChevronRight,
  ExternalLink, User, ShieldAlert, LogOut, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Mock Exam Review Data for Reading
const mockReadingReview = {
  testTitle: "Cambridge IELTS 18 - Test 1 - Reading Passage 1",
  passageTitle: "Urban Farming: The Future of Food Production",
  passageContent: [
    {
      id: "p1",
      number: "Paragraph A",
      text: "Urban farming, the practice of cultivating, processing, and distributing food in or around metropolitan areas, is rapidly changing our relationship with what we eat. In many cities worldwide, empty lots, rooftops, and abandoned warehouses are being transformed into lush, green farms. Proponents argue that growing food where it is consumed reduces transportation costs and greenhouse gas emissions, creating a more sustainable urban ecosystem. In a world where over half the population lives in cities, this hyper-local approach to agriculture seems not just innovative, but necessary."
    },
    {
      id: "p2",
      number: "Paragraph B",
      text: "Historically, food production was strictly segregated from urban life. The industrial revolution pushed farms further into rural areas, relying on massive transport networks to bring fresh produce to city dwellers. However, this system has significant flaws: fruit and vegetables are often picked unripe to survive long journeys, losing nutritional value along the way. Furthermore, supply chain disruptions, such as fuel price hikes or extreme weather events, can leave city supermarket shelves empty within days. Urban agriculture offers a resilient buffer against such vulnerabilities."
    },
    {
      id: "p3",
      number: "Paragraph C",
      text: "One of the most promising methods in urban farming is hydroponics—growing plants in nutrient-rich water solutions without soil. This technique allows crops to be stacked vertically in layers, drastically reducing the physical footprint required. A single vertical hydroponic farm in a disused London subway tunnel can produce up to ten times the yield of a traditional soil-based farm of the same surface area. Additionally, vertical farming uses up to 95% less water, a critical factor in regions facing severe droughts."
    },
    {
      id: "p4",
      number: "Paragraph D",
      text: "Despite the clear environmental benefits, critics point out several major hurdles, chief among them being energy consumption. Vertical farms rely heavily on artificial LED lighting and climate control systems, which require substantial electricity. If this power comes from fossil fuels, the carbon footprint of vertical farming may actually exceed that of traditional field agriculture. Therefore, integrating renewable energy sources—such as solar panels and wind turbines—is vital for the long-term viability of high-tech urban farms."
    }
  ],
  questions: [
    {
      id: 1,
      number: 1,
      type: "TFNG", // True/False/Not Given
      questionText: "Proponents believe that urban farming can help lower the emissions of greenhouse gases.",
      userAnswer: "TRUE",
      correctAnswer: "TRUE",
      isCorrect: true,
      explanation: {
        paragraphId: "p1",
        translation: "Những người ủng hộ tin rằng canh tác đô thị có thể giúp giảm lượng khí thải gây hiệu ứng nhà kính.",
        clue: "\"...growing food where it is consumed reduces transportation costs and greenhouse gas emissions...\"",
        reasoning: "Trong Đoạn A, tác giả viết rằng những người ủng hộ (proponents) cho rằng việc trồng thực phẩm ở nơi tiêu thụ giúp giảm chi phí vận chuyển và 'lượng khí thải gây hiệu ứng nhà kính' (greenhouse gas emissions). Do đó, tuyên bố trong câu hỏi là hoàn toàn chính xác (TRUE).",
        vocabulary: [
          { word: "Proponents", type: "noun", meaning: "Người ủng hộ, người đề xuất" },
          { word: "Emissions", type: "noun", meaning: "Sự phát thải, lượng khí thải" }
        ]
      }
    },
    {
      id: 2,
      number: 2,
      type: "TFNG",
      questionText: "Fruits and vegetables grown in rural areas have higher nutritional value than those grown in cities.",
      userAnswer: "TRUE",
      correctAnswer: "FALSE",
      isCorrect: false,
      explanation: {
        paragraphId: "p2",
        translation: "Trái cây và rau quả trồng ở khu vực nông thôn có giá trị dinh dưỡng cao hơn so với loại trồng ở thành phố.",
        clue: "\"...fruit and vegetables are often picked unripe to survive long journeys, losing nutritional value along the way.\"",
        reasoning: "Đoạn B chỉ ra rằng rau củ từ nông thôn thường phải hái khi chưa chín để vận chuyển đường dài vào thành phố, khiến chúng bị 'mất đi giá trị dinh dưỡng trên đường đi' (losing nutritional value). Điều này mâu thuẫn với nhận định rằng chúng có dinh dưỡng cao hơn. Vì vậy đáp án là FALSE.",
        vocabulary: [
          { word: "Segregated", type: "adjective", meaning: "Bị chia tách, cô lập" },
          { word: "Unripe", type: "adjective", meaning: "Chưa chín, còn xanh" }
        ]
      }
    },
    {
      id: 3,
      number: 3,
      type: "MCQ", // Multiple Choice
      questionText: "What is the main advantage of vertical hydroponics highlighted in Paragraph C?",
      options: [
        { key: "A", text: "It uses soil enriched with artificial chemicals." },
        { key: "B", text: "It produces higher crop yields in a smaller physical space." },
        { key: "C", text: "It completely eliminates the need for water." },
        { key: "D", text: "It is cheaper to set up than traditional farming." }
      ],
      userAnswer: "B",
      correctAnswer: "B",
      isCorrect: true,
      explanation: {
        paragraphId: "p3",
        translation: "Ưu điểm chính của phương pháp thủy canh đứng được nhấn mạnh trong Đoạn C là gì?",
        clue: "\"...drastically reducing the physical footprint required. A single vertical hydroponic farm... can produce up to ten times the yield...\"",
        reasoning: "Đoạn C giải thích rằng thủy canh đứng giúp giảm đáng kể 'diện tích vật lý cần thiết' (reducing physical footprint) và tạo ra năng suất gấp mười lần (ten times the yield). Điều này tương ứng trực tiếp với lựa chọn B.",
        vocabulary: [
          { word: "Footprint", type: "noun", meaning: "Diện tích chiếm dụng, dấu chân" },
          { word: "Yield", type: "noun/verb", meaning: "Sản lượng, năng suất" }
        ]
      }
    },
    {
      id: 4,
      number: 4,
      type: "FIB", // Fill in the Blanks
      questionText: "Critics argue that vertical farms require a lot of electricity because they rely heavily on artificial ________.",
      userAnswer: "LED lighting",
      correctAnswer: "LED lighting",
      isCorrect: true,
      explanation: {
        paragraphId: "p4",
        translation: "Các nhà phê bình tranh luận rằng các trang trại đứng đòi hỏi rất nhiều điện năng vì họ phụ thuộc nhiều vào hệ thống chiếu sáng LED nhân tạo.",
        clue: "\"Vertical farms rely heavily on artificial LED lighting and climate control systems...\"",
        reasoning: "Trong Đoạn D, tác giả nói rõ rằng các trang trại thẳng đứng dựa dẫm nặng nề vào 'artificial LED lighting' (hệ thống chiếu sáng LED nhân tạo) và hệ thống kiểm soát khí hậu. Từ thích hợp nhất để điền vào chỗ trống là 'LED lighting'.",
        vocabulary: [
          { word: "Hurdles", type: "noun", meaning: "Rào cản, chướng ngại vật" },
          { word: "Viability", type: "noun", meaning: "Khả năng tồn tại, tính khả thi" }
        ]
      }
    },
    {
      id: 5,
      number: 5,
      type: "TFNG",
      questionText: "High-tech urban farms are currently powered entirely by wind energy.",
      userAnswer: "TRUE",
      correctAnswer: "NOT GIVEN",
      isCorrect: false,
      explanation: {
        paragraphId: "p4",
        translation: "Các trang trại đô thị công nghệ cao hiện đang được cung cấp năng lượng hoàn toàn bằng năng lượng gió.",
        clue: "\"Therefore, integrating renewable energy sources—such as solar panels and wind turbines—is vital for the long-term viability...\"",
        reasoning: "Đoạn D chỉ đề cập rằng việc tích hợp các nguồn năng lượng tái tạo như tấm pin mặt trời và tuabin gió là cực kỳ quan trọng đối với sự tồn tại lâu dài, chứ không nói rằng hiện tại các trang trại này đang được vận hành 100% bằng năng lượng gió. Do đó, thông tin này không được đưa ra (NOT GIVEN).",
        vocabulary: [
          { word: "Vital", type: "adjective", meaning: "Sống còn, cực kỳ quan trọng" }
        ]
      }
    }
  ]
};

// Mock Exam Review Data for Listening
const mockListeningReview = {
  testTitle: "Cambridge IELTS 18 - Test 1 - Listening Section 1",
  audioTitle: "Inquiry about renting a conference room",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Public domain mock audio file
  transcript: [
    { time: "0:00", speaker: "Agent", text: "Good morning, conference booking office. How can I help you today?" },
    { time: "0:08", speaker: "Client", text: "Hello, I'd like to make an inquiry about renting a conference room for an upcoming corporate event." },
    { time: "0:14", speaker: "Agent", text: "Certainly. We have rooms of various sizes. Do you know roughly how many attendees you expect?" },
    { time: "0:20", speaker: "Client", text: "Yes, we expect around eighty people. We are planning a presentation, so we will need comfortable seating and good AV equipment." },
    { time: "0:28", speaker: "Agent", text: "Understood. For eighty people, I recommend our 'Richmond Suite'. It has a seating capacity of up to ninety-five, and features a state-of-the-art projector." },
    { time: "0:39", speaker: "Client", text: "That sounds ideal. And what about the date? Is it available on the fifteenth of October?" },
    { time: "0:45", speaker: "Agent", text: "Let me check the calendar... Ah, yes, the Richmond Suite is free on the 15th of October. The total rent for a full day is four hundred and fifty dollars, which includes refreshments." },
    { time: "0:58", speaker: "Client", text: "Excellent. Can I pay the security deposit by credit card?" },
    { time: "1:03", speaker: "Agent", text: "Yes, we accept all major cards. We require a deposit of one hundred dollars to secure the room." }
  ],
  questions: [
    {
      id: 6,
      number: 1,
      type: "FIB",
      questionText: "The conference room needs to accommodate approximately ________ people.",
      userAnswer: "80",
      correctAnswer: "80",
      isCorrect: true,
      explanation: {
        paragraphId: "audio",
        translation: "Phòng hội nghị cần đáp ứng được cho khoảng ________ người.",
        clue: "Client: \"Yes, we expect around eighty people.\"",
        reasoning: "Khách hàng nói rõ rằng họ dự kiến khoảng 80 người tham dự ('eighty people'). Từ cần điền là số '80' hoặc chữ 'eighty'.",
        vocabulary: [
          { word: "Accommodate", type: "verb", meaning: "Đáp ứng, chứa được" },
          { word: "Attendees", type: "noun", meaning: "Người tham dự" }
        ]
      }
    },
    {
      id: 7,
      number: 2,
      type: "MCQ",
      questionText: "Which room does the agent recommend for the client's event?",
      options: [
        { key: "A", text: "The London Suite" },
        { key: "B", text: "The Richmond Suite" },
        { key: "C", text: "The Royal Ballroom" },
        { key: "D", text: "The Windsor Hall" }
      ],
      userAnswer: "A",
      correctAnswer: "B",
      isCorrect: false,
      explanation: {
        paragraphId: "audio",
        translation: "Nhân viên đề xuất căn phòng nào cho sự kiện của khách hàng?",
        clue: "Agent: \"For eighty people, I recommend our 'Richmond Suite'.\"",
        reasoning: "Nhân viên tư vấn khuyên nên sử dụng phòng tên là 'Richmond Suite' vì nó chứa tối đa 95 người. Người dùng chọn A (London Suite) là sai, đáp án đúng là B.",
        vocabulary: [
          { word: "Capacity", type: "noun", meaning: "Sức chứa, dung tích" },
          { word: "State-of-the-art", type: "adjective", meaning: "Tối tân, hiện đại nhất" }
        ]
      }
    },
    {
      id: 8,
      number: 3,
      type: "FIB",
      questionText: "The total rent for the suite for a full day is $________.",
      userAnswer: "450",
      correctAnswer: "450",
      isCorrect: true,
      explanation: {
        paragraphId: "audio",
        translation: "Tổng giá thuê phòng cho cả ngày là $________.",
        clue: "Agent: \"The total rent for a full day is four hundred and fifty dollars...\"",
        reasoning: "Nhân viên báo giá thuê là 'four hundred and fifty dollars' tức là $450. Số cần điền là '450'.",
        vocabulary: [
          { word: "Refreshments", type: "noun", meaning: "Đồ uống/thức ăn nhẹ giải khát" }
        ]
      }
    },
    {
      id: 9,
      number: 4,
      type: "FIB",
      questionText: "The security deposit required to secure the room is $________.",
      userAnswer: "150",
      correctAnswer: "100",
      isCorrect: false,
      explanation: {
        paragraphId: "audio",
        translation: "Khoản tiền đặt cọc giữ phòng được yêu cầu là $________.",
        clue: "Agent: \"We require a deposit of one hundred dollars to secure the room.\"",
        reasoning: "Nhân viên nói rằng họ yêu cầu khoản đặt cọc trị giá 'one hundred dollars' ($100) để giữ phòng. Học sinh điền 150 là sai, đáp án đúng là 100.",
        vocabulary: [
          { word: "Deposit", type: "noun/verb", meaning: "Tiền đặt cọc, gửi tiền" },
          { word: "Secure", type: "verb", meaning: "Bảo đảm, giữ chỗ an toàn" }
        ]
      }
    }
  ]
};

function ExamReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active review type: "reading" | "listening"
  const [reviewType, setReviewType] = useState<"reading" | "listening">("reading");

  // Filter for questions: "all" | "correct" | "incorrect" | "TFNG" | "MCQ" | "FIB"
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // Expanded explanation card index (question ID)
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Search keyword within passage/questions
  const [searchQuery, setSearchQuery] = useState("");

  // Listening Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const audioNodeRef = useRef<HTMLAudioElement | null>(null);

  // Database / Network status indicator
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Vocabulary & Selection States
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [lookupWord, setLookupWord] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupEntries, setLookupEntries] = useState<any[]>([]);
  
  const [vocabNote, setVocabNote] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch saved vocabulary and collections
  const fetchUserVocabulary = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-mock-user-id"] = "usr_2";

      const vocabRes = await fetch("/api/student/vocabulary", { headers });
      if (vocabRes.ok) {
        const d = await vocabRes.json();
        setSavedWords(d.vocabularies || []);
      }

      const colRes = await fetch("/api/student/vocabulary/collections", { headers });
      if (colRes.ok) {
        const d = await colRes.json();
        setCollections(d.collections || []);
      }
    } catch (e) {
      console.error("Error fetching vocab data:", e);
    }
  };

  const handleTriggerLookup = async (word: string) => {
    if (!word) return;
    const cleanWord = word.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
    if (!cleanWord) return;
    
    setLookupWord(cleanWord);
    setLookupLoading(true);
    setIsDrawerOpen(true);
    setSaveStatus(null);
    setVocabNote("");
    setSelectedCollectionId("");
    setIsFavorite(false);

    try {
      const res = await fetch(`/api/student/vocabulary/lookup?word=${encodeURIComponent(cleanWord)}`);
      if (res.ok) {
        const data = await res.json();
        setLookupEntries(data.entries || []);
        
        const saved = savedWords.find(v => v.word.toLowerCase() === cleanWord.toLowerCase());
        if (saved) {
          setVocabNote(saved.notes || "");
          setSelectedCollectionId(saved.collectionId || "");
          setIsFavorite(saved.isFavorite);
        }
      }
    } catch (e) {
      console.error("Error looking up word:", e);
    } finally {
      setLookupLoading(false);
    }
  };

  const playPronunciation = (word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleTextSelection = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    
    if (text && text.length > 0 && text.split(/\s+/).length <= 4) {
      setSelectedText(text);
      
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectionCoords({
          x: rect.left + window.scrollX + rect.width / 2,
          y: rect.top + window.scrollY - 40
        });
      }
    } else {
      setSelectedText("");
      setSelectionCoords(null);
    }
  };

  const handleSaveVocabulary = async (entry: any) => {
    setSaveStatus("saving");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-mock-user-id"] = "usr_2";

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
        await fetchUserVocabulary();
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      console.error("Lỗi khi lưu từ vựng:", e);
      setSaveStatus("error");
    }
  };

  const renderTextWithHighlights = (text: string, wordsToHighlight: string[], onWordClick: (word: string) => void) => {
    if (!wordsToHighlight || wordsToHighlight.length === 0 || !text) return text;
    
    const sortedWords = [...new Set(wordsToHighlight)]
      .filter(w => w && w.length > 1)
      .sort((a, b) => b.length - a.length);
      
    if (sortedWords.length === 0) return text;
    
    const escapedWords = sortedWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    
    try {
      const pattern = new RegExp(`\\b(${escapedWords.join("|")})\\b`, "gi");
      const parts = text.split(pattern);
      if (parts.length === 1) return text;
      
      return (
        <>
          {parts.map((part, index) => {
            if (index % 2 !== 0) {
              return (
                <span 
                  key={index} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordClick(part);
                  }}
                  className="bg-amber-100/90 text-slate-800 font-extrabold px-1 rounded border-b border-amber-300 cursor-pointer hover:bg-amber-200 transition-colors"
                  title="Click để tra từ Cambridge"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </>
      );
    } catch (e) {
      return text;
    }
  };

  // Selection listener
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".selection-lookup-btn")) return;
      
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") {
        setSelectedText("");
        setSelectionCoords(null);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  // Fetch vocabulary on user mount
  useEffect(() => {
    if (user) {
      fetchUserVocabulary();
    }
  }, [user]);

  // Check auth and setup state
  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.email_confirmed_at) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Supabase connect failed. Falling back to mock session.");
        setIsOfflineMode(true);
      } finally {
        setLoading(false);
      }
    }
    checkUser();

    // Auto-select type based on URL parameter
    const typeParam = searchParams.get("type");
    if (typeParam === "listening") {
      setReviewType("listening");
    } else {
      setReviewType("reading");
    }
  }, [searchParams]);

  // Handle outside click for avatar dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.reload();
    } catch (e) {
      setUser(null);
    }
  };

  // Get active dataset
  const activeData = reviewType === "reading" ? mockReadingReview : mockListeningReview;

  // Filtered questions
  const filteredQuestions = activeData.questions.filter(q => {
    // Question status filter
    if (activeFilter === "correct" && !q.isCorrect) return false;
    if (activeFilter === "incorrect" && q.isCorrect) return false;
    if (activeFilter === "TFNG" && q.type !== "TFNG") return false;
    if (activeFilter === "MCQ" && q.type !== "MCQ") return false;
    if (activeFilter === "FIB" && q.type !== "FIB") return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const inQuestion = q.questionText.toLowerCase().includes(query);
      const inExplanation = q.explanation.reasoning.toLowerCase().includes(query);
      return inQuestion || inExplanation;
    }

    return true;
  });

  // Calculate statistics
  const totalQuestions = activeData.questions.length;
  const correctCount = activeData.questions.filter(q => q.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  // Format time (seconds -> mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Audio Handlers
  const handlePlayPause = () => {
    if (!audioNodeRef.current) return;
    if (isPlaying) {
      audioNodeRef.current.pause();
      setIsPlaying(false);
    } else {
      audioNodeRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioNodeRef.current) return;
    setCurrentTime(audioNodeRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioNodeRef.current) return;
    setDuration(audioNodeRef.current.duration);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioNodeRef.current) return;
    const value = parseFloat(e.target.value);
    audioNodeRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleSpeedChange = () => {
    if (!audioNodeRef.current) return;
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 0.85;
    else nextRate = 1;

    audioNodeRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleJumpToTime = (timeStr: string) => {
    if (!audioNodeRef.current) return;
    const parts = timeStr.split(":");
    const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    audioNodeRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      audioNodeRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-[#f4f5f9] text-[#0f1738] min-h-screen font-sans antialiased pb-20">
      
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-[#3B5C37]/10 via-[#B38F4D]/5 to-transparent pointer-events-none z-0" />

      {/* Premium Header */}
      <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between px-6 py-5 relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center text-white font-black text-xl shadow-[0_8px_16px_rgba(59, 92, 55,0.2)]">
            *
          </div>
          <Link href="/" className="text-xl font-extrabold text-[#11193f] tracking-tight hover:opacity-90 transition-opacity">
            QualiCode <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-600 font-bold ml-1.5 align-middle">IELTS</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#404965] md:flex">
          <Link href="/" className="hover:text-[#3B5C37] transition-colors">Trang chủ</Link>
          <Link href="/speaking" className="hover:text-[#3B5C37] transition-colors">Speaking AI</Link>
          <Link href="/exam/review" className="text-[#3B5C37] font-black border-b-2 border-[#3B5C37] pb-1">Review Đáp án</Link>
          <a href="#" className="hover:text-[#3B5C37] transition-colors">Tài liệu Cam</a>
          <a href="#" className="hover:text-[#3B5C37] transition-colors">Hỗ trợ</a>
        </nav>

        {/* Auth / Avatar logic */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {isOfflineMode && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-700/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Offline Mode
            </span>
          )}

          {loading ? (
            <div className="w-8 h-8 border-2 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin" />
          ) : user ? (
            <>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(59, 92, 55,0.15)] hover:scale-105 transition-all outline-none border border-white/40 select-none relative group"
                aria-label="User menu"
              >
                <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 transition-all duration-300" />
                <span>
                  {(user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-12 w-64 rounded-2xl bg-white border border-slate-100 shadow-[0_16px_48px_rgba(15,23,56,0.1)] backdrop-blur-md p-4 animate-scale-in z-50 text-left">
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Đang đăng nhập</p>
                    <p className="text-xs font-black text-[#0d153a] truncate">
                      {user.user_metadata?.name || "Người dùng QualiCode"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#3B5C37] transition-all cursor-pointer border-none outline-none"
                    >
                      <User className="w-4 h-4 text-[#3B5C37]" />
                      <span>Thông tin tài khoản</span>
                    </button>

                    {user.user_metadata?.role === "ADMIN" && (
                      <Link
                        href="/admin/users"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#5e6792] hover:bg-slate-50 hover:text-[#B38F4D] transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#B38F4D]" />
                        <span>Trang Quản trị Admin</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none outline-none border-t border-slate-50 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/auth"
                className="rounded-xl border border-[#e7e9f1] bg-white/80 px-4.5 py-2 text-xs font-bold hover:bg-slate-50 transition-all text-[#0f1738]"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth"
                className="rounded-xl bg-[#3B5C37] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#2f4a2b] shadow-[0_4px_12px_rgba(59, 92, 55,0.25)] transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1160px] px-6 relative z-10 pt-3">
        
        {/* Breadcrumbs & Navigation Back */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-[#3B5C37] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>

          {/* Quick Skill Toggle */}
          <div className="bg-white/80 border border-slate-200 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-sm">
            <button
              onClick={() => {
                setReviewType("reading");
                setExpandedQuestionId(null);
                setActiveFilter("all");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none ${
                reviewType === "reading"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Reading Review</span>
            </button>
            <button
              onClick={() => {
                setReviewType("listening");
                setExpandedQuestionId(null);
                setActiveFilter("all");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none ${
                reviewType === "listening"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Listening Review</span>
            </button>
          </div>
        </div>

        {/* Dashboard Header Status Card */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_16px_36px_rgba(20,28,60,0.03)] border border-[#e8ebf3] mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#3B5C37]/5 to-transparent rounded-full pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                  Practice Exam Review
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-[#3B5C37]/10 text-[#3B5C37] rounded-lg">
                  {reviewType === "reading" ? "IELTS Academic Reading" : "IELTS Listening"}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#0f1738] mb-1.5 tracking-tight">
                {activeData.testTitle}
              </h1>
              <p className="text-xs text-slate-400 font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Ngày thực hiện: Hôm nay, {new Date().toLocaleDateString("vi-VN")}</span>
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-5 bg-gradient-to-tr from-slate-900 to-[#1b1c35] text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
              
              {/* Score Circular Gauge */}
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#2c2d4a" strokeWidth="7" />
                  <circle 
                    cx="50" cy="50" r="42" fill="none" 
                    stroke="#3B5C37" 
                    strokeWidth="7" 
                    strokeLinecap="round" 
                    strokeDasharray={`${(accuracy / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-white">{accuracy}%</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 tracking-wider block mb-0.5">KẾT QUẢ ĐẠT ĐƯỢC</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#3B5C37]">
                    {correctCount}/{totalQuestions}
                  </span>
                  <span className="text-[11px] text-slate-300 font-bold">Câu đúng</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Đánh giá quy đổi: <span className="text-emerald-400 font-extrabold">{reviewType === "reading" ? "Band 7.5" : "Band 7.0"}</span>
                </p>
              </div>

            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">ĐÚNG</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm font-black text-slate-700">{correctCount} câu</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">SAI</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm font-black text-slate-700">{incorrectCount} câu</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">THỜI GIAN LÀM BÀI</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-black text-slate-700">32 phút 15 giây</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">TỐC ĐỘ TRUNG BÌNH</span>
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-black text-slate-700">~ 48s / câu</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Split: Passage Panel (Left) & Question Panel (Right) */}
        <section className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* LEFT PANEL: Reading Passage or Listening Player + Transcript (7/12 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {reviewType === "reading" ? (
              // READING PASSAGE CONTAINER
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_32px_rgba(20,28,60,0.02)] border border-[#e8ebf3] max-h-[750px] overflow-y-auto sticky top-6">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#3B5C37]" />
                    <h2 className="text-md font-black text-[#0f1738] uppercase tracking-wide">Văn bản bài đọc</h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    4 Đoạn văn (A - D)
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#0d153a] mb-6 italic leading-snug">
                  {mockReadingReview.passageTitle}
                </h3>

                {/* Paragraphs */}
                <div className="space-y-6 text-[#404965] text-sm md:text-[15px] leading-relaxed">
                  {mockReadingReview.passageContent.map((paragraph) => {
                    // Check if paragraph is referenced in active expanded question
                    const isParagraphHighlighted = 
                      expandedQuestionId !== null && 
                      mockReadingReview.questions.find(q => q.id === expandedQuestionId)?.explanation.paragraphId === paragraph.id;

                    return (
                      <div 
                        key={paragraph.id} 
                        className={`p-4 rounded-2xl transition-all duration-300 border ${
                          isParagraphHighlighted 
                            ? "bg-amber-50/60 border-amber-200/80 shadow-sm translate-x-1" 
                            : "border-transparent"
                        }`}
                      >
                        <span className={`text-[11px] font-extrabold uppercase tracking-widest block mb-2 ${
                          isParagraphHighlighted ? "text-[#3B5C37]" : "text-slate-400"
                        }`}>
                          {paragraph.number} {isParagraphHighlighted && "— Manh mối chứa đáp án"}
                        </span>
                        
                        <p 
                          className="font-medium"
                          onMouseUp={handleTextSelection}
                        >
                          {renderTextWithHighlights(paragraph.text, savedWords.map(w => w.word), handleTriggerLookup)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // LISTENING AUDIO & TRANSCRIPT CONTAINER
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_32px_rgba(20,28,60,0.02)] border border-[#e8ebf3] sticky top-6">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-[#3B5C37]" />
                    <h2 className="text-md font-black text-[#0f1738] uppercase tracking-wide">Trình phát Audio & Transcript</h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    Section 1
                  </span>
                </div>

                {/* Audio player card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-full" />
                  
                  {/* Invisible Audio Element */}
                  <audio 
                    ref={audioNodeRef} 
                    src={mockListeningReview.audioUrl} 
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">MOCK AUDIO PLAYER</span>
                      <h4 className="text-xs font-bold text-[#3B5C37] truncate max-w-[280px]">
                        {mockListeningReview.audioTitle}
                      </h4>
                    </div>

                    {/* Speed Controls */}
                    <button 
                      onClick={handleSpeedChange}
                      className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-slate-800 hover:bg-slate-700 text-[#3B5C37] border border-slate-700/50 transition-colors select-none"
                    >
                      Tốc độ: {playbackRate}x
                    </button>
                  </div>

                  {/* Visualizer Mock */}
                  <div className="flex items-center justify-between gap-0.5 h-10 px-2 mb-4 bg-slate-950/40 rounded-xl overflow-hidden border border-slate-800">
                    {Array.from({ length: 44 }).map((_, i) => {
                      // Generate simulated bars fluctuating based on time/playing
                      const isBarActive = isPlaying && currentTime > 0;
                      const height = isBarActive 
                        ? `${Math.max(15, Math.min(95, Math.sin(currentTime * i) * 50 + 50))}%`
                        : `${Math.max(8, Math.sin(i) * 20 + 30)}%`;

                      return (
                        <div 
                          key={i} 
                          className={`w-[3px] rounded-full transition-all duration-300 ${
                            isBarActive ? "bg-[#3B5C37]" : "bg-slate-700"
                          }`}
                          style={{ height }}
                        />
                      );
                    })}
                  </div>

                  {/* Play & Slider Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full bg-[#3B5C37] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#2f4a2b] transition-colors shadow-sm outline-none cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span>{formatTime(currentTime)}</span>
                      <input 
                        type="range" 
                        min="0" 
                        max={duration || 100} 
                        value={currentTime} 
                        onChange={handleSliderChange}
                        className="flex-1 accent-[#3B5C37] h-1 bg-slate-700 rounded-lg cursor-pointer appearance-none outline-none" 
                      />
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Transcript Collapse Button */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bản Script hội thoại</h4>
                  <button 
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="text-xs font-bold text-[#3B5C37] hover:underline"
                  >
                    {showTranscript ? "Thu gọn bản dịch" : "Hiện bản dịch"}
                  </button>
                </div>

                {/* Collapsible Transcript content */}
                {showTranscript && (
                  <div className="border border-slate-100 rounded-2xl bg-slate-50 p-4 max-h-[380px] overflow-y-auto space-y-3.5">
                    {mockListeningReview.transcript.map((line, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200/50 transition-all cursor-pointer group"
                        onClick={() => handleJumpToTime(line.time)}
                      >
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded group-hover:bg-[#3B5C37]/10 group-hover:text-[#3B5C37] transition-colors mt-0.5 flex-shrink-0">
                          {line.time}
                        </span>
                        
                        <div className="text-xs">
                          <strong className="text-slate-800 font-extrabold block mb-0.5">
                            {line.speaker}:
                          </strong>
                          <p 
                            className="text-slate-600 leading-relaxed font-medium"
                            onMouseUp={handleTextSelection}
                          >
                            {renderTextWithHighlights(line.text, savedWords.map(w => w.word), handleTriggerLookup)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT PANEL: Question List & Explanations (5/12 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Filter Panel */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_32px_rgba(20,28,60,0.02)] border border-[#e8ebf3]">
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm đáp án hoặc lý giải..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#3B5C37] focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Tag filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "correct", label: "Đúng" },
                  { id: "incorrect", label: "Sai" },
                  { id: "TFNG", label: "True/False" },
                  { id: "MCQ", label: "Multiple Choice" },
                  { id: "FIB", label: "Điền ô trống" }
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setActiveFilter(tag.id);
                      setExpandedQuestionId(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide border transition-all cursor-pointer select-none ${
                      activeFilter === tag.id
                        ? "bg-[#3B5C37] border-[#3B5C37] text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Questions Listing */}
            <div className="space-y-4">
              
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Danh sách câu hỏi ({filteredQuestions.length})
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Click vào câu hỏi để xem lý giải
                </span>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-extrabold text-slate-500">Không tìm thấy câu hỏi phù hợp</p>
                  <p className="text-[10px] text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm để hiển thị lại dữ liệu.</p>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isExpanded = expandedQuestionId === q.id;
                  
                  return (
                    <div 
                      key={q.id}
                      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-[0_4px_24px_rgba(20,28,60,0.01)] ${
                        isExpanded 
                          ? "border-[#3B5C37] ring-1 ring-[#3B5C37]/30 shadow-md" 
                          : "border-[#e8ebf3] hover:border-slate-300"
                      }`}
                    >
                      {/* Header summary of question */}
                      <div 
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-5 flex items-start gap-4 cursor-pointer select-none"
                      >
                        
                        {/* Number Circle & Correct/Incorrect indicator */}
                        <div className="relative mt-0.5 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center border ${
                            q.isCorrect 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                              : "bg-rose-50 border-rose-200 text-rose-600"
                          }`}>
                            {q.number}
                          </div>
                          
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white ${
                            q.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                          }`}>
                            {q.isCorrect ? (
                              <Check className="w-2.5 h-2.5 stroke-[4]" />
                            ) : (
                              <X className="w-2.5 h-2.5 stroke-[4]" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                              {q.type === "TFNG" ? "True/False/Not Given" : q.type === "MCQ" ? "Multiple Choice" : "Điền từ"}
                            </span>
                            
                            {q.explanation.paragraphId !== "audio" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#e8ede6] text-[#3B5C37] rounded">
                                {q.explanation.paragraphId.replace("p", "Đoạn ")}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-[#0f1738] leading-relaxed pr-6">
                            {q.questionText}
                          </p>

                          {/* Answers summary comparison */}
                          <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block mb-0.5">BẠN ĐIỀN</span>
                              <span className={`font-black uppercase ${
                                q.isCorrect ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {q.userAnswer}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block mb-0.5">ĐÁP ÁN ĐÚNG</span>
                              <span className="text-slate-700 font-black uppercase">
                                {q.correctAnswer}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Chevron */}
                        <div className="flex-shrink-0 mt-2 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#3B5C37]" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>

                      </div>

                      {/* Expandable Explanation Area */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-[#fafbfe] p-5 space-y-4 animate-slide-down">
                          
                          {/* Dịch nghĩa */}
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                              Bản dịch câu hỏi
                            </span>
                            <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                              &ldquo; {q.explanation.translation} &rdquo;
                            </p>
                          </div>

                          {/* Manh mối (Clue highlighted) */}
                          <div className="p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl relative overflow-hidden">
                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block mb-1">
                              Manh mối trong bài
                            </span>
                            <p className="text-xs text-amber-900 font-bold leading-relaxed font-sans italic">
                              {q.explanation.clue}
                            </p>
                          </div>

                          {/* Lý giải chi tiết */}
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                              Lý giải chi tiết của AI
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {q.explanation.reasoning}
                            </p>
                          </div>

                          {/* Từ vựng nổi bật */}
                          {q.explanation.vocabulary && q.explanation.vocabulary.length > 0 && (
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                                Từ vựng nâng cấp / Key Vocabulary
                              </span>
                              <div className="space-y-2">
                                {q.explanation.vocabulary.map((vocab, vidx) => (
                                  <div 
                                    key={vidx} 
                                    onClick={() => handleTriggerLookup(vocab.word)}
                                    className="flex items-center justify-between gap-4 p-2 bg-white rounded-lg border border-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.01)] text-[11px] cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all"
                                    title="Click để tra từ Cambridge"
                                  >
                                    <div>
                                      <strong className="text-slate-800 font-extrabold">{vocab.word}</strong>
                                      <span className="text-[9px] text-slate-400 ml-1.5 italic">({vocab.type})</span>
                                    </div>
                                    <span className="text-[#3B5C37] font-bold text-right">
                                      {vocab.meaning}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })
              )}

            </div>

            {/* Offline Database Action Banner */}
            <div className="rounded-3xl p-5 bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full" />
              
              <h4 className="text-xs font-black mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                Luyện tập thêm đề thi Cambridge khác?
              </h4>
              <p className="text-[10px] text-white/80 leading-relaxed mb-4">
                Hệ thống của chúng tôi hỗ trợ trọn bộ đề từ Cam 9 đến Cam 20 với đầy đủ đáp án chi tiết và dịch câu hỏi tự động.
              </p>
              
              <Link 
                href="/speaking"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-slate-50 text-[11px] font-extrabold shadow-sm transition-all"
              >
                <span>Chuyển sang Speaking AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </section>

      </main>

      {/* Floating Cambridge lookup bubble */}
      {selectionCoords && selectedText && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerLookup(selectedText);
            setSelectedText("");
            setSelectionCoords(null);
          }}
          style={{
            position: "absolute",
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`,
            transform: "translateX(-50%)",
          }}
          className="selection-lookup-btn z-50 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 text-[10px] font-black cursor-pointer hover:bg-[#3B5C37] transition-all"
        >
          <Search className="w-3.5 h-3.5 text-[#B38F4D]" />
          <span>Tra từ Cambridge 🔍</span>
        </button>
      )}

      {/* Cambridge Dictionary sliding drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          <div className="relative w-full max-w-md bg-white h-full shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col z-10 border-l border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3B5C37] to-[#B38F4D] flex items-center justify-center text-white font-black text-sm">
                  C
                </div>
                <div>
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Từ điển học thuật</h3>
                  <h2 className="text-xs font-black text-[#0d153a] mt-1">Cambridge Dictionary</h2>
                </div>
              </div>
              
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {lookupLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-10 h-10 border-4 border-[#3B5C37]/30 border-t-[#3B5C37] rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-slate-400">Đang tìm kiếm trong Cambridge...</p>
                </div>
              ) : lookupEntries.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-extrabold text-slate-500">Không tìm thấy định nghĩa</p>
                  <p className="text-[10px] text-slate-400 mt-1">Vui lòng thử từ khác hoặc kiểm tra lại kết nối mạng.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Word Header */}
                  <div className="pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-black text-[#0d153a] tracking-tight truncate max-w-[280px]">{lookupWord}</h1>
                      
                      <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isFavorite 
                            ? "bg-amber-50 border-amber-200 text-amber-500 shadow-sm" 
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                        }`}
                        title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                      >
                        <svg 
                          className={`w-4 h-4 ${isFavorite ? "fill-amber-500 text-amber-500" : "text-slate-400"}`}
                          fill={isFavorite ? "currentColor" : "none"} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.242.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.773-.569-.373-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3">
                      {lookupEntries[0].ipaUk && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <span className="font-sans font-black text-[9px] uppercase px-1 bg-rose-50 text-rose-600 rounded">UK</span>
                          <span>{lookupEntries[0].ipaUk}</span>
                        </div>
                      )}
                      {lookupEntries[0].ipaUs && lookupEntries[0].ipaUs !== lookupEntries[0].ipaUk && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono border-l border-slate-200 pl-3">
                          <span className="font-sans font-black text-[9px] uppercase px-1 bg-sky-50 text-sky-600 rounded">US</span>
                          <span>{lookupEntries[0].ipaUs}</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => playPronunciation(lookupWord)}
                        className="w-7 h-7 rounded-lg bg-[#3B5C37]/10 hover:bg-[#3B5C37]/20 text-[#3B5C37] flex items-center justify-center transition-colors border-none cursor-pointer outline-none"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Definitions List */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Định nghĩa & Bản dịch</h4>
                    
                    {lookupEntries.map((entry, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
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
                        
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed">
                            {entry.definition}
                          </p>
                          <p className="text-xs font-black text-[#3B5C37] mt-1.5">
                            {entry.translation}
                          </p>
                        </div>
                        
                        {entry.exampleSentence && (
                          <div className="border-t border-slate-200/50 pt-2.5 mt-2.5">
                            <span className="text-[9px] font-bold text-slate-400 block mb-1">VÍ DỤ</span>
                            <p className="text-xs text-slate-600 font-medium font-serif leading-relaxed italic">
                              &ldquo;{entry.exampleSentence}&rdquo;
                            </p>
                            {entry.exampleTranslation && (
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                {entry.exampleTranslation}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleSaveVocabulary(entry)}
                          className="w-full mt-3 py-2 bg-[#3B5C37] hover:bg-[#2d472a] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <span>Lưu định nghĩa này</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Save Form settings */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tùy chọn Lưu trữ</h4>
                    
                    {/* Collections dropdown */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Bộ sưu tập (Bộ từ)
                      </label>
                      <select 
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3B5C37] focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="">-- Chưa phân loại --</option>
                        {collections.map(col => (
                          <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Ghi chú cá nhân
                      </label>
                      <textarea
                        value={vocabNote}
                        onChange={(e) => setVocabNote(e.target.value)}
                        placeholder="Ghi chú ý nghĩa, cách dùng hoặc collocation đi kèm..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#3B5C37] focus:bg-white transition-all h-20 resize-none"
                      />
                    </div>
                    
                    {/* Toast Status */}
                    {saveStatus === "saving" && (
                      <p className="text-[11px] font-bold text-slate-500 animate-pulse">Đang lưu từ vựng...</p>
                    )}
                    {saveStatus === "success" && (
                      <p className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                        ✓ Đã cập nhật vào bộ sưu tập cá nhân!
                      </p>
                    )}
                    {saveStatus === "error" && (
                      <p className="text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                        ❌ Đã xảy ra lỗi khi lưu từ vựng.
                      </p>
                    )}
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

export default function ExamReview() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="relative w-14 h-14 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-[#3B5C37] animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-400">Đang tải giao diện review đáp án...</p>
      </div>
    }>
      <ExamReviewContent />
    </Suspense>
  );
}
