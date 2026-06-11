"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowLeft, Sparkles, Newspaper, Mail, CheckCircle2, AlertCircle, X, Plus, Trash2, Link2, ImageIcon, ExternalLink, Check, Pencil, FolderOpen, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
  id: string;
  sourceId: string;
  category: string;
  categoryVi: string;
  title: string;
  titleVi: string;
  excerpt: string;
  excerptVi: string;
  image: string;
  author: string;
  readTime: string;
  content: { en: string; vi: string }[];
  fromDb?: boolean;
  sourceUrl?: string;
  sourceLabel?: string;
}

interface AddForm {
  title: string;
  title_vi: string;
  category: string;
  category_vi: string;
  excerpt: string;
  excerpt_vi: string;
  image_url: string;
  author: string;
  read_time: string;
  en_full: string;
  vi_full: string;
  source_url?: string;
  source_label?: string;
}

const EMPTY_FORM: AddForm = {
  title: "", title_vi: "", category: "", category_vi: "",
  excerpt: "", excerpt_vi: "", image_url: "", author: "", read_time: "",
  en_full: "", vi_full: "", source_url: "", source_label: "",
};

function mapDbArticle(item: Record<string, unknown>): Article {
  return {
    id: item.id as string,
    sourceId: item.source_id as string,
    category: item.category as string,
    categoryVi: item.category_vi as string,
    title: item.title as string,
    titleVi: item.title_vi as string,
    excerpt: (item.excerpt as string) || "",
    excerptVi: (item.excerpt_vi as string) || "",
    image: (item.image_url as string) || "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=1200&q=80",
    author: (item.author as string) || "TID Editor",
    readTime: (item.read_time as string) || "10 mins",
    content: Array.isArray(item.content) ? (item.content as { en: string; vi: string }[]) : [],
    fromDb: true,
    sourceUrl: (item.source_url as string) || undefined,
    sourceLabel: (item.source_label as string) || undefined,
  };
}

type TokenNode = { type: 'text' | 'bold' | 'italic' | 'img', content: string };

function parseRichText(text: string): TokenNode[] {
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[IMG:.*?\])/g;
  const parts = text.split(regex);
  return parts.map((part): TokenNode => {
    if (part.startsWith('**') && part.endsWith('**')) return { type: 'bold', content: part.slice(2, -2) };
    if (part.startsWith('*') && part.endsWith('*')) return { type: 'italic', content: part.slice(1, -1) };
    if (part.startsWith('[IMG:') && part.endsWith(']')) return { type: 'img', content: part.slice(5, -1) };
    return { type: 'text', content: part };
  }).filter(p => p.content.length > 0);
}

function getSentenceContaining(text: string, word: string): string {
  const clean = word.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase();
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.find(s => s.toLowerCase().includes(clean))?.trim() || '';
}

function getFormattedWords(text: string, paraIdx: number) {
  const nodes = parseRichText(text);
  let wordIdx = 0;
  const words: { id: string, t: string, format: string, isImg?: boolean, url?: string }[] = [];
  
  nodes.forEach((node) => {
    if (node.type === 'img') {
      words.push({ id: `img-${paraIdx}-${words.length}`, t: '', format: 'img', isImg: true, url: node.content });
    } else {
      const tokens = node.content.match(/\S+/g) || [];
      tokens.forEach(t => {
        words.push({ id: `${paraIdx}.${wordIdx++}`, t, format: node.type });
      });
    }
  });
  return words;
}

function renderViFormattedText(text: string) {
  const nodes = parseRichText(text);
  return nodes.map((node, i) => {
    if (node.type === 'img') return <img key={i} src={node.content} className="max-w-full rounded-lg my-3" alt="" />;
    if (node.type === 'bold') return <strong key={i}>{node.content}</strong>;
    if (node.type === 'italic') return <em key={i}>{node.content}</em>;
    return <React.Fragment key={i}>{node.content}</React.Fragment>;
  });
}

function parseManualGlosses(text: string): { cleanText: string; manualMap: Record<number, string> } {
  const regex = /\[(.*?)\]\{(.*?)\}/g;
  let cleanText = "";
  const manualMap: Record<number, string> = {};
  
  let lastIndex = 0;
  let currentWordCount = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    cleanText += before;
    currentWordCount += (before.match(/\S+/g) || []).length;
    
    const enPhrase = match[1];
    const viMeaning = match[2];
    
    cleanText += enPhrase;
    const phraseWords = (enPhrase.match(/\S+/g) || []).length;
    
    for (let i = 0; i < phraseWords; i++) {
      manualMap[currentWordCount + i] = viMeaning.trim();
    }
    
    currentWordCount += phraseWords;
    lastIndex = regex.lastIndex;
  }
  
  cleanText += text.slice(lastIndex);
  
  return { cleanText, manualMap };
}


const READER_FONTS = [
  { name: "Fraunces", stack: "'Fraunces', Georgia, serif" },
  { name: "Lora", stack: "'Lora', Georgia, serif" },
  { name: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { name: "Playfair Display", stack: "'Playfair Display', Georgia, serif" },
  { name: "Crimson Pro", stack: "'Crimson Pro', Georgia, serif" },
  { name: "EB Garamond", stack: "'EB Garamond', Georgia, serif" },
  { name: "Libre Caslon", stack: "'Libre Caslon Text', Georgia, serif" },
  { name: "Newsreader", stack: "'Newsreader', Georgia, serif" },
  { name: "Roboto Serif", stack: "'Roboto Serif', Georgia, serif" },
  { name: "DM Serif Display", stack: "'DM Serif Display', Georgia, serif" },
  { name: "Spectral", stack: "'Spectral', Georgia, serif" },
  { name: "IBM Plex Serif", stack: "'IBM Plex Serif', Georgia, serif" },
  { name: "Bitter", stack: "'Bitter', Georgia, serif" },
  { name: "Inter (sans)", stack: "'Inter', system-ui, sans-serif" },
  { name: "Source Sans (sans)", stack: "'Source Sans 3', system-ui, sans-serif" },
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Pro:ital,wght@0,400;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Newsreader:ital,wght@0,400;1,400&family=Roboto+Serif:ital,wght@0,400;0,700;1,400&family=DM+Serif+Display:ital@0;1&family=Spectral:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Serif:ital,wght@0,400;0,700;1,400&family=Bitter:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:ital,wght@0,400;0,700;1,400&display=swap";

const CARDS = [
  {
    id: "the-atlantic",
    name: "The Atlantic",
    logoText: "The Atlantic",
    logoFont: "font-serif italic text-3xl",
    image: "/assets/bilingual/atlantic.png",
    tagline: "Văn phong học thuật, lập luận sắc bén & đa chiều",
    difficulty: "Hard (7.0+)",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    id: "the-new-york-times",
    name: "The New York Times",
    logoText: "The New York Times",
    logoFont: "text-[26px]",
    image: "/assets/bilingual/nytimes.png",
    customStyle: { fontFamily: "'Chomsky', 'Old English Text MT', serif" },
    tagline: "Văn hoá, xã hội & phong cách nghị luận chuẩn mực",
    difficulty: "Medium-Hard (6.5+)",
    badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/20"
  },
  {
    id: "reuters",
    name: "Reuters",
    logoText: "REUTERS",
    logoFont: "font-sans font-black tracking-widest text-[#404040] text-xl",
    image: "/assets/bilingual/reuters.png",
    logoPrefix: (
      <svg width="28" height="28" viewBox="0 0 40 40" className="mr-2.5 shrink-0">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#f26522" strokeWidth="4" strokeDasharray="3.5 5" />
      </svg>
    ),
    tagline: "Tin tức chính xác, khách quan & thời sự toàn cầu",
    difficulty: "Medium (5.5 - 6.5)",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "substack",
    name: "Substack",
    logoText: "Substack",
    logoFont: "font-serif font-bold text-2xl tracking-tight text-black",
    image: "/assets/bilingual/substack.png",
    logoPrefix: (
      <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2 shrink-0" fill="#FF6719">
        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM22.539 12.086H1.46v2.836h21.08v-2.836zM22.539 15.93H1.46v6.59l10.54-5.885 10.54 5.885v-6.59zM1.46 1.564h21.08v2.836H1.46V1.564z" />
      </svg>
    ),
    tagline: "Blog cá nhân chất lượng, văn phong tự nhiên đời thường",
    difficulty: "Easy-Medium (5.0 - 6.0)",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    isRecommended: true
  },
  {
    id: "economist",
    name: "The Economist",
    logoText: "The Economist",
    logoFont: "font-serif font-black text-white bg-[#e3120b] px-3 py-1.5 tracking-tight text-[22px]",
    image: "/assets/bilingual/economist.png",
    tagline: "Kinh tế vĩ mô, tài chính toàn cầu & chính trị học thuật",
    difficulty: "Very Hard (7.5+)",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20"
  },
  {
    id: "guardian",
    name: "The Guardian",
    logoText: "The Guardian",
    logoFont: "font-serif font-black tracking-tighter leading-none text-3xl text-[#052962]",
    image: "/assets/bilingual/guardian.png",
    tagline: "Quan điểm tự do, bình luận xã hội & môi trường sâu sắc",
    difficulty: "Medium-Hard (6.5+)",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
];

const MOCK_ARTICLES: Record<string, Article[]> = {
  "the-atlantic": [
    {
      id: "ta-1",
      sourceId: "the-atlantic",
      category: "Essay / Philosophy",
      categoryVi: "Luận văn / Triết học",
      title: "Flickering Enlightenment",
      titleVi: "Ánh sáng lung linh của sự Khai sáng",
      excerpt: "Attacked by the Left and Right, the Enlightenment can only be saved through use of its greatest legacy: permanent critique.",
      excerptVi: "Bị tấn công từ cả cánh tả lẫn cánh hữu, sự Khai sáng chỉ có thể được cứu rỗi bằng cách sử dụng di sản vĩ đại nhất của nó: sự phê phán không ngừng.",
      image: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=1200&q=80",
      author: "Alvina Hoffmann",
      readTime: "15 mins",
      content: [
        {
          en: "The Enlightenment is often described as a single, coherent project that championed reason, science, and individual liberty. Today, however, it is under assault from multiple political directions. Critics from the left argue that the Enlightenment was a Eurocentric ideology that masked colonialism and inequality. Meanwhile, critics from the right blame it for eroding traditional values and social cohesion.",
          vi: "Kỷ Khai sáng thường được mô tả như một dự án duy nhất, nhất quán nhằm bảo vệ lý trí, khoa học và tự do cá nhân. Tuy nhiên, ngày nay, nó đang bị tấn công từ nhiều hướng chính trị khác nhau. Các nhà phê bình từ cánh tả cho rằng Khai sáng là một hệ tư tưởng lấy châu Âu làm trung tâm, che đậy chủ nghĩa thực dân và sự bất bình đẳng. Trong khi đó, các nhà phê bình từ cánh hữu đổ lỗi cho nó vì đã làm xói mòn các giá trị truyền thống và sự gắn kết xã hội."
        },
        {
          en: "But to reduce the Enlightenment to a static set of dogmas is to misunderstand its core character. The true legacy of the Enlightenment does not lie in a final set of truths, but in a method: the practice of permanent critique. It is the willingness to submit all ideas, including one's own assumptions, to rigorous questioning and rational debate.",
          vi: "Nhưng giảm bớt Khai sáng thành một tập hợp các giáo điều tĩnh là hiểu sai tính chất cốt lõi của nó. Di sản thực sự của Khai sáng không nằm ở một tập hợp chân lý cuối cùng, mà ở một phương pháp: thực hành sự phê phán không ngừng. Đó là sự sẵn sàng đưa mọi ý tưởng, bao gồm cả các giả định của chính mình, vào sự chất vấn nghiêm ngặt và tranh luận hợp lý."
        },
        {
          en: "In a world increasingly polarized by dogmatic beliefs, reclaiming this critical method is more urgent than ever. We must recognize that the Enlightenment is not a museum piece to be defended blindly, but a dynamic, self-correcting process that requires our active participation and critical engagement.",
          vi: "Trong một thế giới ngày càng bị chia rẽ bởi các niềm tin giáo điều, việc giành lại phương pháp phê phán này trở nên cấp bách hơn bao giờ hết. Chúng ta phải nhận ra rằng Khai sáng không phải là một hiện vật bảo tàng cần được bảo vệ một cách mù quáng, mà là một quy trình năng động, tự sửa đổi đòi hỏi sự tham gia tích cực và dấn thân phê phán của chúng ta."
        }
      ]
    },
    {
      id: "ta-2",
      sourceId: "the-atlantic",
      category: "Essay / Psychology",
      categoryVi: "Luận văn / Tâm lý học",
      title: "The Quiet Power of Introverts in a Loud World",
      titleVi: "Sức mạnh thầm lặng của người hướng nội trong thế giới ồn ào",
      excerpt: "Why modern society's obsession with extroversion is holding back brilliant thinkers and creative leaders.",
      excerptVi: "Tại sao sự ám ảnh của xã hội hiện đại đối với tính hướng ngoại đang kiềm hãm những nhà tư duy kiệt xuất và nhà lãnh đạo sáng tạo.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
      author: "Susan Cain",
      readTime: "12 mins",
      content: [
        {
          en: "Modern culture is designed almost exclusively for extroverts. We praise open-plan offices, team brainstorming sessions, and charismatic self-promotion. From an early age, children are encouraged to be outgoing, and quiet contemplation is often viewed as a social deficit rather than a strength.",
          vi: "Văn hóa hiện đại hầu như được thiết kế riêng cho người hướng ngoại. Chúng ta ca ngợi văn phòng không vách ngăn, các buổi động não nhóm và việc tự quảng bá đầy lôi cuốn. Từ khi còn nhỏ, trẻ em đã được khuyến khích hướng ngoại, và việc suy ngẫm lặng lẽ thường bị xem là một thiếu hụt xã hội thay vì là một điểm mạnh."
        },
        {
          en: "However, research shows that some of the greatest breakthroughs in history were made by individuals who preferred solitude. Extroverts may dominate discussions, but introverts excel at deep focus, analytical thinking, and deliberate practice. Without introverts, we wouldn't have the theory of relativity or the personal computer.",
          vi: "Tuy nhiên, nghiên cứu chỉ ra rằng một số đột phá vĩ đại nhất trong lịch sử được thực hiện bởi những cá nhân yêu thích sự cô độc. Người hướng ngoại có thể thống trị các cuộc thảo luận, nhưng người hướng nội lại xuất sắc trong việc tập trung sâu, tư duy phân tích và luyện tập có chủ đích. Nếu không có người hướng nội, chúng xuất sắc trong việc tập trung sâu, tư duy phân tích và luyện tập có chủ đích. Nếu không có người hướng nội, chúng ta sẽ không có thuyết tương đối hay máy tính cá nhân."
        }
      ]
    }
  ]
};

const DEFAULT_MOCK_ARTICLES: Article[] = [
  {
    id: "def-1",
    sourceId: "default",
    category: "Essay / Science",
    categoryVi: "Luận văn / Khoa học",
    title: "Can Ecosystems Malfunction?",
    titleVi: "Hệ sinh thái có thể bị trục trặc không?",
    excerpt: "We are told the natural world is breaking down. But forests don't work like airplanes or human hearts.",
    excerptVi: "Chúng ta được bảo rằng thế giới tự nhiên đang sụp đổ. Nhưng những cánh rừng không hoạt động giống như máy bay hay trái tim con người.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    author: "John Drake",
    readTime: "9 mins",
    content: [
      {
        en: "Ecosystems are constantly changing and adapting to new environmental conditions. Unlike mechanical systems, they do not have a defined blueprint or optimal operating state. What we perceive as a malfunction is often a natural phase of ecological succession.",
        vi: "Các hệ sinh thái không ngừng thay đổi và thích nghi với các điều kiện môi trường mới. Không giống như các hệ thống cơ học, chúng không có một thiết kế xác định hoặc trạng thái hoạt động tối ưu. Những gì chúng ta coi là sự trục trặc thường là một giai đoạn tự nhiên của diễn thế sinh thái."
      }
    ]
  }
];

function SongNguBaoPageInner({ defaultPublisherId }: { defaultPublisherId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCard, setSelectedCard] = useState<typeof CARDS[0] | null>(
    () => CARDS.find(c => c.id === defaultPublisherId) || null
  );
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<any>(null);

  // Holds the ?a= article ID while dbArticles is still loading
  const pendingArticleIdRef = useRef<string | null>(null);

  // Admin
  const [isAdmin, setIsAdmin] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(EMPTY_FORM);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscription Modal states
  const [showSubModal, setShowSubModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Reader settings — activeFont stores the full CSS font-family stack
  const [activeFont, setActiveFont] = useState(READER_FONTS[0].stack);
  const [fontSize, setFontSize] = useState(17);
  const [readerDark, setReaderDark] = useState(false);

  // Word-level hover/pin (token IDs like "paraIdx.wordIdx")
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
  const [pinnedTokenId, setPinnedTokenId] = useState<string | null>(null);

  // Auto-translate state for the add-article modal
  const [translatingFull, setTranslatingFull] = useState(false);

  // Vocabulary alignment: vocabMaps[paraIdx] = { "en_word": "vi phrase" }
  // glossMaps[paraIdx][wordIdx] = Vietnamese gloss for that EN word
  const [glossMaps, setGlossMaps] = useState<Array<Array<string | null>> | null>(null);
  // gloss stores a stable snapshot — position is captured once on mouseenter/click and never recalculated
  const [gloss, setGloss] = useState<{ text: string; x: number; y: number; word: string; sentence?: string; pinned?: boolean; saved?: boolean; error?: boolean; duplicate?: boolean } | null>(null);
  const [pendingDuplicateVocab, setPendingDuplicateVocab] = useState<{ word: string; definition: string; folderId: string | null; sentence?: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Ref for debounced mouseLeave timer to prevent flicker
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [savedVocabList, setSavedVocabList] = useState<{id: string; word: string; definition: string}[]>([]);
  const [showVocabPanel, setShowVocabPanel] = useState(false);
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);
  const [editingVocabDef, setEditingVocabDef] = useState("");

  const [showUrlSuggestModal, setShowUrlSuggestModal] = useState(false);
  const [urlSuggestInput, setUrlSuggestInput] = useState("");
  const [urlSuggestDone, setUrlSuggestDone] = useState(false);

  // Folder picker for vocab save
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderPickerPos, setFolderPickerPos] = useState({ x: 0, y: 0 });
  const [pendingVocab, setPendingVocab] = useState<{ word: string; definition: string; sentence?: string } | null>(null);

  // Draggable split divider
  const [splitFraction, setSplitFraction] = useState(0.5);
  const draggingRef = useRef(false);
  const readerRef = useRef<HTMLDivElement>(null);

  // Paste Custom Article States
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [customCategoryEn, setCustomCategoryEn] = useState("Technology");
  const [customCategoryVi, setCustomCategoryVi] = useState("Công nghệ");
  const [customContentEn, setCustomContentEn] = useState("");
  const [customContentVi, setCustomContentVi] = useState("");
  const [pasteSourceUrl, setPasteSourceUrl] = useState("");
  const [pasteTranslating, setPasteTranslating] = useState(false);

  // Pagination for article grid
  const [articlePage, setArticlePage] = useState(0);
  const ARTICLES_PER_PAGE = 12;

  // Saved articles (bookmark feature)
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch(`/api/bilingual-articles?source=${defaultPublisherId}`);
        if (!res.ok) throw new Error(`Failed to load articles: ${res.statusText}`);
        const { articles, error } = await res.json();
        if (error) throw new Error(error);
        if (articles && articles.length > 0) setDbArticles(articles.map(mapDbArticle));
      } catch (err: any) {
        console.error("Error fetching database articles:", err.message || err);
      }
    }
    loadArticles();
  }, [defaultPublisherId]);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data?.role === "super_admin" || data?.role === "content_editor") setIsAdmin(true);
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Load saved article IDs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tid_saved_articles");
      if (raw) setSavedArticleIds(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
  }, []);

  // Reset pagination when newspaper changes
  useEffect(() => {
    setArticlePage(0);
    setShowSavedOnly(false);
    setSortOrder("newest");
  }, [selectedCard?.id]);

  // ── URL hydration ────────────────────────────────────────────────────────
  // Phase 1: runs once on mount — reads ?s= and ?a= from URL
  useEffect(() => {
    const s = defaultPublisherId;
    const a = searchParams.get('a');
    if (!s) return;
    const card = CARDS.find(c => c.id === s);
    if (!card) return;
    setSelectedCard(card);
    if (!a) return;
    // Try mock articles immediately (always available)
    const mockArticles = MOCK_ARTICLES[s] || DEFAULT_MOCK_ARTICLES;
    const fromMock = mockArticles.find(art => art.id === a);
    if (fromMock) { setActiveArticle(fromMock); window.scrollTo(0, 0); return; }
    // DB articles not yet loaded — stash the pending ID
    pendingArticleIdRef.current = a;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 2: once dbArticles loads, resolve any pending ?a= article ID
  useEffect(() => {
    if (!pendingArticleIdRef.current || dbArticles.length === 0) return;
    const found = dbArticles.find(a => a.id === pendingArticleIdRef.current);
    if (found) {
      setActiveArticle(found);
      pendingArticleIdRef.current = null;
      window.scrollTo(0, 0);
    }
  }, [dbArticles]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  // Source card → article list
  const navigateToSource = useCallback((card: typeof CARDS[0]) => {
    setSelectedCard(card);
    router.push(`/reading/bilingual/${card.id}`, { scroll: false });
    window.scrollTo(0, 0);
  }, [router]);

  // Article card / hero → bilingual reader
  const navigateToArticle = useCallback((article: Article) => {
    setActiveArticle(article);
    // Custom-pasted articles have no stable ID — keep them state-only
    const isCustom = article.id.startsWith('custom-');
    if (!isCustom && article.sourceId) {
      router.push(`/reading/bilingual/${article.sourceId}?a=${article.id}`, { scroll: false });
    }
    window.scrollTo(0, 0);
  }, [router]);

  // Reader "back" → source detail
  const navigateBackToSource = useCallback(() => {
    setActiveArticle(null);
    if (selectedCard) router.push(`/reading/bilingual/${selectedCard.id}`, { scroll: false });
    window.scrollTo(0, 0);
  }, [router, selectedCard]);

  // Source detail "back" → portal home
  const navigateBackToPortal = useCallback(() => {
    setSelectedCard(null);
    setActiveArticle(null);
    router.push('/reading/bilingual', { scroll: false });
    window.scrollTo(0, 0);
  }, [router]);

  useEffect(() => {
    if (!activeArticle || !user) { setSavedVocabList([]); return; }
    supabase.from("user_notebook")
      .select("id, word, definition")
      .eq("source", "bilingual-reader")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { if (data) setSavedVocabList(data); });
  }, [activeArticle?.id, user?.id]);

  useEffect(() => {
    if (!user) { setFolders([]); return; }
    supabase.from("notebook_folders")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setFolders(data); });
  }, [user?.id]);

  // Word gloss alignment — one API call per paragraph, cached in sessionStorage.
  // Returns position-indexed glosses: glossMaps[para][wordIdx] = "vietnamese meaning".
  useEffect(() => {
    if (!activeArticle) { setGlossMaps(null); return; }
    const cacheKey = `gloss_v3_${activeArticle.id}`;

    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) { setGlossMaps(JSON.parse(hit)); return; }
    } catch { /* ignore */ }

    const content = activeArticle.content;
    setGlossMaps(null);
    let cancelled = false;

    // Align sentence-by-sentence for higher accuracy (model handles ~15 words better than 150+)
    Promise.all(
      content.map(async (para) => {
        const enSentences = para.en.split(/(?<=[.!?])\s+/).filter(Boolean);
        const viSentences = para.vi.split(/(?<=[.!?。])\s+/).filter(Boolean);

        const sentGlosses = await Promise.all(
          enSentences.map(async (enSent, sIdx) => {
            const viSent = viSentences[Math.min(sIdx, viSentences.length - 1)] || "";
            try {
              const res = await fetch("/api/bilingual-align", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paragraphs: [{ en: enSent, vi: viSent }] }),
              });
              const data = await res.json();
              return Array.isArray(data.glosses) ? data.glosses as (string | null)[] : [];
            } catch {
              return [] as (string | null)[];
            }
          })
        );

        return sentGlosses.flat();
      })
    ).then(results => {
      if (cancelled) return;
      setGlossMaps(results);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(results)); } catch { /* quota */ }
    });

    return () => { cancelled = true; };
  }, [activeArticle?.id]);

  // Lazy-load all reader fonts the first time the reader opens
  useEffect(() => {
    if (!activeArticle) return;
    const id = "bilingual-reader-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, [activeArticle]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !selectedCard) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/book-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_title: `Báo song ngữ: ${selectedCard.name}`,
          user_email: email,
        }),
      });

      if (!res.ok) throw new Error("Có lỗi xảy ra");
      setSubmitStatus("success");
      setEmail("");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Chỉ nhận file ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Ảnh quá lớn (max 5MB)"); return; }
    setUploadingImage(true); setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setAddForm(f => ({ ...f, image_url: url }));
    } catch { setUploadError("Lỗi upload ảnh, thử lại"); }
    finally { setUploadingImage(false); }
  }, []);

  const handleModalPaste = useCallback((e: React.ClipboardEvent) => {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { uploadImage(file); e.preventDefault(); return; }
      }
    }
  }, [uploadImage]);

  const autoTranslateFull = useCallback(async () => {
    if (!addForm.en_full.trim()) return;
    setTranslatingFull(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: addForm.en_full }),
      });
      const { translated } = await res.json();
      if (translated) setAddForm(f => ({ ...f, vi_full: translated }));
    } catch {
      // silent fail
    } finally {
      setTranslatingFull(false);
    }
  }, [addForm.en_full]);


  const handleEditArticleClick = (article: Article) => {
    const en_full = article.content.map(c => c.en).join("\n\n");
    const vi_full = article.content.map(c => c.vi).join("\n\n");
    setAddForm({
      title: article.title,
      title_vi: article.titleVi,
      category: article.category,
      category_vi: article.categoryVi,
      excerpt: article.excerpt,
      excerpt_vi: article.excerptVi,
      image_url: article.image,
      author: article.author,
      read_time: article.readTime,
      en_full,
      vi_full,
      source_url: article.sourceUrl || "",
      source_label: article.sourceLabel || "",
    });
    setEditingArticleId(article.id);
    setShowAddModal(true);
  };

  const handleSaveArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    setSavingArticle(true); setSaveError(null);
    try {
      const enParas = addForm.en_full.split(/\n\s*\n/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
      const viParas = addForm.vi_full.split(/\n\s*\n/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
      const count = Math.max(enParas.length, viParas.length);
      const content = Array.from({ length: count }, (_, i) => ({ en: enParas[i] || "", vi: viParas[i] || "" }));
      
      const url = editingArticleId ? `/api/bilingual-articles?id=${editingArticleId}` : "/api/bilingual-articles";
      const method = editingArticleId ? "PATCH" : "POST";
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          source_id: selectedCard.id,
          title: addForm.title, title_vi: addForm.title_vi,
          category: addForm.category, category_vi: addForm.category_vi,
          excerpt: addForm.excerpt, excerpt_vi: addForm.excerpt_vi,
          image_url: addForm.image_url, author: addForm.author,
          read_time: addForm.read_time, source_url: addForm.source_url || null, source_label: addForm.source_label || null, content,
        }),
      });

      if (!res.ok) { const { error } = await res.json(); throw new Error(error || "Lỗi lưu bài"); }
      const { article: saved } = await res.json();
      
      if (editingArticleId) {
        setDbArticles(prev => prev.map(a => a.id === editingArticleId ? mapDbArticle(saved as Record<string, unknown>) : a));
      } else {
        setDbArticles(prev => [mapDbArticle(saved as Record<string, unknown>), ...prev]);
      }
      
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
      setEditingArticleId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally { setSavingArticle(false); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Xoá bài viết này?")) return;
    setDeletingId(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";

      const res = await fetch(`/api/bilingual-articles?id=${id}`, { 
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error();
      setDbArticles(prev => prev.filter(a => a.id !== id));
      if (activeArticle?.id === id) setActiveArticle(null);
    } catch { alert("Xoá thất bại"); }
    finally { setDeletingId(null); }
  };


  const handleDichTaoBai = async () => {
    if (!customContentEn.trim() || pasteTranslating) return;
    setPasteTranslating(true);

    // Split by blank lines into paragraphs
    const enParagraphs = customContentEn
      .split(/\n\s*\n/)
      .map(p => p.replace(/\n/g, " ").trim())
      .filter(Boolean);

    if (enParagraphs.length === 0) { setPasteTranslating(false); return; }

    // Translate all paragraphs in parallel
    const viParagraphs = await Promise.all(enParagraphs.map(async para => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: para }),
        });
        const { translated } = await res.json();
        return (translated as string) || para;
      } catch { return para; }
    }));

    // Auto-translate title from first sentence (up to 120 chars)
    const firstSentence = enParagraphs[0].split(/(?<=[.!?])\s/)[0].slice(0, 120);
    let titleVi = viParagraphs[0].split(/(?<=[.!?])\s/)[0].slice(0, 120);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: firstSentence }),
      });
      const { translated } = await res.json();
      if (translated) titleVi = translated as string;
    } catch { /* keep auto-extracted */ }

    const wordCount = enParagraphs.join(" ").split(/\s+/).length;
    const customArticle: Article = {
      id: `custom-${Date.now()}`,
      sourceId: selectedCard ? selectedCard.id : "custom",
      category: customCategoryEn,
      categoryVi: customCategoryVi,
      title: firstSentence,
      titleVi,
      excerpt: enParagraphs[0]?.slice(0, 150) || "",
      excerptVi: viParagraphs[0]?.slice(0, 150) || "",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      author: pasteSourceUrl ? new URL(pasteSourceUrl.startsWith("http") ? pasteSourceUrl : `https://${pasteSourceUrl}`).hostname.replace("www.", "") : "Tự tạo",
      readTime: `${Math.ceil(wordCount / 200)} mins`,
      content: enParagraphs.map((en, i) => ({ en, vi: viParagraphs[i] || "" })),
    };

    setActiveArticle(customArticle);
    setShowPasteModal(false);
    setCustomContentEn("");
    setPasteSourceUrl("");
    setPasteTranslating(false);
    window.scrollTo(0, 0);
  };

  // Toggle bookmark for an article — persists to localStorage + Supabase
  const toggleSaveArticle = useCallback(async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(savedArticleIds);
    const isSaved = next.has(article.id);
    if (isSaved) next.delete(article.id); else next.add(article.id);
    setSavedArticleIds(next);
    try { localStorage.setItem("tid_saved_articles", JSON.stringify([...next])); } catch { /* quota */ }
    if (user) {
      if (isSaved) {
        await supabase.from("user_saved_articles").delete().match({ user_id: user.id, article_id: article.id });
      } else {
        await supabase.from("user_saved_articles").upsert({ user_id: user.id, article_id: article.id, source_id: article.sourceId, saved_at: new Date().toISOString() });
      }
    }
  }, [savedArticleIds, user]);

  const getArticles = (sourceId: string): Article[] => {
    const fromDb = dbArticles.filter(a => a.sourceId === sourceId);
    if (fromDb.length > 0) return fromDb;
    return MOCK_ARTICLES[sourceId] || DEFAULT_MOCK_ARTICLES;
  };

  const doInsertVocab = async (word: string, definition: string, folderId: string | null, currentUser: any, example?: string) => {
    const { data, error } = await supabase.from("user_notebook").insert({
      user_id: currentUser.id,
      word: word.toLowerCase(),
      definition,
      example: example || null,
      source: "bilingual-reader",
      folder_id: folderId || null,
    }).select("id").single();

    if (error) throw error;

    if (data) {
      setSavedVocabList(prev => [{ id: data.id, word, definition }, ...prev]);
      setShowFolderPicker(false);
      setPendingVocab(null);
      setPendingDuplicateVocab(null);
      setGloss(g => g ? { ...g, saved: true, error: false, duplicate: false } : null);
      setTimeout(() => {
        setGloss(g => g ? { ...g, saved: false } : null);
      }, 1500);
    }
  };

  const handleSaveVocab = async (word: string, definition: string, folderId: string | null, sentence?: string) => {
    if (!word || !definition) return;

    let currentUser = user;
    if (!currentUser) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      if (!fetchedUser) return;
      currentUser = fetchedUser;
      setUser(fetchedUser);
    }

    // Check for duplicate in local list or DB
    const localDup = savedVocabList.some(v => v.word.toLowerCase() === word.toLowerCase());
    if (!localDup) {
      const { data: dbExisting } = await supabase
        .from("user_notebook")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("word", word.toLowerCase())
        .maybeSingle();
      if (dbExisting) {
        setPendingDuplicateVocab({ word, definition, folderId, sentence });
        setShowFolderPicker(false);
        setPendingVocab(null);
        setGloss(g => g ? { ...g, duplicate: true, error: false } : null);
        return;
      }
    } else {
      setPendingDuplicateVocab({ word, definition, folderId, sentence });
      setShowFolderPicker(false);
      setPendingVocab(null);
      setGloss(g => g ? { ...g, duplicate: true, error: false } : null);
      return;
    }

    try {
      await doInsertVocab(word, definition, folderId, currentUser, sentence);
    } catch (err) {
      console.error("Lỗi lưu từ", err);
      setGloss(g => g ? { ...g, error: true } : null);
      setTimeout(() => {
        setGloss(g => g ? { ...g, error: false } : null);
      }, 2000);
    }
  };

  const handleForceVocab = async () => {
    if (!pendingDuplicateVocab) return;
    const { word, definition, folderId, sentence } = pendingDuplicateVocab;

    let currentUser = user;
    if (!currentUser) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      if (!fetchedUser) return;
      currentUser = fetchedUser;
      setUser(fetchedUser);
    }

    try {
      await doInsertVocab(word, definition, folderId, currentUser, sentence);
    } catch (err) {
      console.error("Lỗi lưu từ", err);
      setGloss(g => g ? { ...g, error: true, duplicate: false } : null);
      setPendingDuplicateVocab(null);
      setTimeout(() => {
        setGloss(g => g ? { ...g, error: false } : null);
      }, 2000);
    }
  };

  const handleDeleteVocab = async (id: string) => {
    await supabase.from("user_notebook").delete().eq("id", id);
    setSavedVocabList(prev => prev.filter(v => v.id !== id));
  };

  const handleUpdateVocab = async (id: string, definition: string) => {
    const { error } = await supabase.from("user_notebook").update({ definition }).eq("id", id);
    if (!error) {
      setSavedVocabList(prev => prev.map(v => v.id === id ? { ...v, definition } : v));
      setEditingVocabId(null);
    }
  };

  const insertFormatting = (field: 'en_full' | 'vi_full', prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(`textarea-${field}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = addForm[field];
    const selectedText = currentVal.substring(start, end);
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    
    let replacement = prefix + selectedText + suffix;
    let newCursorPos = start + prefix.length + selectedText.length;
    
    if (prefix === '[IMG:') {
      const url = window.prompt("Nhập URL ảnh:");
      if (!url) return;
      replacement = `\n[IMG:${url}]\n`;
      newCursorPos = start + replacement.length;
    }

    setAddForm(f => ({ ...f, [field]: before + replacement + after }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-white text-slate-800">
      {!activeArticle && <Navbar />}

      {/* Hidden file input for image upload in admin modal */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
      />

      <AnimatePresence mode="wait">
        {activeArticle ? (
          /* DYNAMIC DUAL-PANE BILINGUAL READER VIEW */
          <motion.div
            key="bilingual-reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#6b7c3a] text-white p-6 pt-8 pb-12 flex flex-col relative overflow-hidden"
          >
            {/* Grid Background matching Homepage Hero exactly */}
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />

            <div className="max-w-7xl mx-auto w-full z-10 flex-grow flex flex-col">
              {/* Header & Typography Controls */}
              <div className="flex flex-wrap items-center justify-between w-full mb-8 gap-4">
                {/* Left: Title */}
                <div className={`flex items-center gap-2 sm:gap-3 ${isFullscreen ? "hidden" : ""}`}>
                  <button
                    onClick={navigateBackToSource}
                    className="text-white hover:text-white/80 transition-colors mr-1 cursor-pointer flex items-center justify-center"
                    title="Quay lại"
                  >
                    <ArrowLeft className="w-7 h-7" />
                  </button>
                  <span className="font-serif italic text-white text-2xl sm:text-3xl font-bold whitespace-nowrap">đọc song ngữ</span>
                  <span className="text-white/40 font-black hidden sm:inline">•</span>
                  <span className="text-white/80 font-mono text-[10px] sm:text-xs uppercase tracking-widest hidden sm:inline whitespace-nowrap">THE IELTS DICTIONARY</span>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white text-[10px] sm:text-xs font-bold select-none ml-auto">
                  {/* Font dropdown pill */}
                  <div className="flex items-center gap-2 bg-black/15 border border-white/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-1.5">
                    <span className="text-white/50 font-black uppercase tracking-wider">FONT</span>
                    <select
                      value={activeFont}
                      onChange={(e) => setActiveFont(e.target.value)}
                      className="bg-transparent border-none text-white font-bold outline-none cursor-pointer pr-1 max-w-[90px] sm:max-w-[130px]"
                    >
                      {READER_FONTS.map(f => (
                        <option key={f.name} value={f.stack} className="bg-slate-900 text-white" style={{ fontFamily: f.stack }}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font size pill */}
                  <div className="flex items-center gap-2 sm:gap-3 bg-black/15 border border-white/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-1.5">
                    <span className="text-white/50 font-black uppercase tracking-wider">CỠ CHỮ</span>
                    <button
                      onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                      className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center border border-white/20 font-black cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm w-4 text-center">{fontSize}</span>
                    <button
                      onClick={() => setFontSize(prev => Math.min(28, prev + 1))}
                      className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center border border-white/20 font-black cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Vocab Panel toggle pill */}
                  <button
                    onClick={() => setShowVocabPanel(true)}
                    className="bg-black/15 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 cursor-pointer font-black transition-colors flex items-center gap-2"
                  >
                    📖 {savedVocabList.length} từ
                  </button>

                  {/* Light / Dark toggle pill */}
                  <button
                    onClick={() => setReaderDark(d => !d)}
                    className="bg-black/15 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 cursor-pointer font-black transition-colors flex items-center gap-2"
                  >
                    {readerDark ? "☀️ Sáng" : "🌙 Tối"}
                  </button>
                  {/* Fullscreen toggle pill */}
                  <button
                    onClick={() => {
                      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                      else document.exitFullscreen();
                    }}
                    className="bg-black/15 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 cursor-pointer font-black transition-colors flex items-center gap-2"
                  >
                    {isFullscreen ? "✕ Thu nhỏ" : "⛶ Toàn màn hình"}
                  </button>
                </div>
              </div>

              {/* Reader panes — desktop: side-by-side with draggable divider */}
              <div
                ref={readerRef}
                className="hidden md:flex items-stretch flex-grow"
                style={{ minHeight: "80vh" }}
              >
                {/* English panel */}
                <div
                  className={`${readerDark ? "bg-[#1c1c1e]" : "bg-[#fbf8f1]"} rounded-[18px] p-8 md:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.06)] flex flex-col relative ${readerDark ? "text-slate-100" : "text-slate-800"} overflow-y-auto transition-colors duration-300`}
                  style={{ flex: splitFraction, minWidth: 0, minHeight: "80vh", maxHeight: "88vh" }}
                >
                  <div className="absolute top-6 right-8 bg-[#EBF3FE] text-[#2F80ED] text-[10px] font-black rounded-full px-2.5 py-0.5 tracking-wider uppercase">EN</div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#6b7c3a] mb-2 block">English</span>
                  <h1 className={`text-3xl font-black font-serif ${readerDark ? "text-white" : "text-slate-900"} leading-tight mb-8 flex items-start gap-2 flex-wrap`}>
                    {activeArticle.title}
                    {activeArticle.sourceUrl && (
                      <a href={activeArticle.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300 border border-blue-400/40 hover:border-blue-300/60 bg-blue-500/10 hover:bg-blue-500/20 rounded-full px-2.5 py-1 transition-colors shrink-0 mt-2"
                        title={activeArticle.sourceUrl}>
                        {activeArticle.sourceLabel || <ExternalLink size={10} />}
                        {activeArticle.sourceLabel && <ExternalLink size={9} />}
                      </a>
                    )}
                  </h1>
                  <div className="flex-grow">
                    {activeArticle.content.map((p, paraIdx) => {
                      const { cleanText, manualMap } = parseManualGlosses(p.en);
                      return (
                      <p key={paraIdx} className="mb-6 leading-relaxed" style={{ fontSize: `${fontSize}px`, fontFamily: activeFont }}>
                        {getFormattedWords(cleanText, paraIdx).map((tok, wid) => {
                          if (tok.isImg) return <img key={tok.id} src={tok.url} className="max-w-full rounded-lg my-3" alt="" />;
                          
                          const isManual = !!manualMap[wid];
                          const g = manualMap[wid] || (glossMaps?.[paraIdx]?.[wid] ?? null);
                          const isPinned = tok.id === pinnedTokenId;
                          const isActive = tok.id === hoveredTokenId || isPinned;

                          const capturePosition = (el: HTMLElement) => {
                            const r = el.getBoundingClientRect();
                            return { x: r.left + r.width / 2, y: r.top };
                          };

                          const handleMouseEnter = () => {
                            // If anything is globally pinned, ignore all hover — tooltip must stay locked
                            if (pinnedTokenId !== null) return;
                            if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
                            const el = document.getElementById(`tok-${tok.id}`);
                            if (g && el) {
                              const pos = capturePosition(el);
                              setHoveredTokenId(tok.id);
                              const wordClean = tok.t.replace(/[.,!?;:'"()[\]{}]/g, '');
                              setGloss({ text: g, ...pos, word: wordClean, sentence: getSentenceContaining(cleanText, wordClean), pinned: false });
                            }
                          };

                          const handleMouseLeave = () => {
                            // If anything is globally pinned, don't clear gloss on leave
                            if (pinnedTokenId !== null) return;
                            hoverLeaveTimerRef.current = setTimeout(() => {
                              setHoveredTokenId(null);
                              setGloss(prev => (prev && !prev.pinned ? null : prev));
                            }, 80);
                          };

                          const handleClick = () => {
                            if (isPinned) {
                              // Unpin
                              setPinnedTokenId(null);
                              setGloss(null);
                            } else {
                              const el = document.getElementById(`tok-${tok.id}`);
                              if (g && el) {
                                const pos = capturePosition(el);
                                setPinnedTokenId(tok.id);
                                const wordClean = tok.t.replace(/[.,!?;:'"()[\]{}]/g, '');
                                setGloss({ text: g, ...pos, word: wordClean, sentence: getSentenceContaining(cleanText, wordClean), pinned: true });
                              }
                            }
                          };

                          let inner = (
                            <span
                              id={`tok-${tok.id}`}
                              className={`cursor-pointer rounded px-0.5 transition-colors duration-100 ${
                                isActive ? "bg-[#a3cf62]/40 text-[#1e3a06] underline decoration-[#6b7c3a]/60" : readerDark ? "text-slate-200" : "text-slate-700"
                              } ${isManual ? "border-b border-dashed border-[#a3cf62]" : ""}`}
                            >
                              {tok.t}
                            </span>
                          );
                          
                          if (tok.format === 'bold') inner = <strong>{inner}</strong>;
                          else if (tok.format === 'italic') inner = <em>{inner}</em>;

                          return (
                            <span
                              key={tok.id}
                              className="relative inline-block"
                              onMouseEnter={handleMouseEnter}
                              onMouseLeave={handleMouseLeave}
                              onClick={handleClick}
                            >
                              {inner}{" "}
                            </span>
                          );
                        })}
                      </p>
                    );
                    })}
                  </div>
                </div>

                {/* Draggable divider */}
                <div
                  onPointerDown={e => {
                    draggingRef.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    document.body.style.cursor = "col-resize";
                    document.body.style.userSelect = "none";
                  }}
                  onPointerMove={e => {
                    if (!draggingRef.current || !readerRef.current) return;
                    const r = readerRef.current.getBoundingClientRect();
                    setSplitFraction(Math.max(0.22, Math.min(0.78, (e.clientX - r.left) / r.width)));
                  }}
                  onPointerUp={() => {
                    draggingRef.current = false;
                    document.body.style.cursor = "";
                    document.body.style.userSelect = "";
                  }}
                  className="w-8 flex items-center justify-center cursor-col-resize flex-shrink-0 z-20 select-none group"
                >
                  <div className="w-[3px] h-14 bg-white/25 group-hover:bg-white/60 active:bg-white/80 rounded-full transition-colors" />
                </div>

                {/* Vietnamese panel */}
                <div
                  className={`${readerDark ? "bg-[#1c1c1e]" : "bg-[#fbf8f1]"} rounded-[18px] p-8 md:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.06)] flex flex-col relative ${readerDark ? "text-slate-100" : "text-slate-800"} overflow-y-auto transition-colors duration-300`}
                  style={{ flex: 1 - splitFraction, minWidth: 0, minHeight: "80vh", maxHeight: "88vh" }}
                >
                  <div className="absolute top-6 right-8 bg-[#FDF0ED] text-[#EB5757] text-[10px] font-black rounded-full px-2.5 py-0.5 tracking-wider uppercase">VI</div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#6b7c3a] mb-2 block">Tiếng Việt</span>
                  <h1 className={`text-3xl font-extrabold italic font-serif ${readerDark ? "text-white" : "text-slate-900"} leading-tight mb-8`}>{activeArticle.titleVi}</h1>
                  <div className="flex-grow">
                    {activeArticle.content.map((p, paraIdx) => (
                      <p key={paraIdx} className={`mb-6 leading-relaxed ${readerDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontSize: `${fontSize}px`, fontFamily: activeFont }}>
                        {renderViFormattedText(p.vi)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile: stacked panels (no token hover — just readable text) */}
              <div className="flex md:hidden flex-col gap-6 flex-grow">
                <div className={`${readerDark ? "bg-[#1c1c1e]" : "bg-[#fbf8f1]"} rounded-[18px] p-6 shadow relative ${readerDark ? "text-slate-100" : "text-slate-800"} transition-colors duration-300`}>
                  <div className="absolute top-4 right-5 bg-[#EBF3FE] text-[#2F80ED] text-[10px] font-black rounded-full px-2.5 py-0.5 tracking-wider uppercase">EN</div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#6b7c3a] mb-2 block">English</span>
                  <h1 className={`text-2xl font-black font-serif ${readerDark ? "text-white" : "text-slate-900"} leading-tight mb-6`}>{activeArticle.title}</h1>
                  {activeArticle.content.map((p, i) => <p key={i} className={`mb-4 leading-relaxed ${readerDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontSize: `${fontSize}px`, fontFamily: activeFont }}>{renderViFormattedText(parseManualGlosses(p.en).cleanText)}</p>)}
                </div>
                <div className={`${readerDark ? "bg-[#1c1c1e]" : "bg-[#fbf8f1]"} rounded-[18px] p-6 shadow relative ${readerDark ? "text-slate-100" : "text-slate-800"} transition-colors duration-300`}>
                  <div className="absolute top-4 right-5 bg-[#FDF0ED] text-[#EB5757] text-[10px] font-black rounded-full px-2.5 py-0.5 tracking-wider uppercase">VI</div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#6b7c3a] mb-2 block">Tiếng Việt</span>
                  <h1 className={`text-2xl font-extrabold italic font-serif ${readerDark ? "text-white" : "text-slate-900"} leading-tight mb-6`}>{activeArticle.titleVi}</h1>
                  {activeArticle.content.map((p, i) => <p key={i} className={`mb-4 leading-relaxed ${readerDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontSize: `${fontSize}px`, fontFamily: activeFont }}>{renderViFormattedText(p.vi)}</p>)}
                </div>
              </div>

              {/* Reader Footer Info */}
              <div className="w-full flex flex-col sm:flex-row justify-between items-center mt-8 text-[10px] text-white/50 font-black uppercase tracking-wider gap-2">
{glossMaps === null && (
                  <span className="flex items-center gap-1.5 text-white/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />
                    Đang tải từ vựng…
                  </span>
                )}
              </div>

              {/* Gloss tooltip — two modes: hover=compact pill, pinned=expanded card */}
              {gloss && (
                <div
                  className={`fixed z-[200] pointer-events-none transition-all duration-150 ${
                    gloss.pinned
                      ? "rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,0.8)] border-2 border-black"
                      : "rounded-lg shadow-lg"
                  }`}
                  style={{
                    background: gloss.pinned ? "#1e3006" : "#3d6b24",
                    left: gloss.x,
                    top: gloss.y - (gloss.pinned ? 12 : 6),
                    transform: "translate(-50%, -100%)",
                    whiteSpace: "nowrap",
                    minWidth: gloss.pinned ? 180 : undefined,
                  }}
                >
                  {gloss.pinned ? (
                    /* Expanded pinned card */
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#a3cf62] mb-0.5">EN</div>
                          <div className="text-base font-black text-white font-serif italic flex items-center gap-2">
                            {gloss.word}
                            <button
                              className="pointer-events-auto w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                const utterance = new SpeechSynthesisUtterance(gloss.word);
                                utterance.lang = 'en-US';
                                utterance.rate = 0.85;
                                window.speechSynthesis.speak(utterance);
                              }}
                              title="Nghe phát âm"
                            >
                              <Volume2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#a3cf62] mb-0.5">VI</div>
                          <div className="text-sm font-bold text-white/90">{gloss.text}</div>
                        </div>
                        {/* Dismiss button */}
                        <button
                          className="pointer-events-auto w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/60 hover:text-white transition-colors shrink-0 mt-0.5"
                          onClick={(e) => { e.stopPropagation(); setPinnedTokenId(null); setGloss(null); }}
                          title="Đóng"
                        >
                          <X size={11} />
                        </button>
                      </div>
                      {gloss.word && (
                        <div className="flex flex-col gap-2 w-full mt-2">
                          {gloss.duplicate ? (
                            <>
                              <p className="text-[10px] text-amber-300 font-bold text-center leading-snug">Từ này đã có trong sổ!</p>
                              <div className="flex gap-1.5 w-full">
                                <button
                                  className="pointer-events-auto flex-1 bg-[#a3cf62] hover:bg-[#b8df74] text-[#1e3006] text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1.5 flex items-center justify-center gap-1 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); handleForceVocab(); }}
                                >
                                  <Plus size={10} />Thêm lại
                                </button>
                                <button
                                  className="pointer-events-auto flex-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1.5 flex items-center justify-center transition-colors"
                                  onClick={(e) => { e.stopPropagation(); setGloss(g => g ? { ...g, duplicate: false } : null); setPendingDuplicateVocab(null); }}
                                >
                                  Thôi
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <button
                                className={`pointer-events-auto w-full ${gloss.error ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#a3cf62] hover:bg-[#b8df74] text-[#1e3006]'} text-[11px] font-black uppercase tracking-wider rounded-lg px-3 py-1.5 flex items-center justify-center gap-1.5 transition-colors`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!gloss.saved && !gloss.error) {
                                    handleSaveVocab(gloss.word, gloss.text, null, gloss.sentence);
                                  }
                                }}
                              >
                                {gloss.error ? <><X size={11} />Lỗi lưu!</> : gloss.saved ? <><Check size={11} />Đã lưu</> : <><Plus size={11} />Lưu từ</>}
                              </button>
                              <button
                                className="pointer-events-auto text-[10px] text-white/50 hover:text-white/80 transition-colors text-center underline decoration-white/30 hover:decoration-white/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setFolderPickerPos({ x: r.left + r.width / 2, y: r.top });
                                  setPendingVocab({ word: gloss.word, definition: gloss.text, sentence: gloss.sentence });
                                  setShowFolderPicker(true);
                                }}
                              >
                                Chọn thư mục
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Compact hover pill */
                    <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-black text-white">
                      <span>{gloss.text}</span>
                    </div>
                  )}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${gloss.pinned ? "#1e3006" : "#3d6b24"}` }} />
                </div>
              )}
            </div>

            {/* Folder picker popup — appears above the + button */}
            {showFolderPicker && pendingVocab && (
              <>
                <div
                  className="fixed inset-0 z-[299]"
                  onClick={() => { setShowFolderPicker(false); setPendingVocab(null); }}
                />
                <div
                  className="fixed z-[300] bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden min-w-[200px]"
                  style={{
                    left: folderPickerPos.x,
                    top: folderPickerPos.y - 10,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div className="px-3 py-2 bg-[#3d6b24] flex items-center gap-2">
                    <FolderOpen size={12} className="text-white/80" />
                    <span className="text-white text-[10px] font-black uppercase tracking-wider">Thêm vào thư mục</span>
                  </div>
                  <div className="py-1 max-h-52 overflow-y-auto">
                    <button
                      onClick={() => handleSaveVocab(pendingVocab.word, pendingVocab.definition, null, pendingVocab.sentence)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors italic border-b border-slate-100"
                    >
                      <span className="text-slate-300">◌</span>
                      Chưa phân loại
                    </button>
                    {folders.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-slate-400 italic text-center">Chưa có thư mục nào.<br/>Tạo trong Sổ từ vựng.</p>
                    ) : (
                      folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => handleSaveVocab(pendingVocab.word, pendingVocab.definition, folder.id, pendingVocab.sentence)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-[#f0f7e8] hover:text-[#3d6b24] flex items-center gap-2 transition-colors font-medium"
                        >
                          <FolderOpen size={13} className="text-[#6b7c3a] shrink-0" />
                          {folder.name}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="px-3 py-2 border-t border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Từ: <span className="text-[#3d6b24] italic normal-case font-black">{pendingVocab.word}</span></span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : !selectedCard ? (
          /* PORTAL HOME: Grid of 6 Cards */
          <motion.div
            key="portal-home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow bg-herb relative text-white pt-36 pb-24 px-4 md:px-8"
          >
            {/* Grid Background matching Homepage Hero exactly */}
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />

            <div className="max-w-7xl mx-auto w-full z-10 relative">
              {/* Back button */}
              <div className="mb-8">
                <Link
                  href="/reading"
                  className="inline-flex items-center text-sm font-bold text-white/70 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Quay lại Reading
                </Link>
              </div>

              {/* Header */}
              <header className="mb-16 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 text-gleam px-3.5 py-1.5 rounded-full mb-4 border border-white/20">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span className="font-black text-[9px] uppercase tracking-[0.2em]">Bilingual Press Portal</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight text-white drop-shadow-sm">
                  Đọc Báo Song Ngữ
                </h1>
                <p className="text-white/80 font-medium text-lg max-w-2xl leading-relaxed">
                  Tuyển tập các bài viết song ngữ Anh - Việt từ những đầu báo uy tín nhất thế giới, giúp bạn nâng cao từ vựng học thuật và phản xạ đọc hiểu tự nhiên.
                </p>
              </header>

              {/* Card Grid */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
              >
                {CARDS.map((card) => (
                  <motion.div
                    key={card.id}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                    }}
                    whileHover={{ y: -8 }}
                    onClick={() => navigateToSource(card)}
                    className="bg-white border-4 border-black rounded-[36px] overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-all duration-300 flex flex-col cursor-pointer group relative"
                  >
                    {card.isRecommended && (
                      <div className="absolute top-4 right-4 z-10 bg-yellow-300 text-black border-2 border-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] rotate-3">
                        Recommended by TID
                      </div>
                    )}
                    {/* Card Image Container */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-white border-b-4 border-black">
                      <Image
                        src={card.image}
                        alt={card.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-102"
                        priority
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* AEON-STYLE DETAIL VIEW */
          <motion.div
            key="newspaper-home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow pt-32 pb-24 bg-white"
          >
            {/* Back Bar */}
            <div className="bg-slate-50 border-y border-slate-100 py-3.5 px-4 md:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <button
                  onClick={navigateBackToPortal}
                  className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-herb transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại danh sách báo
                </button>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Saved filter toggle */}
                  <button
                    onClick={() => { setShowSavedOnly(s => !s); setArticlePage(0); }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all ${
                      showSavedOnly
                        ? "bg-amber-400 text-black"
                        : "bg-white text-slate-700 hover:bg-amber-50"
                    }`}
                  >
                    {showSavedOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    Đã lưu {savedArticleIds.size > 0 && `(${savedArticleIds.size})`}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { setSaveError(null); setAddForm(EMPTY_FORM); setEditingArticleId(null); setShowAddModal(true); }}
                      className="inline-flex items-center gap-1.5 bg-[#6b7c3a] text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#5b6a31] transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm bài viết
                    </button>
                  )}
                  <button
                    onClick={() => setShowPasteModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm bài báo của bạn
                  </button>
                  <button
                    onClick={() => { setSubmitStatus("idle"); setEmail(""); setShowSubModal(true); }}
                    className="bg-[#6b7c3a] text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#5b6a31] transition-colors shadow-sm"
                  >
                    Nhận thông báo bài học mới
                  </button>
                </div>
              </div>
            </div>

            {/* Aeon editorial header */}
            <div className="py-12 border-b border-slate-100 text-center relative px-4">
              <div className="max-w-7xl mx-auto flex items-center justify-center">
                {/* Brand Logo */}
                <div 
                  className={`flex items-center justify-center text-center ${selectedCard.logoFont || "text-4xl md:text-5xl font-extrabold tracking-tighter uppercase font-serif text-[#1e3006]"}`}
                  style={selectedCard.customStyle || {}}
                >
                  {selectedCard.logoPrefix}
                  {selectedCard.logoText || selectedCard.name}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
              {/* Featured / Hero Article */}
              {getArticles(selectedCard.id)[0] && (
                <div
                  onClick={() => navigateToArticle(getArticles(selectedCard.id)[0])}
                  className="relative w-full aspect-[16/9] max-h-[600px] rounded-[32px] overflow-hidden shadow-lg mb-16 cursor-pointer group"
                >
                  <img
                    src={getArticles(selectedCard.id)[0].image}
                    alt={getArticles(selectedCard.id)[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] transition-all duration-300 group-hover:bg-black/60" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 max-w-4xl mx-auto">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a3cf62] bg-[#a3cf62]/10 border border-[#a3cf62]/20 px-3.5 py-1.5 rounded-full mb-4">
                      {getArticles(selectedCard.id)[0].category}
                    </span>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-serif text-white tracking-tight mb-4 leading-tight">
                      {getArticles(selectedCard.id)[0].title}
                    </h2>
                    <h3 className="text-lg md:text-2xl font-serif text-white/90 italic tracking-wide mb-6">
                      {getArticles(selectedCard.id)[0].titleVi}
                    </h3>
                    <p className="hidden md:block text-slate-200 text-sm md:text-base font-medium max-w-2xl mb-8 leading-relaxed opacity-95">
                      {getArticles(selectedCard.id)[0].excerpt}
                    </p>
                    <div className="text-[11px] font-black uppercase tracking-widest text-[#a3cf62]">
                      Click to read bilingual article
                    </div>
                  </div>
                </div>
              )}

              {/* Sort + filter bar — sits directly under the banner */}
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <button
                  onClick={() => { setSortOrder(o => o === "newest" ? "oldest" : "newest"); setArticlePage(0); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_rgba(0,0,0,1)] bg-white text-slate-700 hover:bg-slate-50 transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                >
                  {sortOrder === "newest" ? "↓ Mới nhất" : "↑ Cũ nhất"}
                </button>
              </div>

              {/* 3-Column Editorial Grid */}
              {(() => {
                const allArticles = getArticles(selectedCard.id);
                const sortedArticles = sortOrder === "oldest" ? [...allArticles].reverse() : allArticles;
                const displayArticles = showSavedOnly
                  ? sortedArticles.filter(a => savedArticleIds.has(a.id))
                  : sortedArticles;
                const totalPages = Math.ceil(displayArticles.length / ARTICLES_PER_PAGE);
                const pageArticles = displayArticles.slice(articlePage * ARTICLES_PER_PAGE, articlePage * ARTICLES_PER_PAGE + ARTICLES_PER_PAGE);

                return (
                  <>
                    {showSavedOnly && displayArticles.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl mb-20">
                        <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold text-sm">Chưa có bài nào được lưu.</p>
                        <p className="text-slate-300 text-xs mt-1">Nhấn biểu tượng 🔖 trên thẻ bài để lưu.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
                      {pageArticles.map((article) => (
                        <div
                          key={article.id}
                          className="flex flex-col cursor-pointer group relative"
                        >
                          {/* Admin controls */}
                          {isAdmin && article.fromDb && (
                            <div className="absolute top-2 left-2 z-10 flex gap-2">
                              <button
                                onClick={e => { e.stopPropagation(); handleEditArticleClick(article); }}
                                className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Sửa bài"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteArticle(article.id); }}
                                disabled={deletingId === article.id}
                                className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xoá bài"
                              >
                                {deletingId === article.id ? <span className="text-[9px]">…</span> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}

                          {/* Bookmark button — top-right, visible on hover */}
                          <button
                            onClick={e => toggleSaveArticle(article, e)}
                            className={`absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all ${
                              savedArticleIds.has(article.id)
                                ? "bg-amber-400 text-black opacity-100"
                                : "bg-white text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-amber-50"
                            }`}
                            title={savedArticleIds.has(article.id) ? "Bỏ lưu" : "Lưu bài"}
                          >
                            {savedArticleIds.has(article.id)
                              ? <BookmarkCheck className="w-4 h-4" />
                              : <Bookmark className="w-4 h-4" />}
                          </button>

                          <div onClick={() => navigateToArticle(article)} className="flex flex-col flex-grow">
                            <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden bg-slate-100 mb-5 shadow-sm">
                              <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                              />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-herb mb-3 block">
                              📖 {article.category}
                            </span>
                            <h3 className="text-xl font-bold font-serif text-slate-900 group-hover:text-herb transition-colors mb-2 leading-snug flex items-start gap-1.5 flex-wrap">
                              {article.title}
                              {article.sourceUrl && (
                                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-full px-2 py-0.5 transition-colors shrink-0 mt-1"
                                  title={article.sourceUrl}>
                                  {article.sourceLabel || <ExternalLink size={10} />}
                                  {article.sourceLabel && <ExternalLink size={9} />}
                                </a>
                              )}
                            </h3>
                            <h4 className="text-sm font-serif text-slate-500 italic mb-4 leading-snug">
                              {article.titleVi}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5 line-clamp-3">
                              {article.excerpt}
                            </p>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                              <span>By {article.author}</span>
                              <span>{article.readTime}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Brutalist Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mb-20">
                        <button
                          onClick={() => { setArticlePage(p => Math.max(0, p - 1)); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                          disabled={articlePage === 0}
                          className="flex items-center gap-1.5 px-4 py-2 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_rgba(0,0,0,1)] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                        >
                          <ChevronLeft className="w-4 h-4" /> Trước
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => { setArticlePage(i); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                              className={`w-9 h-9 border-2 border-black font-black text-sm shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                                i === articlePage ? "bg-[#1e3006] text-white" : "bg-white hover:bg-slate-50 text-slate-800"
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => { setArticlePage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                          disabled={articlePage === totalPages - 1}
                          className="flex items-center gap-1.5 px-4 py-2 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_rgba(0,0,0,1)] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                        >
                          Tiếp <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Vocab Panel Drawer — lives outside AnimatePresence so it works from both reader and list views */}
      <AnimatePresence>
        {showVocabPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVocabPanel(false)}
              className="fixed inset-0 bg-black/50 z-[160]"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xs bg-[#1c1c1e] text-white z-[170] shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-bold font-serif italic text-[#a3cf62]">Từ vựng của bạn</h3>
                <button onClick={() => setShowVocabPanel(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {savedVocabList.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center italic mt-10">Chưa có từ vựng nào được lưu.</p>
                ) : (
                  savedVocabList.map(item => (
                    <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10 group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[#a3cf62]">{item.word}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingVocabId(item.id); setEditingVocabDef(item.definition); }} className="text-slate-400 hover:text-white transition-colors" title="Sửa"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteVocab(item.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Xoá"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {editingVocabId === item.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            value={editingVocabDef}
                            onChange={e => setEditingVocabDef(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#a3cf62]"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingVocabId(null)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 transition-colors"><X size={12} /></button>
                            <button onClick={() => handleUpdateVocab(item.id, editingVocabDef)} className="w-6 h-6 flex items-center justify-center rounded bg-[#6b7c3a] hover:bg-[#a3cf62] transition-colors"><Check size={12} /></button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300 leading-relaxed">{item.definition}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dán bài Modal */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !pasteTranslating && setShowPasteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-3xl p-8 w-full max-w-xl relative z-10 shadow-2xl text-slate-800"
            >
              {/* Close */}
              <button
                onClick={() => !pasteTranslating && setShowPasteModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-black text-slate-900 mb-1">Dán bài tiếng Anh</h3>
              <p className="text-sm text-slate-500 mb-5">TID sẽ tự động dịch sang tiếng Việt và chia thành các cụm song song để học.</p>

              {/* Main textarea */}
              <textarea
                rows={10}
                value={customContentEn}
                onChange={e => setCustomContentEn(e.target.value)}
                placeholder="Dán toàn bộ bài tiếng Anh vào đây…"
                disabled={pasteTranslating}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm leading-relaxed resize-none focus:outline-none focus:border-herb/60 focus:ring-2 focus:ring-herb/10 disabled:opacity-50 transition-colors"
                style={{ fontFamily: "Georgia, serif" }}
              />

              {/* Source URL */}
              <div className="mt-3 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Nguồn từ</span>
                <input
                  type="url"
                  value={pasteSourceUrl}
                  onChange={e => setPasteSourceUrl(e.target.value)}
                  placeholder="https://www.economist.com/..."
                  disabled={pasteTranslating}
                  className="flex-1 text-sm text-slate-600 placeholder-slate-300 focus:outline-none bg-transparent"
                />
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {customContentEn.trim() ? `${customContentEn.trim().split(/\s+/).filter(Boolean).length} từ` : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowPasteModal(false); setCustomContentEn(""); setPasteSourceUrl(""); }}
                    disabled={pasteTranslating}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleDichTaoBai}
                    disabled={!customContentEn.trim() || pasteTranslating}
                    className="px-6 py-2.5 rounded-xl bg-herb text-white text-sm font-black tracking-wide hover:-translate-y-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 flex items-center gap-2"
                  >
                    {pasteTranslating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Đang dịch…
                      </>
                    ) : "Dịch & tạo bài"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin add-article modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddModal(false); setEditingArticleId(null); }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-4 border-black rounded-[36px] p-8 w-full max-w-3xl relative z-10 shadow-[8px_8px_0_rgba(0,0,0,1)] text-slate-800 overflow-y-auto max-h-[90vh]"
            >
              <button onClick={() => { setShowAddModal(false); setEditingArticleId(null); }} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
              <h3 className="text-2xl font-black tracking-tight mb-6">{editingArticleId ? "Sửa bài viết" : "Thêm bài viết song ngữ"}</h3>
              <form onSubmit={handleSaveArticle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tiêu đề EN</label>
                    <input required value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tiêu đề VI</label>
                    <input required value={addForm.title_vi} onChange={e => setAddForm(f => ({ ...f, title_vi: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Chủ đề EN</label>
                    <input value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Chủ đề VI</label>
                    <input value={addForm.category_vi} onChange={e => setAddForm(f => ({ ...f, category_vi: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tác giả</label>
                    <input value={addForm.author} onChange={e => setAddForm(f => ({ ...f, author: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian đọc</label>
                    <input placeholder="e.g. 8 mins" value={addForm.read_time} onChange={e => setAddForm(f => ({ ...f, read_time: e.target.value }))} className="w-full px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">URL bài gốc (Tuỳ chọn)</label>
                  <div className="flex gap-2">
                    <input placeholder="https://..." value={addForm.source_url} onChange={e => setAddForm(f => ({ ...f, source_url: e.target.value }))} className="flex-1 px-4 py-2 border-2 border-black rounded-xl text-sm" />
                    <input placeholder="Tên hiển thị, VD: Reuters" value={addForm.source_label} onChange={e => setAddForm(f => ({ ...f, source_label: e.target.value }))} className="w-48 px-4 py-2 border-2 border-black rounded-xl text-sm" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Tên hiển thị: nếu để trống sẽ chỉ hiện icon liên kết</p>
                </div>

                {/* Image picker */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">URL ảnh (hoặc chọn file / Ctrl+V)</label>
                  <div
                    onPaste={handleModalPaste}
                    onClick={() => !addForm.image_url && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed border-black rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 ${!addForm.image_url ? "cursor-pointer hover:bg-slate-100 h-28" : "h-36"}`}
                  >
                    {addForm.image_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={addForm.image_url} alt="preview" className="object-cover w-full h-full rounded-xl" />
                        <button type="button" onClick={e => { e.stopPropagation(); setAddForm(f => ({ ...f, image_url: "" })); }} className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center z-10 text-xs">×</button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        {uploadingImage ? <span className="text-xs animate-pulse">Đang upload…</span> : <><ImageIcon className="w-7 h-7" /><span className="text-xs font-bold">Ctrl+V để dán ảnh · hoặc click để chọn file</span></>}
                      </div>
                    )}
                  </div>
                  {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <input placeholder="Hoặc dán URL ảnh trực tiếp…" value={addForm.image_url} onChange={e => setAddForm(f => ({ ...f, image_url: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold transition-colors">Chọn file</button>
                  </div>
                </div>

                {/* Article content — two big textareas, separated by double newlines = paragraphs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded">EN</span>
                        <span className="text-xs font-bold text-slate-400">Dán toàn bộ bài tiếng Anh</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => insertFormatting('en_full', '**', '**')} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-serif font-bold text-xs" title="Bold">B</button>
                        <button type="button" onClick={() => insertFormatting('en_full', '*', '*')} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-serif italic text-xs" title="Italic">I</button>
                        <button type="button" onClick={() => insertFormatting('en_full', '[IMG:')} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-xs" title="Insert Image"><ImageIcon size={12} /></button>
                      </div>
                    </div>
                    <textarea
                      id="textarea-en_full"
                      rows={12}
                      placeholder={"Dán nội dung bài báo tiếng Anh vào đây…\n\nMỗi đoạn cách nhau bằng 1 dòng trống."}
                      value={addForm.en_full}
                      onChange={e => setAddForm(f => ({ ...f, en_full: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-black rounded-xl text-sm font-mono resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider rounded">VI</span>
                        <span className="text-xs font-bold text-slate-400">Bản dịch tiếng Việt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                          <button type="button" onClick={() => insertFormatting('vi_full', '**', '**')} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-serif font-bold text-xs" title="Bold">B</button>
                          <button type="button" onClick={() => insertFormatting('vi_full', '*', '*')} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-serif italic text-xs" title="Italic">I</button>
                          <button type="button" onClick={() => insertFormatting('vi_full', '[IMG:')} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-xs" title="Insert Image"><ImageIcon size={12} /></button>
                        </div>
                        <button
                          type="button"
                          onClick={autoTranslateFull}
                          disabled={translatingFull || !addForm.en_full.trim()}
                          className="text-[10px] font-black text-herb hover:underline disabled:opacity-40 flex items-center gap-1"
                        >
                          {translatingFull ? "⏳ Đang dịch…" : "✨ Dịch tự động"}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        id="textarea-vi_full"
                        rows={12}
                        placeholder={translatingFull ? "Đang dịch…" : "Bản dịch sẽ tự động điền vào đây, hoặc tự nhập…"}
                        value={addForm.vi_full}
                        onChange={e => setAddForm(f => ({ ...f, vi_full: e.target.value }))}
                        disabled={translatingFull}
                        className={`w-full px-3 py-2 border-2 rounded-xl text-sm font-mono resize-none transition-colors ${translatingFull ? "border-herb/50 bg-herb/5 text-slate-400" : "border-black"}`}
                      />
                      {translatingFull && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
                          <span className="text-xs font-black text-herb animate-pulse">✨ Đang dịch…</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {saveError && <p className="text-sm text-red-600 font-bold">{saveError}</p>}
                <button type="submit" disabled={savingArticle} className="w-full py-3.5 bg-herb text-white font-black text-sm uppercase tracking-wider rounded-xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-2">
                  {savingArticle ? "Đang lưu…" : (editingArticleId ? "Lưu thay đổi" : "Lưu bài viết")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription/Notification Modal */}
      <AnimatePresence>
        {showSubModal && selectedCard && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#0b0e14] border-4 border-black rounded-[36px] p-8 md:p-10 w-full max-w-lg relative z-10 shadow-[8px_8px_0_rgba(0,0,0,1)] text-center text-white"
            >
              <button
                onClick={() => setShowSubModal(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-[#6b8f3f]/10 text-[#a3cf62] border-2 border-black flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <h3 className="text-3xl font-black text-white tracking-tight mb-3">
                {selectedCard.name}
              </h3>

              <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Đội ngũ giáo viên TID đang dịch thuật & biên tập các bài báo song ngữ mới nhất từ nguồn này. Nhập email của bạn để nhận thông báo ngay khi bài học ra mắt! 🦖
              </p>

              {submitStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border-2 border-[#165A36] p-5 rounded-2xl flex items-center gap-3 text-emerald-400 text-left"
                >
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-[#a3cf62]" />
                  <p className="text-sm font-bold">Tuyệt vời! Chúng mình sẽ thông báo cho bạn khi các bài viết của {selectedCard.name} lên sóng.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email của bạn..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-900 border-2 border-black rounded-2xl text-sm font-medium placeholder-slate-500 text-white outline-none focus:border-herb transition-all"
                    />
                  </div>

                  {submitStatus === "error" && (
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold text-left px-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Có lỗi xảy ra. Vui lòng thử lại sau!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#6b8f3f] hover:bg-[#587733] disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-colors shadow-lg border-2 border-black flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full block"></span>
                    ) : (
                      "Đăng ký nhận tin"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fake URL Suggest Modal */}
      <AnimatePresence>
        {showUrlSuggestModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUrlSuggestModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#faf6ec] border-4 border-black rounded-[36px] p-8 md:p-10 w-full max-w-lg relative z-10 shadow-[4px_4px_0_rgba(0,0,0,1)] text-center text-slate-900"
            >
              <button
                onClick={() => setShowUrlSuggestModal(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-3xl font-black font-serif tracking-tight mb-3">
                Gợi ý bài báo cho TID
              </h3>

              <p className="text-slate-600 font-medium text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Bạn đang đọc một bài hay? Hãy gửi link cho TID — đội ngũ biên tập sẽ dịch và thêm vào thư viện song ngữ.
              </p>

              {urlSuggestDone ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-2xl flex items-center gap-3 text-emerald-700 text-left"
                >
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" />
                  <p className="text-sm font-bold">Cảm ơn! TID sẽ xem xét và thêm bài viết này sớm 🎉</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="url"
                    value={urlSuggestInput}
                    onChange={(e) => setUrlSuggestInput(e.target.value)}
                    placeholder="Dán link bài báo vào đây…"
                    className="w-full px-4 py-4 bg-white border-2 border-black rounded-2xl text-sm font-medium placeholder-slate-400 outline-none focus:border-herb transition-all"
                  />
                  <div className="bg-amber-100 text-amber-800 text-xs font-bold py-2 px-4 rounded-full inline-block mb-2">
                    ⚠️ Tính năng này đang được phát triển dành riêng cho học viên TID.
                  </div>
                  <button
                    onClick={() => { if (urlSuggestInput.trim()) setUrlSuggestDone(true); }}
                    className="w-full py-4 bg-[#6b8f3f] hover:bg-[#587733] text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none border-2 border-black flex items-center justify-center gap-2"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SongNguBaoPage({ params }: { params: Promise<{ publisherId: string }> }) {
  const { publisherId } = React.use(params);
  return (
    <Suspense>
      <SongNguBaoPageInner defaultPublisherId={publisherId} />
    </Suspense>
  );
}
