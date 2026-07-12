"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Play,
  Pause,
  Settings,
  Check,
  Wifi,
  Bell,
  Menu,
  Volume2,
  Headphones,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  X,
  RotateCcw,
  Eye,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Highlighter,
  Eraser,
  Minimize2,
  Type,
  Plus,
  Minus
} from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { matchesAnswerKey } from '@/utils/answerMatch'

// --- Font preferences (same list as reading; empty stack = keep the default UI font) ---

const LISTENING_FONT_PREF_KEY = "tid_listening_font_pref"

const LISTENING_FONTS = [
  { name: "Mặc định", stack: "" },
  { name: "Lora", stack: "'Lora', Georgia, serif" },
  { name: "Merriweather", stack: "'Merriweather', Georgia, serif" },
  { name: "Fraunces", stack: "'Fraunces', Georgia, serif" },
  { name: "EB Garamond", stack: "'EB Garamond', Georgia, serif" },
  { name: "Newsreader", stack: "'Newsreader', Georgia, serif" },
  { name: "Spectral", stack: "'Spectral', Georgia, serif" },
  { name: "IBM Plex Serif", stack: "'IBM Plex Serif', Georgia, serif" },
  { name: "Bitter", stack: "'Bitter', Georgia, serif" },
  { name: "Inter (sans)", stack: "'Inter', system-ui, sans-serif" },
  { name: "Source Sans (sans)", stack: "'Source Sans 3', system-ui, sans-serif" },
]

const LISTENING_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Newsreader:ital,wght@0,400;1,400&family=Spectral:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Serif:ital,wght@0,400;0,700;1,400&family=Bitter:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:ital,wght@0,400;0,700;1,400&display=swap"

// --- Helpers ---

function getBlockQRange(block: Block): [number, number] | null {
  const nums: number[] = []
  const c = block.content || {}
  // multiple_choice_multi stores correctAnswers as an ARRAY of letters — its
  // indices (0, 1…) are not question numbers; its range comes from qNum + count
  if (!Array.isArray(c.correctAnswers)) {
    Object.keys(c.correctAnswers || {}).forEach((k: string) => {
      const n = parseInt(k); if (!isNaN(n) && n > 0) nums.push(n)
    })
  }
  ;(c.questions || []).forEach((q: any) => {
    if (q.number && isFinite(q.number)) nums.push(q.number)
    if (q.qNum && isFinite(q.qNum)) nums.push(q.qNum)
  })
  ;(c.questionNumbers || []).forEach((n: number) => { if (isFinite(n)) nums.push(n) })
  ;(c.items || []).forEach((item: any) => { if (item.qNum && isFinite(item.qNum)) nums.push(item.qNum) })
  if (c.qNum && isFinite(c.qNum)) {
    nums.push(c.qNum)
    if (c.count && isFinite(c.count)) nums.push(c.qNum + c.count - 1)
  }
  if (nums.length === 0) return null
  return [Math.min(...nums), Math.max(...nums)]
}

// --- Types ---

interface Block {
  id: string
  type: "note_completion" | "multiple_choice" | "matching" | "table_completion" | "multiple_choice_multi" | "true_false_not_given" | "yes_no_not_given" | "sentence_completion_options" | "map_labelling"
  heading?: string
  instruction?: string
  content: any
}

interface Section {
  sectionNumber: number
  title: string
  audioSrc: string
  questionRange: [number, number]
  mapSrc?: string
  blocks: Block[]
}

interface TestData {
  testId: string
  testName: string
  sections: Section[]
}

interface ListeningTestUIProps {
  mode: "practice" | "real_test"
  testData: TestData
  onSubmit: (answers: Record<number, string>) => void
  // Review mode ("Xem Cùng Đề Bài"): pre-fill every blank with the answer key,
  // show the answer chips, and hide the submit button (no re-grading/history).
  reviewMode?: boolean
  initialAnswers?: Record<number, string>
  // Per-question transcript + audio clip window, shown in a docked panel in review mode
  reviewSolutions?: Record<number, { audioStart: number; audioEnd: number; transcript?: string }>
}

// Docked review panel: transcript of the active question with the key phrase
// highlighted, plus a replay button for just that question's audio clip.
function ReviewClipPanel({
  qNum, solution, audioSrc,
}: {
  qNum: number
  solution: { audioStart: number; audioEnd: number; transcript?: string } | undefined
  audioSrc?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Switching questions stops the previous clip and re-opens the panel
  useEffect(() => {
    audioRef.current?.pause()
    setPlaying(false)
    setCollapsed(false)
  }, [qNum])

  if (!solution) return null
  const hasClip = Boolean(audioSrc && solution.audioEnd > solution.audioStart)
  if (!solution.transcript && !hasClip) return null

  const togglePlay = () => {
    const el = audioRef.current
    if (!el || !hasClip) return
    if (playing) { el.pause(); setPlaying(false); return }
    const startPlayback = () => {
      el.currentTime = solution.audioStart
      el.play().catch(() => setPlaying(false))
    }
    if (el.readyState >= 1) startPlayback()
    else { el.addEventListener("loadedmetadata", startPlayback, { once: true }); el.load() }
    setPlaying(true)
  }

  const handleTimeUpdate = () => {
    const el = audioRef.current
    if (el && el.currentTime >= solution.audioEnd) { el.pause(); setPlaying(false) }
  }

  const transcriptParts = (solution.transcript || "").split(/(\*\*[^*]+\*\*)/g)

  return (
    <div className="fixed bottom-[84px] right-6 z-[95] w-[400px] max-w-[calc(100vw-3rem)]">
      <div className="bg-white border-2 border-black rounded-xl shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f9f5ed] border-b-2 border-black">
          <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
            Q{qNum}
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex-1">
            Nghe lại & script
          </span>
          {hasClip && (
            <button
              onClick={togglePlay}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-black transition-all ${
                playing ? "bg-herb text-white" : "bg-white text-herb hover:bg-herb-50"
              }`}
              title="Nghe lại đoạn audio của câu này"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-black transition-colors"
            title={collapsed ? "Mở script" : "Thu gọn"}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {!collapsed && solution.transcript && (
          <p className="px-4 py-3 text-[14px] leading-[1.85] text-slate-700 font-baloo max-h-[32vh] overflow-y-auto">
            {transcriptParts.map((part, i) => {
              const m = part.match(/^\*\*(.+)\*\*$/)
              if (m) {
                return (
                  <span key={i} className="font-bold text-emerald-700 underline decoration-emerald-500 decoration-2 underline-offset-4 bg-emerald-50 rounded px-0.5">
                    {m[1]}
                  </span>
                )
              }
              return <span key={i}>{part}</span>
            })}
          </p>
        )}
        {!collapsed && !solution.transcript && (
          <p className="px-4 py-3 text-xs text-slate-400 italic">Chưa có transcript cho câu này.</p>
        )}
      </div>
      {hasClip && (
        <audio ref={audioRef} src={audioSrc} preload="none" onTimeUpdate={handleTimeUpdate} onEnded={() => setPlaying(false)} className="hidden" />
      )}
    </div>
  )
}

// --- Components ---

export default function ListeningTestUI({ mode: initialMode, testData, onSubmit, reviewMode = false, initialAnswers, reviewSolutions }: ListeningTestUIProps) {
  // Navigation & Mode
  const router = useRouter()
  const [mode, setMode] = useState<"practice" | "real_test">(initialMode)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const section = testData.sections[currentSectionIdx]

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers || {})
  const [reviews, setReviews] = useState<Record<number, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(initialMode === "real_test" ? 1800 : 0)
  const [showAnswers, setShowAnswers] = useState(reviewMode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState(LISTENING_FONTS[0].stack)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showHighlightMenu, setShowHighlightMenu] = useState(false)
  const [highlightPos, setHighlightPos] = useState({ x: 0, y: 0 })
  const [toolbarView, setToolbarView] = useState<"main" | "colors">("main")
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteInputText, setNoteInputText] = useState("")
  const [noteInputPos, setNoteInputPos] = useState({ x: 0, y: 0 })
  const [pendingRange, setPendingRange] = useState<Range | null>(null)
  const [hoveredNote, setHoveredNote] = useState<{ text: string; x: number; y: number } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [activeQuestionNum, setActiveQuestionNum] = useState<number>(testData.sections[0].questionRange[0])
  const [sectionStarted, setSectionStarted] = useState(false)
  // Real test: the Play overlay is shown once per test, not once per part
  const [testStarted, setTestStarted] = useState(false)

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const questionRefs = useRef<Record<number, HTMLElement | null>>({})
  const savedRangeRef = useRef<Range | null>(null)
  const clickedHighlightRef = useRef<HTMLElement | null>(null)

  // Answered Counter
  const isAnsweredFn = useCallback((qNum: number) => {
    let isMulti = false;
    let multiAnswered = false;
    for (const section of testData.sections) {
      for (const block of section.blocks) {
        if (block.type === 'multiple_choice_multi') {
          const startQNum = block.content?.qNum || 1;
          const count = block.content?.count || 2;
          if (qNum >= startQNum && qNum < startQNum + count) {
            isMulti = true;
            const parts = (answers[startQNum] || '').split(',').filter(Boolean);
            if ((qNum - startQNum) < parts.length) multiAnswered = true;
            break;
          }
        }
      }
      if (isMulti) break;
    }
    if (isMulti) return multiAnswered;
    return answers[qNum] && answers[qNum] !== "";
  }, [answers, testData.sections]);

  const answeredCount = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= 40; i++) {
      if (isAnsweredFn(i)) count++;
    }
    return count;
  }, [isAnsweredFn]);

  // Timer Logic
  useEffect(() => {
    if (mode === "practice") {
      const timer = setInterval(() => setTimeLeft(prev => prev + 1), 1000)
      return () => clearInterval(timer)
    } else if (mode === "real_test" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [mode, timeLeft])

  // Audio Handlers
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load()
    }
    setActiveQuestionNum(section.questionRange[0])
    setSectionStarted(false)
    setIsPlaying(false)
    // Real test: once started, later parts play automatically — no overlay again
    if (mode === "real_test" && testStarted && section.audioSrc && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn("Autoplay for next part failed:", err))
    }
  }, [currentSectionIdx])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true))
            .catch(err => console.warn("Playback interrupted:", err))
        }
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    if (mode === "real_test" && currentSectionIdx < testData.sections.length - 1) {
      setCurrentSectionIdx(prev => prev + 1)
      setSectionStarted(false)
    } else if (mode === "real_test" && currentSectionIdx === testData.sections.length - 1) {
       // Optional: Show test complete or auto-submit
       // onSubmit(answers)
    }
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = val
      setCurrentTime(val)
    }
  }

  const changeSpeed = () => {
    const rates = [0.75, 1, 1.25, 1.5]
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
    setPlaybackRate(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Answer Management
  const updateAnswer = (qNum: number, val: string) => {
    setAnswers(prev => ({ ...prev, [qNum]: val }))
  }

  // Multi-blank questions: one question number rendered as several inputs
  // (e.g. "Between {12} and {12}"). Each input edits its own part of a single
  // answer string joined with " + ", matching the "Friday + Sunday" key notation.
  const MULTI_BLANK_SEP = " + "
  const getMultiBlankPart = (qNum: number, idx: number) =>
    (answers[qNum] || "").split(MULTI_BLANK_SEP)[idx] || ""
  const updateMultiBlankPart = (qNum: number, idx: number, total: number, val: string) => {
    const parts = (answers[qNum] || "").split(MULTI_BLANK_SEP)
    while (parts.length < total) parts.push("")
    parts[idx] = val.replace(/\+/g, "") // "+" is reserved as the part separator
    updateAnswer(qNum, parts.every(p => !p.trim()) ? "" : parts.join(MULTI_BLANK_SEP))
  }

  const toggleReview = (qNum: number) => {
    setReviews(prev => ({ ...prev, [qNum]: !prev[qNum] }))
  }

  const scrollToQuestion = (qNum: number) => {
    setActiveQuestionNum(qNum)
    // Find which section contains this question
    const secIdx = testData.sections.findIndex(s => qNum >= s.questionRange[0] && qNum <= s.questionRange[1])
    
    if (secIdx !== -1) {
      if (mode === "real_test" && secIdx !== currentSectionIdx) {
        // In real test mode, clicking question numbers doesn't switch sections
        // Only allow scrolling if it's within the current section
        return
      }

      setCurrentSectionIdx(secIdx)
      setTimeout(() => {
        questionRefs.current[qNum]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === "Space") {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying])

  // Keep the fullscreen icon in sync when the user exits with Esc
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  // Lazy-load reader fonts + restore saved font preference
  useEffect(() => {
    const id = "reading-reader-fonts" // shared with the reading page so the stylesheet loads once
    if (!document.getElementById(id)) {
      const link = document.createElement("link")
      link.id = id
      link.rel = "stylesheet"
      link.href = LISTENING_FONTS_URL
      document.head.appendChild(link)
    }
    try {
      const saved = JSON.parse(localStorage.getItem(LISTENING_FONT_PREF_KEY) || "null")
      if (typeof saved?.fontFamily === "string") setFontFamily(saved.fontFamily)
      if (typeof saved?.fontSize === "number") setFontSize(saved.fontSize)
    } catch { /* ignore corrupt pref */ }
  }, [])

  // Persist font preference
  useEffect(() => {
    try {
      localStorage.setItem(LISTENING_FONT_PREF_KEY, JSON.stringify({ fontFamily, fontSize }))
    } catch { /* storage may be unavailable */ }
  }, [fontFamily, fontSize])

  // Close the font menu on outside click / Escape
  useEffect(() => {
    if (!showFontMenu) return
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.(".listening-font-menu")) setShowFontMenu(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowFontMenu(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [showFontMenu])

  // --- Highlight ---

  const HIGHLIGHT_COLORS = [
    { label: "blue",   bg: "#93c5fd" },
    { label: "pink",   bg: "#f9a8d4" },
    { label: "green",  bg: "#86efac" },
    { label: "yellow", bg: "#fde047" },
  ]

  const handleTextSelection = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest?.(".highlight-toolbar")) return
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text && text.length > 1) {
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()
      if (rect) {
        savedRangeRef.current = range?.cloneRange() ?? null
        clickedHighlightRef.current = null
        setHighlightPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
        setToolbarView(mode === "real_test" ? "main" : "colors")
        setShowHighlightMenu(true)
      }
    } else {
      // Plain click (no selection) on an existing highlight: re-open the
      // toolbar anchored on it so it can be restyled, annotated or erased.
      const hl = (e.target as HTMLElement).closest?.(".highlight-item") as HTMLElement | null
      if (hl && containerRef.current?.contains(hl)) {
        const range = document.createRange()
        range.selectNodeContents(hl)
        savedRangeRef.current = range
        clickedHighlightRef.current = hl
        const rect = hl.getBoundingClientRect()
        setHighlightPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
        setToolbarView(mode === "real_test" ? "main" : "colors")
        setShowHighlightMenu(true)
        return
      }
      setTimeout(() => {
        const cur = window.getSelection()
        if (!cur || cur.toString().trim().length === 0) {
          savedRangeRef.current = null
          clickedHighlightRef.current = null
          setShowHighlightMenu(false)
        }
      }, 200)
    }
  }

  const applyHighlight = (e: React.MouseEvent, styles: React.CSSProperties) => {
    e.preventDefault()
    e.stopPropagation()

    // Re-styling an existing highlight: swap its style in place, no new span.
    const existing = clickedHighlightRef.current
    if (existing) {
      existing.style.backgroundColor = ""
      existing.style.textDecoration = ""
      Object.keys(styles).forEach(k => {
        (existing.style as any)[k] = (styles as any)[k]
      })
      clickedHighlightRef.current = null
      savedRangeRef.current = null
      window.getSelection()?.removeAllRanges()
      setShowHighlightMenu(false)
      return
    }

    const range = savedRangeRef.current ?? window.getSelection()?.getRangeAt(0)
    if (!range) return

    wrapRangeTextNodes(range, (span) => {
      Object.keys(styles).forEach(k => {
        (span.style as any)[k] = (styles as any)[k]
      })
    })

    window.getSelection()?.removeAllRanges()
    savedRangeRef.current = null
    setShowHighlightMenu(false)
  }

  // Wrap every text node inside the range with its own inline span. Never
  // extracts/moves nodes, so selections spanning element boundaries keep
  // the block structure intact (no mid-word line breaks).
  const wrapRangeTextNodes = (range: Range, decorate: (span: HTMLSpanElement) => void) => {
    // Split partially-selected text nodes at the boundaries so only the
    // selected part gets wrapped.
    if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
      const rest = (range.startContainer as Text).splitText(range.startOffset)
      range.setStart(rest, 0)
    }
    if (range.endContainer.nodeType === Node.TEXT_NODE && range.endOffset < (range.endContainer as Text).length) {
      (range.endContainer as Text).splitText(range.endOffset)
    }

    const ancestor = range.commonAncestorContainer
    const root = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor
    if (!root) return

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const targets: Text[] = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent || node.textContent.trim().length === 0) continue
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)
      const startsInside = range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0
      const endsInside = range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
      if (startsInside && endsInside) targets.push(node as Text)
    }

    targets.forEach(t => {
      const span = document.createElement("span")
      span.className = "highlight-item"
      decorate(span)
      t.parentNode?.insertBefore(span, t)
      span.appendChild(t)
    })
  }

  const eraseHighlight = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const range = savedRangeRef.current ?? window.getSelection()?.getRangeAt(0)
    if (range && containerRef.current) {
      const highlights = containerRef.current.querySelectorAll(".highlight-item")
      highlights.forEach((h: Element) => {
        if (range.intersectsNode(h)) {
          const parent = h.parentNode
          while (h.firstChild) parent?.insertBefore(h.firstChild, h)
          parent?.removeChild(h)
        }
      })
      containerRef.current.normalize()
    }
    window.getSelection()?.removeAllRanges()
    savedRangeRef.current = null
    clickedHighlightRef.current = null
    setShowHighlightMenu(false)
  }

  const handleNoteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const range = savedRangeRef.current ?? window.getSelection()?.getRangeAt(0)
    if (!range) return
    const cloned = range.cloneRange ? range.cloneRange() : range
    const rect = cloned.getBoundingClientRect()
    setPendingRange(cloned)
    window.getSelection()?.removeAllRanges()
    savedRangeRef.current = null
    clickedHighlightRef.current = null
    setShowHighlightMenu(false)
    setNoteInputPos({ x: Math.min(rect.left, window.innerWidth - 288), y: rect.bottom + 8 })
    setNoteInputText("")
    setShowNoteInput(true)
  }

  const saveNote = () => {
    if (!pendingRange) { setShowNoteInput(false); return }
    wrapRangeTextNodes(pendingRange, (span) => {
      span.className = "note-item highlight-item cursor-pointer"
      span.style.borderBottom = "2px solid #3b82f6"
      span.style.backgroundColor = "#eff6ff"
      span.setAttribute("data-note", noteInputText)
    })
    setShowNoteInput(false)
    setNoteInputText("")
    setPendingRange(null)
  }

  const handleNoteMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 0) { setHoveredNote(null); return }
    const noteSpan = (e.target as HTMLElement).closest?.(".note-item[data-note]") as HTMLElement | null
    const noteText = noteSpan?.getAttribute("data-note") ?? null
    if (noteText) {
      setHoveredNote({ text: noteText, x: e.clientX + 14, y: e.clientY - 44 })
    } else {
      setHoveredNote(null)
    }
  }

  // --- Renderers ---

  // Extracts "A text B text C text..." options appended to the end of an instruction.
  // Returns null if the instruction doesn't end with an options list.
  const parseInstructionOptions = (instruction: string) => {
    const lastDotIdx = instruction.lastIndexOf('.')
    if (lastDotIdx === -1) return null
    const mainText = instruction.slice(0, lastDotIdx + 1).trim()
    const afterDot = instruction.slice(lastDotIdx + 1).trim()
    if (!afterDot || !/^[A-H]\s/.test(afterDot)) return null
    const opts: Array<{id: string; text: string}> = []
    const re = /([A-H])\s+([^A-H]+?)(?=\s+[A-H]\s|\s*$)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(afterDot)) !== null) opts.push({ id: m[1], text: m[2].trim() })
    if (opts.length < 2 || opts[0].id !== 'A') return null
    return { mainText, options: opts }
  }

  const renderNoteCompletion = (block: Block) => {
    const { template, correctAnswers } = block.content
    const parsed = block.instruction ? parseInstructionOptions(block.instruction) : null
    const blockQNums = [...(template || "").matchAll(/\{(\d+)\}/g)].map(m => parseInt(m[1]));

    // Multi-blank support: a question number may own several blanks in the template
    const blankTotals: Record<number, number> = {}
    for (const n of blockQNums) blankTotals[n] = (blankTotals[n] || 0) + 1
    const blankSeen: Record<number, number> = {}

    const renderInlineParts = (text: string, keyPrefix: string) =>
      text.split(/(\{\d+\}|\*\*[^*]+\*\*)/g).map((part: string, pi: number) => {
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/)
        if (boldMatch) return <strong key={`${keyPrefix}-b${pi}`} className="font-bold">{boldMatch[1]}</strong>
        const blankMatch = part.match(/\{(\d+)\}/)
        if (blankMatch) {
          const qNum = parseInt(blankMatch[1])
          const total = blankTotals[qNum] || 1
          const idx = blankSeen[qNum] = (blankSeen[qNum] ?? -1) + 1
          const value = total > 1 ? getMultiBlankPart(qNum, idx) : (answers[qNum] || "")
          const isCorrect = mode === "practice" && showAnswers && matchesAnswerKey(answers[qNum], correctAnswers?.[qNum])
          const isIncorrect = mode === "practice" && showAnswers && answers[qNum] && !matchesAnswerKey(answers[qNum], correctAnswers?.[qNum])

          // Options-based block: show drop zone displaying option text, not the letter
          if (parsed) {
            const optionText = parsed.options.find(o => o.id === answers[qNum])?.text
            const correctText = parsed.options.find(o => o.id === correctAnswers?.[qNum])?.text
            return (
              <span key={`${keyPrefix}-q${pi}`} ref={el => { questionRefs.current[qNum] = el; }} className="inline-flex items-center mx-1">
                <span
                  onClick={() => setActiveQuestionNum(qNum)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const letter = e.dataTransfer.getData('text/plain')
                    if (letter) { 
                      e.preventDefault(); 
                      const isLetterUsed = blockQNums.some(n => answers[n] === letter);
                      if (!isLetterUsed) {
                        updateAnswer(qNum, letter); 
                        setActiveQuestionNum(qNum);
                      }
                    }
                  }}
                  className={`inline-flex items-center w-44 h-[1.6rem] px-2 border font-medium text-[14px] transition-all cursor-pointer select-none ${
                    activeQuestionNum === qNum ? 'border-[#418FC6] shadow-[0_0_0_1px_#418FC6]' : 'border-slate-500'
                  } ${isCorrect ? 'bg-green-50 text-green-700 border-green-500' : isIncorrect ? 'bg-red-50 text-red-700 border-red-500' : 'bg-white'}`}
                >
                  {optionText ? (
                    <>
                      <span className="flex-1 text-center text-[13px] truncate">{optionText}</span>
                      {!showAnswers && (
                        <button
                          onClick={e => { e.stopPropagation(); updateAnswer(qNum, ''); setActiveQuestionNum(qNum) }}
                          className="text-slate-400 hover:text-red-500 ml-1 leading-none text-[11px] shrink-0"
                        >×</button>
                      )}
                    </>
                  ) : (
                    <span className="flex-1 text-center text-slate-400 text-[11px] font-bold">{qNum}</span>
                  )}
                </span>
                {showAnswers && (
                  <span className="text-[10px] font-black text-herb bg-herb-50 px-1.5 rounded ml-1">
                    {correctText || correctAnswers?.[qNum]}
                  </span>
                )}
              </span>
            )
          }

          // Free-text block: plain editable input
          return (
            <span key={`${keyPrefix}-q${pi}`} ref={el => { if (idx === 0) questionRefs.current[qNum] = el; }} className="inline-flex items-center gap-1 mx-1 relative">
              <span className="relative flex items-center">
                <input
                  type="text"
                  value={value}
                  onFocus={() => setActiveQuestionNum(qNum)}
                  onChange={(e) => total > 1 ? updateMultiBlankPart(qNum, idx, total, e.target.value) : updateAnswer(qNum, e.target.value)}
                  autoComplete="off"
                  className={`w-36 h-[1.6rem] bg-white px-2 font-medium text-[14px] border border-slate-500 transition-all outline-none ${
                    activeQuestionNum === qNum ? 'border-[#418FC6] shadow-[0_0_0_1px_#418FC6]' : ''
                  } ${
                    isCorrect ? 'bg-green-50 text-green-700 border-green-500' : isIncorrect ? 'bg-red-50 text-red-700 border-red-500' : ''
                  }`}
                />
                {!value && (
                  <span className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex text-[11px] font-bold text-slate-500">
                    {qNum}
                  </span>
                )}
              </span>
              {showAnswers && idx === total - 1 && (
                <span className="text-[10px] font-black text-herb bg-herb-50 px-1.5 rounded">{correctAnswers?.[qNum]}</span>
              )}
            </span>
          )
        }
        return <span key={`${keyPrefix}-t${pi}`}>{part}</span>
      })

    // Detect a flow-chart arrow line by Unicode char-code ranges (reliable across encodings)
    const isArrowLine = (s: string) => {
      const t = s.trim()
      if (!t || t.length > 6) return false
      for (let i = 0; i < t.length; i++) {
        const c = t.charCodeAt(i)
        // Arrows block U+2190–U+21FF, Supplemental Arrows U+2B00–U+2B7F,
        // Geometric Shapes U+25A0–U+25FF (covers ▼), Misc Symbols U+2600–U+26FF
        if ((c >= 0x2190 && c <= 0x21FF) ||
            (c >= 0x2B00 && c <= 0x2B7F) ||
            (c >= 0x25A0 && c <= 0x26FF)) return true
      }
      return false
    }
    const isFlowChart = (template || "").split("\n").some((l: string) => isArrowLine(l))

    const lines = (template || "").split("\n")
    const rows = lines.map((line: string, li: number) => {
      const leadingSpaces = line.match(/^(\s+)/)?.[1]?.length ?? 0
      const trimmed = line.trim()

      // Empty line → visible spacer
      if (!trimmed) return <div key={li} className="h-3" />

      // Flow-chart arrow line
      if (isArrowLine(line)) {
        return (
          <div key={li} className="flex items-center py-0 pl-1 my-3">
            <span className="text-slate-600 text-2xl font-black select-none leading-none">↓</span>
          </div>
        )
      }

      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-")
      const text = isBullet ? trimmed.slice(1).trimStart() : line
      const indentClass = leadingSpaces >= 4 ? 'ml-12' : leadingSpaces >= 2 ? 'ml-6' : ''

      if (isFlowChart) {
        return isBullet ? (
          <div key={li} className={`flex gap-2 items-baseline ${indentClass}`}>
            <span className="shrink-0 text-slate-600">•</span>
            <span className="flex-1">{renderInlineParts(text, `${li}`)}</span>
          </div>
        ) : (
          <div key={li}>{renderInlineParts(line, `${li}`)}</div>
        )
      }

      return isBullet ? (
        <div key={li} className={`flex gap-2 items-baseline py-1 ${indentClass}`}>
          <span className="shrink-0 text-slate-600 leading-[1.9]">•</span>
          <span className="flex-1">{renderInlineParts(text, `${li}`)}</span>
        </div>
      ) : (
        <div key={li} className="py-1">{renderInlineParts(line, `${li}`)}</div>
      )
    })

    // Flow-chart: no bordered container, heading with separator line
    if (isFlowChart) {
      return (
        <div className="font-sans text-[15px] text-slate-800">
          {/* Instruction: show cleaned text (options stripped) or full text */}
          {block.instruction && (
            <p className="text-slate-600 text-base font-medium mb-4 whitespace-pre-wrap">
              {parsed ? parsed.mainText : block.instruction}
            </p>
          )}
          {block.heading && (
            <div className="font-bold text-[15px] text-slate-900 pb-2 mb-4 border-b-2 border-slate-300">
              {block.heading}
            </div>
          )}
          {block.content.imageSrc && (
            <div className="flex justify-center py-4">
              <img src={block.content.imageSrc} alt="Diagram" className="max-w-full max-h-[420px] object-contain" />
            </div>
          )}
          <div className={parsed ? "flex gap-8 items-start" : ""}>
            <div className="flex-1 leading-[1.8]">{rows}</div>
            {parsed && (
              <div className="w-52 shrink-0">
                <div className="border-2 border-slate-300 rounded-lg p-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-3">List of options</p>
                  <p className="text-[9px] text-slate-400 text-center mb-2">Drag to a box · or click after selecting a box</p>
                  <div className="space-y-1.5">
                    {parsed.options.map(o => {
                      const blockQNums = [...(template || "").matchAll(/\{(\d+)\}/g)].map(m => parseInt(m[1]));
                      const isUsed = blockQNums.some(qNum => answers[qNum] === o.id);
                      return (
                        <div
                          key={o.id}
                          draggable={!isUsed}
                          onDragStart={e => { if (!isUsed) { e.dataTransfer.setData('text/plain', o.id); e.dataTransfer.effectAllowed = 'copy' } else { e.preventDefault() } }}
                          onClick={() => { if (!isUsed && activeQuestionNum && blockQNums.includes(activeQuestionNum)) { updateAnswer(activeQuestionNum, o.id) } }}
                          className={`border border-slate-300 rounded px-3 py-1.5 text-sm text-center select-none transition-all cursor-grab active:cursor-grabbing ${
                            isUsed ? 'opacity-40 bg-slate-50 text-slate-400' : 'bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {o.text}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Form/note completion: bordered container
    return (
      <div className="font-sans text-[15px] text-slate-800">
        {block.instruction && (
          <p className="text-slate-600 text-base font-medium mb-4 whitespace-pre-wrap">
            {parsed ? parsed.mainText : block.instruction}
          </p>
        )}
        <div className="border border-slate-500 bg-white font-sans text-[14px]">
          {block.heading && (
            <div className="text-center pt-2.5 pb-1 font-bold text-[15px] text-slate-900">
              {block.heading}
            </div>
          )}
          {block.content.imageSrc && (
            <div className="flex justify-center px-4 py-4 border-b border-slate-200">
              <img src={block.content.imageSrc} alt="Diagram" className="max-w-full max-h-[420px] object-contain" />
            </div>
          )}
          <div className="px-6 py-3 text-slate-800 leading-[2]">
            {rows}
          </div>
        </div>
      </div>
    )
  }

  const renderTableCompletion = (block: Block) => {
    const { tableHeaders, tableRows, correctAnswers } = block.content

    // A question number can own several blanks in one table ("Between {12} and {12}").
    // Count them so each blank binds to its own part instead of mirroring one string.
    const blankTotals: Record<number, number> = {}
    for (const row of (tableRows || []) as string[][])
      for (const cell of row)
        for (const m of (cell || "").matchAll(/\{(\d+)\}/g))
          blankTotals[parseInt(m[1])] = (blankTotals[parseInt(m[1])] || 0) + 1
    const blankSeen: Record<number, number> = {}

    const renderCellParts = (text: string) =>
      text.split(/(\{\d+\}|\*\*[^*]+\*\*)/g).map((part: string, pi: number) => {
        const blankMatch = part.match(/^\{(\d+)\}$/)
        if (blankMatch) {
          const qNum = parseInt(blankMatch[1])
          const total = blankTotals[qNum] || 1
          const idx = blankSeen[qNum] = (blankSeen[qNum] ?? -1) + 1
          const value = total > 1 ? getMultiBlankPart(qNum, idx) : (answers[qNum] || "")
          const isCorrect = mode === "practice" && showAnswers && matchesAnswerKey(answers[qNum], correctAnswers?.[qNum])
          const isIncorrect = mode === "practice" && showAnswers && answers[qNum] && !matchesAnswerKey(answers[qNum], correctAnswers?.[qNum])
          return (
            <span key={pi} ref={el => { if (idx === 0) questionRefs.current[qNum] = el; }} className="inline-flex items-center gap-1 mx-1 relative">
              <span className="relative flex items-center">
                <input
                  type="text"
                  value={value}
                  onFocus={() => setActiveQuestionNum(qNum)}
                  onChange={(e) => total > 1 ? updateMultiBlankPart(qNum, idx, total, e.target.value) : updateAnswer(qNum, e.target.value)}
                  autoComplete="off"
                  className={`w-32 h-[1.55rem] bg-white px-2 font-medium text-[14px] border transition-all outline-none ${
                    activeQuestionNum === qNum ? 'border-[#418FC6] shadow-[0_0_0_1px_#418FC6]' : 'border-slate-400'
                  } ${
                    isCorrect ? 'bg-green-50 text-green-700 border-green-500' : isIncorrect ? 'bg-red-50 text-red-700 border-red-500' : ''
                  }`}
                />
                {!value && (
                  <span className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex text-[10px] font-black text-slate-400">
                    {qNum}
                  </span>
                )}
              </span>
              {showAnswers && idx === total - 1 && (
                <span className="text-[10px] font-black text-herb bg-herb-50 px-1.5 rounded">{correctAnswers?.[qNum]}</span>
              )}
            </span>
          )
        }
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/)
        if (boldMatch) return <strong key={pi} className="font-bold">{boldMatch[1]}</strong>
        return <span key={pi}>{part}</span>
      })

    // Detect "form completion" style: 2 columns, first column has no blanks (it's a label)
    const isFormCompletion =
      tableRows?.length > 0 &&
      tableRows.every((row: string[]) => row.length <= 2) &&
      tableRows.filter((row: string[]) => (row[0] || '').trim()).every((row: string[]) => !(row[0] || '').includes('{'))

    if (isFormCompletion) {
      const titleHeader = block.heading || tableHeaders?.find((h: string) => h?.trim())
      return (
        <div className="font-sans text-[15px] text-slate-800">
          {block.instruction && (
            <p className="text-slate-600 text-base font-medium mb-4 whitespace-pre-wrap">
              {block.instruction}
            </p>
          )}
          <div className="border border-slate-500 bg-white text-[14px] font-sans">
            {titleHeader && (
              <div className="text-center pt-2 pb-1 font-bold text-[15px] text-slate-900">
                {titleHeader}
              </div>
            )}
            {block.content.imageSrc && (
              <div className="flex justify-center px-4 py-4 border-b border-slate-200">
                <img src={block.content.imageSrc} alt="Diagram" className="max-w-full max-h-[420px] object-contain" />
              </div>
            )}
            <div className="px-6 pb-3 pt-1">
              {tableRows.map((row: string[], ri: number) => {
                const label = (row[0] || '').trim()
                const content = row[1] || ''
                const lines = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
                return (
                  <div key={ri} className="flex leading-[2] text-slate-800">
                    <div className="w-[175px] shrink-0 text-slate-700">
                      {label ? (label.endsWith(':') ? label : `${label}:`) : ''}
                    </div>
                    <div className="flex-1">
                      {lines.length > 0
                        ? lines.map((line: string, li: number) => (
                            <div key={li}>{renderCellParts(line)}</div>
                          ))
                        : <div>{renderCellParts(content)}</div>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // Standard grid table for multi-column tables

    // Detect a title row: block.heading takes priority; otherwise a sentence-like
    // header (3+ words, no blank markers) is promoted ONLY when it is the sole
    // non-empty header — with 2+ real headers (e.g. "Stages of presentation" |
    // "Work still to be done") they are all column headers and must stay in place.
    let gridTitle: string | null = null
    let colHeaders: string[] = tableHeaders
    if (block.heading) {
      gridTitle = block.heading
      // Blank out any header cell that duplicates the heading so it isn't re-rendered
      colHeaders = (tableHeaders as string[]).map((h: string) => h === block.heading ? '' : h)
    } else if ((tableHeaders as string[]).filter((h: string) => (h || '').trim() !== '').length === 1) {
      const titleIdx = (tableHeaders as string[]).findIndex(
        (h: string) => (h || '').split(' ').length >= 3 && !(h || '').includes('{')
      )
      if (titleIdx >= 0) {
        gridTitle = tableHeaders[titleIdx]
        colHeaders = (tableHeaders as string[]).map((h: string, i: number) => i === titleIdx ? '' : h)
      }
    }
    // Skip the column-headers row entirely when all entries are empty after title extraction
    const hasVisibleColHeaders = colHeaders.some((h: string) => h.trim() !== '')

    // First-column rowspan: a row whose first cell is empty (but with content in
    // later cells) continues the label above — e.g. "Kitchen" spanning both
    // "Replace the {7}..." and "Paint wall above the {8}..." rows.
    // 0 = continuation (skip the cell), >=1 = rowSpan of the anchor cell.
    const firstColSpans: number[] = (tableRows as string[][]).map((row: string[], ri: number) =>
      ri > 0 && row.length > 1 && !(row[0] || '').trim() && row.slice(1).some((c: string) => (c || '').trim())
        ? 0
        : 1
    )
    for (let i = 0; i < firstColSpans.length; i++) {
      if (firstColSpans[i] !== 1) continue
      let j = i + 1
      while (j < firstColSpans.length && firstColSpans[j] === 0) j++
      firstColSpans[i] = j - i
    }

    return (
      <div className="font-sans text-[15px] text-slate-800">
        {block.instruction && (
          <p className="text-slate-600 text-base font-medium mb-4 whitespace-pre-wrap">
            {block.instruction}
          </p>
        )}
        {block.content.imageSrc && (
          <div className="flex justify-center px-4 py-4">
            <img src={block.content.imageSrc} alt="Diagram" className="max-w-full max-h-[420px] object-contain" />
          </div>
        )}
        <div className="py-6 flex justify-center">
          <table className="w-full max-w-6xl border-collapse border border-slate-300">
            <thead>
              {gridTitle && (
                <tr>
                  <th
                    colSpan={colHeaders.length}
                    className="border border-slate-300 px-4 py-2.5 text-left font-bold text-slate-900 text-[14px] bg-white"
                  >
                    {gridTitle}
                  </th>
                </tr>
              )}
              {hasVisibleColHeaders && (
                <tr className="bg-white">
                  {colHeaders.map((h: string, i: number) => (
                    <th key={i} className="border border-slate-300 px-4 py-2.5 text-left text-slate-800 text-sm">
                      {h ? (
                        <span className="font-bold border-b-2 border-[#418FC6] pb-0.5">{h}</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {tableRows.map((row: string[], ri: number) => {
                // Span all columns when only the first cell has content (e.g. a footer row)
                const isSpanRow =
                  row.length > 1 &&
                  (row[0] || '').trim() !== '' &&
                  row.slice(1).every((c: string) => (c || '').trim() === '')
                if (isSpanRow) {
                  const lines = row[0].split("\n").filter((l: string) => l.trim() !== "")
                  return (
                    <tr key={ri}>
                      <td colSpan={row.length} className="border border-slate-300 px-5 py-3 text-slate-800 text-[15px]">
                        <div className="space-y-1">
                          {lines.map((line: string, li: number) => (
                            <div key={li}>{renderCellParts(line.trim())}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                }
                return (
                <tr key={ri}>
                  {row.map((cell: string, ci: number) => {
                    if (ci === 0 && firstColSpans[ri] === 0) return null // merged into the label above
                    const rowSpan = ci === 0 && firstColSpans[ri] > 1 ? firstColSpans[ri] : undefined
                    const lines = (cell || "").split("\n").filter((l: string) => l.trim() !== "")
                    return (
                      <td key={ci} rowSpan={rowSpan} className={`border border-slate-300 px-5 py-3 text-slate-800 text-[15px] ${rowSpan ? 'align-middle' : ''}`}>
                        <div className="space-y-1">
                          {lines.map((line: string, li: number) => {
                            const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-")
                            const text = isBullet ? line.trim().slice(1).trimStart() : line.trim()
                            return isBullet ? (
                              <div key={li} className="flex gap-2 items-baseline">
                                <span className="shrink-0 text-slate-600">•</span>
                                <span>{renderCellParts(text)}</span>
                              </div>
                            ) : (
                              <div key={li}>{renderCellParts(text)}</div>
                            )
                          })}
                        </div>
                      </td>
                    )
                  })}
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderMultipleChoice = (block: Block) => {
    const { questions } = block.content
    return (
      <div className="space-y-6">
        {questions.map((q: any) => (
          <div key={q.qNum} ref={el => { questionRefs.current[q.qNum] = el; }} className="space-y-2">
            <p className="font-sans font-bold text-slate-900 text-base">
              <span className="mr-2">{q.qNum}.</span>{q.text}
            </p>
            <div className="ml-6 space-y-0.5">
              {q.options.map((opt: string, i: number) => {
                const label = String.fromCharCode(65 + i)
                const isSelected = answers[q.qNum] === label
                return (
                  <button
                    key={label}
                    onClick={() => {
                      // Drag-selecting option text must not toggle the answer
                      if (window.getSelection()?.toString().trim()) return
                      updateAnswer(q.qNum, label); setActiveQuestionNum(q.qNum)
                    }}
                    className={`w-full text-left flex gap-3 px-3 py-1.5 text-sm transition-colors select-text ${
                      isSelected ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-bold shrink-0 w-5 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{label}.</span>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderMultipleChoiceMulti = (block: Block) => {
    const { qNum, text, options, count } = block.content
    const endNum = qNum + count - 1
    const current = answers[qNum] ? answers[qNum].split(',') : []
    const correctAnswers: string[] = block.content.correctAnswers || []
    const showFeedback = mode === "practice" && showAnswers

    const toggle = (optId: string) => {
      if (showFeedback) return
      let next
      if (current.includes(optId)) next = current.filter((id: string) => id !== optId)
      else if (current.length < count) next = [...current, optId]
      else return
      updateAnswer(qNum, next.join(','))
    }

    return (
      <div ref={el => { questionRefs.current[qNum] = el; }} className="space-y-3">
        <p className="font-sans font-bold text-slate-900 text-base">
          <span className="mr-3">{qNum}–{endNum}</span>
          <span>{text}</span>
        </p>
        <div className="ml-6 space-y-1">
          {options.map((opt: any, idx: number) => {
            const effectiveId = opt.id ?? String.fromCharCode(65 + idx)
            const isSelected = current.includes(effectiveId)
            const isCorrect = showFeedback && correctAnswers.map((s: string) => s.toUpperCase().trim()).includes(effectiveId.toUpperCase().trim())
            return (
              <button
                key={effectiveId}
                onClick={() => {
                  // Drag-selecting option text must not toggle the answer
                  if (window.getSelection()?.toString().trim()) return
                  toggle(effectiveId); setActiveQuestionNum(qNum)
                }}
                className={`w-full text-left flex gap-3 items-center px-3 py-1.5 text-sm transition-colors select-text ${
                  isSelected ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'bg-slate-800 border-slate-800' : 'border-slate-400 bg-white'
                }`}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className={`font-bold shrink-0 w-5 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{effectiveId}.</span>
                <span className="flex-1">{opt.text}</span>
                {isCorrect && <span className="text-[10px] font-black text-herb shrink-0">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMatching = (block: Block) => {
    const { items, options } = block.content
    return (
      <div className="space-y-4">
        {/* Options row: A  Matt Elliot   B  Karen Russell ... */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm border-b border-slate-200 pb-3">
          {options.map((o: any) => (
            <span key={o.id} className="flex gap-1.5">
              <span className="font-bold text-slate-700">{o.id}</span>
              <span className="text-slate-600">{o.text}</span>
            </span>
          ))}
        </div>
        {/* Questions list: 19. [select]  Statement */}
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.qNum} ref={el => { questionRefs.current[item.qNum] = el; }} className="flex items-baseline gap-2 text-sm">
              <span className="font-bold text-slate-800 shrink-0 w-7">{item.qNum}.</span>
              <select
                value={answers[item.qNum] || ""}
                onFocus={() => setActiveQuestionNum(item.qNum)}
                onChange={(e) => updateAnswer(item.qNum, e.target.value)}
                className="border border-slate-400 px-1.5 py-0.5 text-xs font-bold outline-none bg-white shrink-0 cursor-pointer"
              >
                <option value="">—</option>
                {options.map((o: any) => <option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
              <span className="text-slate-700 leading-snug">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTrueFalseNotGiven = (block: Block, variant: "tfng" | "ynng" = "tfng") => {
    const { questions } = block.content
    const labels = variant === "tfng"
      ? ["TRUE", "FALSE", "NOT GIVEN"]
      : ["YES", "NO", "NOT GIVEN"]
    return (
      <div className="space-y-3">
        {questions.map((q: any) => {
          const selected = answers[q.qNum]
          const showFeedback = mode === "practice" && showAnswers
          return (
            <div key={q.qNum} ref={el => { questionRefs.current[q.qNum] = el; }} className="flex items-start gap-2 text-sm">
              <span className="font-bold text-slate-800 shrink-0 w-7 mt-1">{q.qNum}.</span>
              <span className="flex-1 text-slate-800 leading-relaxed mt-0.5">{q.text}</span>
              <span className="shrink-0 flex border border-slate-400 overflow-hidden ml-2 mt-0.5">
                {labels.map(label => {
                  const isSel = selected === label
                  return (
                    <button
                      key={label}
                      onClick={() => { updateAnswer(q.qNum, label); setActiveQuestionNum(q.qNum) }}
                      className={`px-2 py-1.5 text-[10px] font-black transition-colors ${isSel ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </span>
              {showFeedback && (
                <span className="text-[10px] font-black text-herb shrink-0 mt-1">{q.correctAnswer || "—"}</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMapLabelling = (block: Block) => {
    const { items, options, imageSrc } = block.content
    return (
      <div className="flex flex-row gap-6 items-start">
        {imageSrc && (
          <img src={imageSrc} alt="Map" className="max-w-[420px] border border-slate-200 rounded object-contain shrink-0" />
        )}
        <div className="overflow-x-auto">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-50 px-4 py-2 text-left font-bold text-slate-600 min-w-[200px]"></th>
                {options.map((o: any, oi: number) => (
                  <th key={oi} className="border border-slate-300 bg-slate-50 px-3 py-2 text-center font-bold text-slate-700 w-12">{o.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, ii: number) => (
                <tr key={ii} ref={el => { questionRefs.current[item.qNum] = el; }}>
                  <td className="border border-slate-300 px-4 py-2.5 text-slate-800">
                    <span className="font-bold mr-2">{item.qNum}</span>{item.text}
                  </td>
                  {options.map((o: any, oi: number) => {
                    const isSelected = answers[item.qNum] === o.id
                    return (
                      <td key={oi} className="border border-slate-300 px-3 py-2.5 text-center">
                        <button
                          onClick={() => { updateAnswer(item.qNum, o.id); setActiveQuestionNum(item.qNum) }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${
                            isSelected ? 'border-slate-800 bg-slate-800' : 'border-slate-400 bg-white hover:border-slate-600'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white block" />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSentenceCompletionOptions = (block: Block) => {
    const { options, questions } = block.content
    return (
      <div className="flex gap-8 items-start">
        {/* Left: question stems */}
        <div className="flex-1 space-y-3">
          {questions.map((q: any) => {
            const showFeedback = mode === "practice" && showAnswers
            const isIncorrect = showFeedback && answers[q.qNum] && answers[q.qNum] !== q.correctAnswer
            return (
              <div key={q.qNum} ref={el => { questionRefs.current[q.qNum] = el; }} className="flex items-baseline gap-2 text-sm">
                <span className="font-bold text-slate-800 shrink-0 w-7">{q.qNum}.</span>
                <select
                  value={answers[q.qNum] || ""}
                  onFocus={() => setActiveQuestionNum(q.qNum)}
                  onChange={(e) => { updateAnswer(q.qNum, e.target.value); setActiveQuestionNum(q.qNum) }}
                  className="border border-slate-400 px-1.5 py-0.5 text-xs font-bold outline-none bg-white shrink-0 cursor-pointer"
                >
                  <option value="">—</option>
                  {options.map((o: any) => <option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
                <span className="text-slate-700 leading-snug flex-1">{q.text}</span>
                {isIncorrect && (
                  <span className="text-[10px] font-black text-herb shrink-0">→ {q.correctAnswer}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: List of options panel */}
        <div className="w-48 shrink-0">
          <div className="border-2 border-slate-300 rounded-lg p-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-3">List of options</p>
            <div className="space-y-1.5">
              {options.map((o: any) => (
                <div key={o.id} className="border border-slate-300 rounded px-3 py-1.5 text-sm text-center text-slate-700 bg-white">
                  {o.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col bg-white font-sans text-slate-900"
    >
      {section.audioSrc && (
        <audio 
          key={currentSectionIdx}
          ref={audioRef}
          src={section.audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          onError={() => console.error(`Failed to load audio for section ${section.sectionNumber}: ${section.audioSrc}`)}
        />
      )}

      {/* Top Bar */}
      <header className="h-[60px] bg-white flex items-center justify-between px-4 z-40 border-b border-[#c1c1c1] shrink-0">
        <div className="flex items-center h-full">
          <div className="p-4 py-3.5 mr-2">
             <img className="h-10 w-auto rounded-md" alt="Logo" src="/assets/logo-finall.webp" />
          </div>
          <div className="px-4 border-l border-slate-100 flex flex-col justify-center">
            <div className="font-bold text-[#000] text-[15px]">{testData.testName}</div>
            <div className="flex items-center gap-2">
               <Volume2 className="w-4 h-4 text-slate-400" />
               <span className="text-sm text-[#000] font-medium">{formatTime(timeLeft)} {mode === "practice" ? "elapsed" : "remaining"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 h-full mr-2">
           <div className="relative listening-font-menu h-full">
              <div
                onClick={() => setShowFontMenu(v => !v)}
                className={`h-full aspect-square p-2 flex items-center justify-center duration-200 cursor-pointer ${showFontMenu ? "bg-black/10" : "hover:bg-black/5"}`}
                title="Phông chữ"
              >
                <Type className="w-6 h-6 text-black" />
              </div>
              {showFontMenu && (
                <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-[#d5d5d5] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 p-3 cursor-auto">
                  {/* Font size */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Cỡ chữ</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFontSize(s => Math.max(12, s - 1))}
                        className="w-7 h-7 rounded-md border border-[#d5d5d5] hover:bg-black/5 flex items-center justify-center"
                        aria-label="Giảm cỡ chữ"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-sm w-6 text-center tabular-nums">{fontSize}</span>
                      <button
                        onClick={() => setFontSize(s => Math.min(28, s + 1))}
                        className="w-7 h-7 rounded-md border border-[#d5d5d5] hover:bg-black/5 flex items-center justify-center"
                        aria-label="Tăng cỡ chữ"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Font family */}
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Kiểu chữ</span>
                  <div className="max-h-64 overflow-y-auto -mx-1 px-1 flex flex-col gap-0.5">
                    {LISTENING_FONTS.map(f => (
                      <button
                        key={f.name}
                        onClick={() => setFontFamily(f.stack)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[15px] flex items-center justify-between transition-colors ${fontFamily === f.stack ? "bg-[#418ec8] text-white" : "hover:bg-black/5 text-slate-800"}`}
                        style={f.stack ? { fontFamily: f.stack } : undefined}
                      >
                        <span>{f.name}</span>
                        {fontFamily === f.stack && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
           </div>
           <div
              onClick={toggleFullscreen}
              className="h-full aspect-square p-2 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer"
              title="Toggle Fullscreen"
           >
              {isFullscreen ? <Minimize2 className="w-6 h-6 text-black" /> : <Maximize2 className="w-6 h-6 text-black" />}
           </div>
           <div className="h-full aspect-square p-2 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer">
              <Wifi className="w-6 h-6 text-black" />
           </div>
           <div className="h-full aspect-square p-2 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer">
              <Bell className="w-6 h-6 text-black" />
           </div>
           <div className="h-full aspect-square p-2 flex items-center justify-center hover:bg-black/5 duration-200 cursor-pointer">
              <Menu className="w-6 h-6 text-black" />
           </div>
        </div>
      </header>

      {/* Audio Player Bar (Only shown in Practice Mode) */}
      {mode === "practice" && (
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-center gap-12 px-10 shadow-sm z-30">
          <div className="flex items-center gap-4 shrink-0">
            <Headphones className="w-5 h-5 text-slate-300" />
            <span className="text-slate-300 font-black text-xs uppercase tracking-widest">Part {section.sectionNumber}</span>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 bg-herb text-white rounded-full flex items-center justify-center hover:scale-105 hover:bg-herb-700 transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
            </button>
          </div>

          <div className="w-[500px] lg:w-[700px] flex items-center gap-6">
            <span className="font-mono text-xs font-black text-slate-400 w-12 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-slate-100 relative group cursor-pointer rounded-full">
              <input 
                type="range" 
                min="0" 
                max={duration || 0} 
                value={currentTime} 
                onChange={handleScrub}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div 
                className="absolute h-full bg-herb rounded-full" 
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div 
                className="absolute top-1/2 w-4 h-4 bg-herb rounded-full -translate-y-1/2 -translate-x-1/2 shadow-md border-2 border-white transition-transform group-hover:scale-125"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs font-black text-slate-400 w-12">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <button 
              onClick={changeSpeed}
              className="text-xs font-black text-slate-500 hover:text-herb transition-all border border-slate-200 px-3 py-1 rounded-md"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      )}

      <main
        className="flex-1 flex flex-col overflow-hidden bg-white relative font-baloo"
        onMouseDown={(e) => {
          const tag = (e.target as Element).tagName?.toLowerCase()
          if (tag === 'div' || tag === 'section') e.preventDefault()
        }}
        onMouseUp={handleTextSelection}
        onMouseMove={handleNoteMouseMove}
      >
        {/* Grey Part Header */}
        <div className="m-4 p-4 bg-[#f1f2ec] border border-[#d5d5d5] rounded-[4px] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-black text-[#000]">Part {section.sectionNumber}</div>
              <div className="text-[#000]">Read the text and answer questions {section.questionRange[0]}-{section.questionRange[1]}</div>
            </div>
            {section.mapSrc && (
              <button 
                onClick={() => setShowMap(true)}
                className="px-6 py-2 border-2 border-black text-black font-black uppercase text-xs rounded-sm hover:bg-slate-50 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]"
              >
                View Map
              </button>
            )}
          </div>
        </div>

        <div
          id="list_question"
          className={`flex-1 overflow-y-auto min-h-0 relative w-full h-full pr-3 px-6 interactive-container custom-scrollbar${fontFamily ? " listening-custom-font" : ""}`}
          // Fixed-px Tailwind classes in the blocks override an inherited font-size,
          // so scale the whole panel with zoom instead (default 16 = scale 1).
          style={{ zoom: fontSize / 16, ...(fontFamily ? ({ "--tid-listening-font": fontFamily } as React.CSSProperties) : {}) }}
        >
          <div className="max-w-6xl mx-auto space-y-6 py-8">
            <div>
              <h3 className="text-[#000] font-black text-2xl tracking-tight">Questions {section.questionRange[0]} - {section.questionRange[1]}</h3>
            </div>

            <div className="space-y-12">
              {section.blocks.map((block) => {
                const showSubRange = section.blocks.length > 1
                const blockRange = showSubRange ? getBlockQRange(block) : null
                return (
                <section key={block.id} className="space-y-3">
                  {blockRange && (
                    <h4 className="font-black text-xl text-[#000] tracking-tight">
                      Questions {blockRange[0]} – {blockRange[1]}
                    </h4>
                  )}
                  {block.heading && block.type !== "note_completion" && block.type !== "table_completion" && (
                    <h4 className="font-black text-lg text-slate-800 uppercase border-b-2 border-slate-100 pb-2">{block.heading}</h4>
                  )}
                  {/* note_completion & table_completion render their own instruction inside the
                      block (renderNoteCompletion / renderTableCompletion) — don't repeat it here. */}
                  {block.instruction && block.type !== "note_completion" && block.type !== "table_completion" && <p className="text-slate-600 text-base font-medium">{block.instruction}</p>}

                  {/* Diagram image — note/table/map renderers handle imageSrc themselves */}
                  {block.content?.imageSrc && block.type !== "note_completion" && block.type !== "table_completion" && block.type !== "map_labelling" && (
                    <div className="flex justify-center py-3">
                      <img src={block.content.imageSrc} alt="Diagram" className="max-w-full max-h-[420px] object-contain" />
                    </div>
                  )}

                  {/* Block Renderers */}
                  {block.type === "note_completion" && renderNoteCompletion(block)}
                  {block.type === "table_completion" && renderTableCompletion(block)}
                  {block.type === "multiple_choice" && renderMultipleChoice(block)}
                  {block.type === "multiple_choice_multi" && renderMultipleChoiceMulti(block)}
                  {block.type === "matching" && renderMatching(block)}
                  {block.type === "true_false_not_given" && renderTrueFalseNotGiven(block, "tfng")}
                  {block.type === "yes_no_not_given" && renderTrueFalseNotGiven(block, "ynng")}
                  {block.type === "sentence_completion_options" && renderSentenceCompletionOptions(block)}
                  {block.type === "map_labelling" && renderMapLabelling(block)}
                </section>
                )
              })}
            </div>
          </div>
        </div>

        {/* Real Test Start Overlay — shown once per test, inside main so footer is never blocked */}
        {mode === "real_test" && !testStarted && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-8 flex-col gap-4 text-center text-white font-sans">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="fill-white stroke-white w-20">
                <path d="M256 32C114.52 32 0 146.496 0 288v48a32 32 0 0 0 17.689 28.622l14.383 7.191C34.083 431.903 83.421 480 144 480h24c13.255 0 24-10.745 24-24V280c0-13.255-10.745-24-24-24h-24c-31.342 0-59.671 12.879-80 33.627V288c0-105.869 86.131-192 192-192s192 86.131 192 192v1.627C427.671 268.879 399.342 256 368 256h-24c-13.255 0-24 10.745-24 24v176c0 13.255 10.745 24 24 24h24c60.579 0 109.917-48.098 111.928-108.187l14.382-7.191A32 32 0 0 0 512 336v-48c0-141.479-114.496-256-256-256z"></path>
              </svg>
            </div>
            {section.audioSrc ? (
              <>
                <div className="max-w-md text-lg font-medium leading-snug">
                  You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.
                </div>
                <div className="text-base opacity-80 mt-2">To continue, click Play</div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setTestStarted(true)
                      if (audioRef.current) {
                        audioRef.current.play().then(() => {
                          setSectionStarted(true)
                          setIsPlaying(true)
                        }).catch(err => {
                          console.error("Playback failed:", err)
                          setSectionStarted(true)
                        })
                      } else {
                        setSectionStarted(true)
                      }
                    }}
                    className="bg-black rounded-[3px] px-8 py-4 flex items-center gap-3 hover:bg-black/80 transition-all border border-white/20 group"
                  >
                    <span className="flex items-center justify-center rounded-full bg-white p-1.5 group-hover:scale-110 transition-transform">
                      <Play className="fill-black stroke-black w-3 h-3 translate-x-[1px]" />
                    </span>
                    <span className="font-bold text-lg tracking-wide">Play</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="max-w-md text-lg font-medium leading-snug opacity-90">
                  Audio for Part {section.sectionNumber} is not available yet.
                </div>
                <div className="text-sm opacity-60 mt-1">You can still read the questions and answer them in practice mode.</div>
                <div className="mt-4">
                  <button
                    onClick={() => { setTestStarted(true); setSectionStarted(true) }}
                    className="bg-white/20 border border-white/40 rounded-[3px] px-8 py-4 font-bold text-lg tracking-wide hover:bg-white/30 transition-all"
                  >
                    Continue Without Audio
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigator */}
      <footer className="bg-slate-50 border-t border-slate-300 z-[1050] flex items-center justify-between overflow-hidden shrink-0">
         <div className="flex items-center flex-1 overflow-x-auto no-scrollbar">
            {testData.sections.map((sec, pi) => {
              const partNum = pi + 1
              const isCurrent = partNum === currentSectionIdx + 1
              const range = sec.questionRange
              
              let answeredInPart = 0;
              for (let n = range[0]; n <= range[1]; n++) {
                if (isAnsweredFn(n)) answeredInPart++;
              }

              return (
                <div 
                  key={partNum} 
                  className={`flex items-center gap-4 shrink-0 px-4 py-4 border-r border-slate-200 transition-colors ${
                    isCurrent ? 'bg-white' : 'hover:bg-[#efefef] cursor-pointer'
                  }`}
                  onClick={() => !isCurrent && setCurrentSectionIdx(pi)}
                >
                  <span className="text-slate-900 font-bold text-[14px]">Part {partNum}</span>
                  {isCurrent ? (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const qNum = (partNum - 1) * 10 + (i + 1)
                        const isActive = qNum === activeQuestionNum
                        const isAnswered = isAnsweredFn(qNum)
                        return (
                          <div key={qNum} className="relative pt-2 flex items-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); scrollToQuestion(qNum); }}
                              className={`w-7 h-7 flex items-center justify-center font-bold text-[13px] border transition-all rounded-[4px] ${
                                isActive ? 'border-[#418FC6] shadow-[0_0_0_1px_#418FC6]' : 
                                isAnswered ? 'border-[#418FC6] text-[#418FC6]' : 'border-transparent text-slate-700 hover:border-[#418FC6]'
                              }`}
                            >
                              {qNum}
                            </button>
                            <span className={`absolute bottom-full mb-0.5 w-full h-[3px] ${isAnswered ? 'bg-[#418FC6]' : 'bg-[#D7D7D7]'}`}></span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-500 font-medium text-[13px]">{answeredInPart} of 10</span>
                  )}
                </div>
              )
            })}
         </div>

         <div className="flex items-center h-full shrink-0">
            <div className="flex h-full">
              <button 
                onClick={() => setCurrentSectionIdx(prev => Math.max(0, prev - 1))}
                disabled={currentSectionIdx === 0}
                className={`w-[60px] h-[60px] flex items-center justify-center transition-all ${
                  currentSectionIdx === 0 ? 'bg-slate-200 text-slate-400' : 'bg-[#4c4c4c] text-white hover:bg-black'
                }`}
              >
                <ArrowLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setCurrentSectionIdx(prev => Math.min(testData.sections.length - 1, prev + 1))}
                disabled={currentSectionIdx === testData.sections.length - 1}
                className={`w-[60px] h-[60px] flex items-center justify-center transition-all border-l border-slate-600 ${
                  currentSectionIdx === testData.sections.length - 1 ? 'bg-slate-200 text-slate-400' : 'bg-black text-white hover:bg-[#333]'
                }`}
              >
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>
            {!reviewMode && (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="bg-[#efefef] text-black w-[60px] h-[60px] flex items-center justify-center hover:bg-[#262626] hover:text-white transition-all group border-l border-slate-300"
              >
                <Check className="w-8 h-8" />
              </button>
            )}
         </div>
      </footer>

      {/* Map Modal */}
      {showMap && section.mapSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-10">
          <div className="relative max-w-5xl w-full bg-white border-4 border-black p-4 rounded-xl shadow-2xl">
            <button 
              onClick={() => setShowMap(false)}
              className="absolute -top-12 -right-0 text-white hover:text-amber-500 transition-colors"
            >
              <X className="w-10 h-10" />
            </button>
            <img src={section.mapSrc} alt="Map Reference" className="w-full h-auto rounded-lg border-2 border-black" />
            <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg text-amber-900 font-bold text-sm">
              Use this map to help you answer the questions in Part {section.sectionNumber}.
            </div>
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6 border-2 border-slate-100">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Submit your answers?</h2>
            <p className="text-slate-500">
              You have answered <span className="font-black text-slate-800">{answeredCount}</span> out of <span className="font-black text-slate-800">40</span> questions.
              {answeredCount < 40 && <span className="block mt-1 text-amber-600 font-semibold">⚠ {40 - answeredCount} questions are still unanswered.</span>}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false)
                  if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false) }
                  if (mode === "real_test") {
                    onSubmit(answers)
                  } else {
                    setShowResults(true)
                    setShowAnswers(true)
                    onSubmit(answers)
                  }
                }}
                className="flex-1 px-6 py-3 bg-herb text-white rounded-xl font-bold hover:bg-herb/90 transition-all shadow-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review mode: docked per-question transcript + clip replay */}
      {reviewMode && reviewSolutions && (
        <ReviewClipPanel
          qNum={activeQuestionNum}
          solution={reviewSolutions[activeQuestionNum]}
          audioSrc={
            testData.sections.find(
              s => activeQuestionNum >= s.questionRange[0] && activeQuestionNum <= s.questionRange[1]
            )?.audioSrc
          }
        />
      )}

      {/* Results Screen */}
      {showResults && <ResultsOverlay testData={testData} answers={answers} onReview={() => setShowResults(false)} onClose={() => router.push('/listening')} />}

      {/* Floating Highlight Toolbar */}
      {showHighlightMenu && (
        <div
          className="highlight-toolbar fixed z-[80] -translate-x-1/2 -translate-y-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ left: highlightPos.x, top: highlightPos.y }}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
        >
          {toolbarView === "main" ? (
            <div className="flex items-stretch">
              <button
                onMouseDown={handleNoteClick}
                className="flex flex-col items-center gap-1 px-5 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <MessageCircle size={16} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Note</span>
              </button>
              <div className="w-px bg-slate-200 my-1.5" />
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setToolbarView("colors") }}
                className="flex flex-col items-center gap-1 px-5 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <Highlighter size={16} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Highlight</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              {HIGHLIGHT_COLORS.map(({ bg, label }) => (
                <button
                  key={label}
                  onMouseDown={(e) => applyHighlight(e, { backgroundColor: bg })}
                  className="w-6 h-6 rounded-md border-2 border-white shadow-sm hover:scale-125 transition-transform ring-1 ring-black/10"
                  style={{ backgroundColor: bg }}
                  title={label}
                />
              ))}
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                onMouseDown={(e) => applyHighlight(e, { textDecoration: "underline", textDecorationColor: "#ef4444", textDecorationThickness: "2px" })}
                className="h-6 px-1.5 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
                title="Gạch dưới đỏ"
              >
                <span className="text-[12px] font-bold leading-none" style={{ textDecoration: "underline", textDecorationColor: "#ef4444", textDecorationThickness: "2px" }}>U</span>
              </button>
              <button
                onMouseDown={(e) => applyHighlight(e, { textDecoration: "line-through", textDecorationColor: "#374151", textDecorationThickness: "2px" })}
                className="h-6 px-1.5 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
                title="Gạch ngang"
              >
                <span className="text-[11px] font-bold leading-none text-slate-600" style={{ textDecoration: "line-through", textDecorationThickness: "2px" }}>abc</span>
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button
                onMouseDown={eraseHighlight}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-red-500"
                title="Xóa định dạng"
              >
                <Eraser size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Note Input */}
      {showNoteInput && (
        <div
          className="fixed z-[90] w-72 bg-[#fefce8] border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden"
          style={{ left: noteInputPos.x, top: Math.min(noteInputPos.y, window.innerHeight - 200) }}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-[#fde047] border-b-2 border-black">
            <div className="flex items-center gap-2">
              <MessageCircle size={13} className="text-black" />
              <span className="text-[11px] font-black uppercase tracking-wider text-black">Ghi Chú</span>
            </div>
            <button
              onMouseDown={(e) => { e.preventDefault(); setShowNoteInput(false); setNoteInputText(""); setPendingRange(null) }}
              className="text-black/60 hover:text-red-600 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
          <div className="p-3">
            <textarea
              autoFocus
              value={noteInputText}
              onChange={(e) => setNoteInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote() }
                if (e.key === "Escape") { setShowNoteInput(false); setNoteInputText(""); setPendingRange(null) }
              }}
              placeholder="Nhập ghi chú..."
              className="w-full text-sm border border-black/20 bg-white/70 rounded p-2 resize-none outline-none focus:border-black/50 text-slate-800 font-medium placeholder:text-slate-400"
              rows={3}
            />
            <div className="text-[9px] text-amber-700/70 mt-1 mb-2.5 font-semibold">Enter để lưu · Esc để hủy · Shift+Enter xuống dòng</div>
            <div className="flex gap-2">
              <button
                onClick={saveNote}
                className="flex-1 bg-black text-white text-[11px] font-black py-1.5 rounded hover:bg-slate-800 transition-colors"
              >
                Lưu
              </button>
              <button
                onClick={() => { setShowNoteInput(false); setNoteInputText(""); setPendingRange(null) }}
                className="flex-1 border-2 border-black/30 text-[11px] font-black py-1.5 rounded hover:bg-black hover:text-white transition-colors text-black/70"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Hover Tooltip */}
      {hoveredNote && hoveredNote.text && (
        <div
          className="fixed z-[95] bg-[#fef3c7] border-2 border-amber-400 rounded shadow-[3px_3px_0px_rgba(0,0,0,0.15)] max-w-[240px] pointer-events-none overflow-hidden"
          style={{ left: hoveredNote.x, top: hoveredNote.y }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fde68a] border-b border-amber-300">
            <MessageCircle size={10} className="text-amber-700 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800">Ghi chú</span>
          </div>
          <div className="px-2.5 py-2 text-xs text-slate-700 leading-relaxed font-medium">{hoveredNote.text}</div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          -webkit-appearance: none;
          width: 17px !important;
          height: 17px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #8a8a8a !important;
          border-radius: 0px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
          border: none;
          box-shadow: none;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .highlight-item { cursor: pointer; display: inline; }
        .highlight-item:hover { filter: brightness(0.95); }
        /* Question blocks hard-code font-sans/font-baloo, so a chosen reader
           font must be forced down the whole subtree to take effect. */
        .listening-custom-font, .listening-custom-font * { font-family: var(--tid-listening-font) !important; }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      `}</style>
    </div>
  )
}

// --- Results Overlay ---

function ResultsOverlay({ testData, answers, onReview, onClose }: {
  testData: TestData
  answers: Record<number, string>
  onReview: () => void
  onClose: () => void
}) {
  // Calculate score by comparing answers against correctAnswers in each block
  const results = useMemo(() => {
    const details: { qNum: number; userAnswer: string; correctAnswer: string; isCorrect: boolean; section: number }[] = []

    for (const section of testData.sections) {
      for (const block of section.blocks) {
        if (block.type === 'note_completion' || block.type === 'table_completion') {
          const ca = block.content.correctAnswers || {}
          for (const qStr of Object.keys(ca)) {
            const qNum = parseInt(qStr)
            const correct = (ca[qNum] || '').toString().trim().toLowerCase()
            const user = (answers[qNum] || '').trim().toLowerCase()
            // Never mark as correct if the answer key is empty
            const isCorrect = matchesAnswerKey(user, correct)
            details.push({ qNum, userAnswer: answers[qNum] || '', correctAnswer: ca[qNum] || '', isCorrect, section: section.sectionNumber })
          }
        } else if (block.type === 'map_labelling') {
          const ca = block.content.correctAnswers || {}
          for (const item of (block.content.items || [])) {
            const qNum = item.qNum
            const correct = (ca[qNum] || '').toString().trim().toUpperCase()
            const user = (answers[qNum] || '').trim().toUpperCase()
            const isCorrect = correct !== '' && user === correct
            details.push({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correct, isCorrect, section: section.sectionNumber })
          }
        } else if (block.type === 'multiple_choice' || block.type === 'matching') {
          const questions = block.content.questions || block.content.items || []
          const ca = block.content.correctAnswers || {}
          if (block.content.questions) {
            for (const q of block.content.questions) {
              const qNum = q.qNum || q.number
              const correct = (q.correctAnswer || ca[qNum] || '').toString().trim().toUpperCase()
              const user = (answers[qNum] || '').trim().toUpperCase()
              const isCorrect = correct !== '' && user === correct
              details.push({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correct, isCorrect, section: section.sectionNumber })
            }
          }
          if (block.content.items) {
            for (const item of block.content.items) {
              const qNum = item.qNum
              const correct = (ca[qNum] || '').toString().trim().toUpperCase()
              const user = (answers[qNum] || '').trim().toUpperCase()
              const isCorrect = correct !== '' && user === correct
              details.push({ qNum, userAnswer: answers[qNum] || '', correctAnswer: correct, isCorrect, section: section.sectionNumber })
            }
          }
        } else if (block.type === 'true_false_not_given' || block.type === 'yes_no_not_given' || block.type === 'sentence_completion_options') {
          for (const q of (block.content.questions || [])) {
            const qNum = q.qNum
            const correct = (q.correctAnswer || '').toString().trim().toUpperCase()
            const user = (answers[qNum] || '').trim().toUpperCase()
            const isCorrect = correct !== '' && user === correct
            details.push({ qNum, userAnswer: answers[qNum] || '', correctAnswer: q.correctAnswer || '', isCorrect, section: section.sectionNumber })
          }
        } else if (block.type === 'multiple_choice_multi') {
          const ca = block.content.correctAnswers || []
          const qNum = block.content.qNum
          // "Choose TWO" is a SET (order-independent). Keep the user's picks in stored order —
          // don't sort — so each slot shows the letter the user actually chose, and credit a
          // correct pick under its own letter instead of rewriting it to another correct letter.
          const userParts = (answers[qNum] || '').split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          const correctParts = ca.map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          const correctSet = new Set(correctParts)
          const userSet = new Set(userParts)
          const count = block.content.count || 2
          const hasAnswerKey = correctParts.length > 0
          const missed = correctParts.filter((c2: string) => !userSet.has(c2)) // correct letters not picked
          let missedIdx = 0
          for (let i = 0; i < count; i++) {
            const thisUser = i < userParts.length ? userParts[i] : ''
            const ok = hasAnswerKey && thisUser !== '' && correctSet.has(thisUser)
            const correctAnswer = ok
              ? thisUser
              : (missedIdx < missed.length ? missed[missedIdx++] : '')
            details.push({
              qNum: qNum + i,
              userAnswer: thisUser,
              correctAnswer,
              isCorrect: ok,
              section: section.sectionNumber
            })
          }
        }
      }
    }

    details.sort((a, b) => a.qNum - b.qNum)
    const totalCorrect = details.filter(d => d.isCorrect).length
    return { details, totalCorrect, total: details.length }
  }, [testData, answers])

  const percentage = Math.round((results.totalCorrect / Math.max(results.total, 1)) * 100)

  // Approximate IELTS band score from raw score /40
  const getBand = (raw: number) => {
    if (raw >= 39) return '9.0'
    if (raw >= 37) return '8.5'
    if (raw >= 35) return '8.0'
    if (raw >= 32) return '7.5'
    if (raw >= 30) return '7.0'
    if (raw >= 26) return '6.5'
    if (raw >= 23) return '6.0'
    if (raw >= 18) return '5.5'
    if (raw >= 16) return '5.0'
    if (raw >= 13) return '4.5'
    if (raw >= 10) return '4.0'
    if (raw >= 8) return '3.5'
    if (raw >= 6) return '3.0'
    if (raw >= 4) return '2.5'
    return '2.0'
  }

  const band = getBand(results.totalCorrect)

  const sectionScores = [1, 2, 3, 4].map(sn => {
    const sectionDetails = results.details.filter(d => d.section === sn)
    return {
      section: sn,
      correct: sectionDetails.filter(d => d.isCorrect).length,
      total: sectionDetails.length
    }
  })

  return (
    <div className="fixed inset-0 z-[3000] bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-[60px] bg-white flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
        <h1 className="font-black text-xl text-slate-900">Test Results</h1>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-10 px-6 space-y-10">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-amber-400" />
                  <span className="text-amber-400 font-black text-sm uppercase tracking-widest">Your Score</span>
                </div>
                <div className="text-6xl font-black">
                  {results.totalCorrect}<span className="text-2xl text-slate-400">/{results.total}</span>
                </div>
                <div className="text-slate-400 text-lg">{percentage}% correct</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-2">Estimated Band</div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl font-black text-white shadow-lg">
                  {band}
                </div>
              </div>
            </div>

            {/* Section Breakdown */}
            <div className="grid grid-cols-4 gap-3 mt-8">
              {sectionScores.map(s => (
                <div key={s.section} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 font-bold uppercase">Part {s.section}</div>
                  <div className="text-2xl font-black mt-1">{s.correct}<span className="text-sm text-slate-400">/{s.total}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onReview}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-herb text-white rounded-xl font-bold text-lg hover:bg-herb/90 transition-all shadow-lg"
            >
              <Eye className="w-5 h-5" />
              Review Answers
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Back to Tests
            </button>
          </div>

          {/* Detailed Answers */}
          <div className="space-y-3">
            <h2 className="font-black text-xl text-slate-900">Detailed Results</h2>
            {results.details.some(d => !d.correctAnswer) && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-amber-800 text-sm font-medium">
                ⚠ Some questions in this test don&apos;t have answer keys loaded yet. Scores may not be fully accurate.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {results.details.map(d => (
                <div
                  key={d.qNum}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    d.isCorrect
                      ? 'border-green-200 bg-green-50'
                      : d.userAnswer
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    d.isCorrect ? 'bg-green-500 text-white' : d.userAnswer ? 'bg-red-500 text-white' : 'bg-slate-300 text-white'
                  }`}>
                    {d.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">Q{d.qNum}</span>
                      {d.isCorrect && d.userAnswer && (
                        <span className="text-xs text-green-600 font-bold">{d.userAnswer}</span>
                      )}
                      {!d.isCorrect && d.userAnswer && (
                        <span className="text-xs text-red-500 line-through">{d.userAnswer}</span>
                      )}
                      {!d.userAnswer && <span className="text-xs text-slate-400 italic">not answered</span>}
                    </div>
                    {d.correctAnswer ? (
                      <div className="text-sm font-bold text-green-700 flex items-center gap-1">
                        <span className="text-[10px] text-green-500 uppercase font-black">Ans:</span> {d.correctAnswer}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">answer key not available</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
