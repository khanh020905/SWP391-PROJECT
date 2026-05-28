# Quali IELTS Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the main hero section of the landing page to match the dinosaur and nature theme of `hero-background-new.jpeg` while replacing all TID/IELTS Dictionary branding with "Quali IELTS".

**Architecture:** We will use `hero-background-new.jpeg` as the aspect-ratio based background for the hero container. We will wrap the existing HTML header in a solid `#e5ebd8` wrapper to cover the burned-in header on the image, and position interactive HTML elements (badges, buttons, and a speech bubble) dynamically on top of the background to mask the old branding with "Quali IELTS".

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Lucide React

---

## Chunk 1: Header Branding Update

### Task 1: Update Navigation Header Styling and Logo
**Files:**
- Modify: `src/app/page.tsx:64-170`

- [ ] **Step 1: Replace Header with Covered solid wrapper and Quali IELTS logo**
  Wrap the header tag in a `w-full bg-[#e5ebd8] sticky top-0 z-30 border-b border-[#d4dec7]` container.
  Replace the "QualiCode" text with "Quali IELTS" and add a stylized green "Q" logo.
  Update the link text styles to match the natural green aesthetic.
  
  ```tsx
  // Target: Header component replacement
  <div className="w-full bg-[#e5ebd8] sticky top-0 z-30 border-b border-[#d8e0cc]">
    <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between px-9 py-5">
      <div className="flex items-center gap-2.5 text-xl font-black text-[#1b3d1e]">
        <div className="w-8 h-8 rounded-lg bg-[#2b5424] flex items-center justify-center text-white font-black text-lg shadow-sm">
          Q
        </div>
        <span className="tracking-tight">Quali IELTS</span>
      </div>
      <nav className="hidden items-center gap-8 text-sm font-bold text-[#4e5c4c] md:flex">
        <Link href="/" className="hover:text-[#2b5424] transition-colors">Home</Link>
        <Link href="/speaking" className="text-[#2b5424] font-black flex items-center gap-1 transition-all hover:scale-105">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#2b5424]" />
          <span>Speaking AI</span>
        </Link>
        <Link href="/exam/review" className="hover:text-[#2b5424] transition-colors">Review Đáp án</Link>
        <a href="#" className="hover:text-[#2b5424] transition-colors">Cambridge Cams</a>
        <a href="#" className="hover:text-[#2b5424] transition-colors">Pricing</a>
        <a href="#" className="hover:text-[#2b5424] transition-colors">About Us</a>
      </nav>
      {/* Dynamic Auth Header section */}
      ...
  ```

- [ ] **Step 2: Commit Header changes**
  Run: `git commit -am "feat: update navigation header background and logo to Quali IELTS"`

---

## Chunk 2: Hero Section & Overlays Implementation

### Task 2: Implement Hero Section Background and Layout
**Files:**
- Modify: `src/app/page.tsx:171-228`

- [ ] **Step 1: Replace Hero section container and absolute positioning overlays**
  Replace the old hero section with the new background image `/assets/hero-background-new.jpeg`.
  Create absolute-positioned overlay components matching the locations in the mockup.
  
  Code to write:
  ```tsx
  <section
    className="relative w-full h-[55.8vw] min-h-[580px] max-h-[720px] bg-no-repeat bg-top bg-cover md:bg-contain overflow-hidden bg-[#e5ebd8]"
    style={{ backgroundImage: "url('/assets/hero-background-new.jpeg')" }}
  >
    {/* Full Screen Overlay Container that matches the aspect ratio of the image */}
    <div className="absolute inset-0 mx-auto w-full max-w-[1160px] h-full pointer-events-none select-none">
      
      {/* 1. Brand Pill Overlay (Covers "THEIELTSDICTIONARY") */}
      <div className="absolute left-[5.5%] md:left-[7.2%] top-[24%] pointer-events-auto">
        <span className="inline-flex rounded-full bg-[#f6f8f0] border border-[#d8e0cc] px-4 py-1.5 text-[9px] md:text-[10px] font-black tracking-wider text-[#2b5424] uppercase shadow-sm">
          QUALI IELTS
        </span>
      </div>

      {/* 2. Brand Button Overlay (Covers "Bài viết của TID →") */}
      <div className="absolute left-[5.5%] md:left-[7.2%] top-[78.2%] pointer-events-auto">
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-full bg-[#2b5424] hover:bg-[#1f3e1b] px-6 py-3.5 text-xs md:text-sm font-black text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer select-none"
        >
          Bài viết của Quali IELTS →
        </Link>
      </div>

      {/* 3. Free Resource Link Overlay (Covers "Khám phá tài liệu miễn phí >") */}
      <div className="absolute left-[33%] md:left-[35%] top-[79.5%] pointer-events-auto">
        <Link
          href="/resources"
          className="text-xs md:text-sm font-black text-[#2b5424] hover:underline cursor-pointer select-none flex items-center gap-1"
        >
          <span>Khám phá tài liệu miễn phí</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 4. Dinosaur Speech Bubble Overlay (Covers the bubble in the image) */}
      <div className="absolute left-[47%] md:left-[51.8%] top-[14%] pointer-events-auto w-[240px] md:w-[280px]">
        <div className="relative bg-white border border-[#d4dec7] rounded-2xl p-4 shadow-md text-left">
          <p className="text-[11px] md:text-xs font-bold text-[#1b3d1e] leading-relaxed">
            Bạn in the house! <span className="text-[#2b5424] font-black">Quali IELTS</span> mở khóa bài học mới nè.
          </p>
          {/* Arrow / Bubble tail */}
          <div className="absolute bottom-[-8px] left-[50%] -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-[#d4dec7] rotate-45" />
        </div>
      </div>

      {/* 5. Follow Us On Links */}
      <div className="absolute left-[5.5%] md:left-[7.2%] top-[65%] pointer-events-auto flex items-center gap-2">
        <span className="text-[10px] font-black tracking-wider text-[#4e5c4c] uppercase mr-1">Follow us on</span>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-[#1877f2] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a
          href="https://tiktok.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.032 2.61-.005 3.91-.012.08 1.543.705 3.013 1.782 4.12 1.094 1.097 2.574 1.71 4.123 1.776v3.832c-1.637-.024-3.238-.54-4.59-1.455-.41-.284-.795-.61-1.144-.975v7.242c.04 3.738-2.61 7.158-6.31 7.787-3.79.69-7.55-1.71-8.525-5.46-.994-3.593 1.077-7.614 4.67-8.73 1.114-.363 2.296-.39 3.424-.132v3.916c-.846-.226-1.74-.183-2.553.18-1.282.535-2.096 1.942-1.93 3.325.178 1.637 1.63 2.916 3.28 2.766 1.488-.066 2.72-1.218 2.87-2.7.072-1.042.023-2.094.043-3.14V0h.07z"/>
          </svg>
        </a>
      </div>

    </div>
  </section>
  ```

- [ ] **Step 2: Commit Hero changes**
  Run: `git commit -am "feat: implement dinosaur background and Quali IELTS overlays"`

---

## Chunk 3: Verification & Polish

### Task 3: Build Verification and Run App
**Files:**
- Verify: `src/app/page.tsx`

- [ ] **Step 1: Check compile and build status**
  Run: `npm run build`
  Expected: Builds successfully with no TypeScript or linting errors.

- [ ] **Step 2: Commit any build fixes**
  Run: `git commit -am "fix: resolve any build or styling compilation errors"`
