# Design Spec: Quali IELTS Hero Section Redesign

## Goal
Redesign the homepage hero section of the **QualiCode / Quali IELTS** web application to look like the provided mockup (`hero-background-new.jpeg`) but with the branding modified to **Quali IELTS** instead of **The IELTS Dictionary** (TID).

## Background Asset
- File Path: `public/assets/hero-background-new.jpeg`
- Size: 1.7 MB (1708779 bytes)
- Contains: Left-aligned heading & copy, green call-to-actions, dinosaur mascot with speech bubble, volcano scenery, wooden sign, and top header banner.

## Layout Strategy: HTML/CSS Overlay Hybrid
Since `hero-background-new.jpeg` contains beautiful hand-drawn assets (dinosaur, scenery, wooden sign), we will use this image as the hero section background. We will overlay dynamic HTML components over the burned-in text sections to replace the old branding and make all text crisp, interactive, and fully functional.

### 1. Header Component
- **Positioning**: Fixed or relative top of the page.
- **Styling**: `bg-[#e5ebd8] z-30 border-b border-stone-200/20`
- **Branding**:
  - Logo: Green rounded square icon containing a white capital "Q".
  - Text: **Quali IELTS** (instead of QualiCode or The IELTS Dictionary).
- **Navigation Menu**:
  - Font: Bold, dark green text (`text-[#112d14] hover:text-[#255229]`).
  - Links: `Home`, `Speaking AI`, `Review Đáp án`, `Cambridge Cams`, `Pricing`, `About Us`.
- **User Session Dropdown**:
  - Covered dynamically with the existing Next.js / Supabase profile menu component.

### 2. Main Hero Area Layout
- **Container**: `relative w-full h-[55.8vw] min-h-[640px] max-h-[720px] bg-top bg-cover bg-no-repeat`
- **Background Image**: `url('/assets/hero-background-new.jpeg')`

### 3. Left-Side HTML Overlays
We will position HTML elements precisely over the screenshot's left-hand text.
- **Pill Badge**:
  - Text: `QUALI IELTS`
  - Position: Sits directly over the old `THEIELTSDICTIONARY` pill.
  - Style: `bg-[#ebefe0] text-[#2c5324] text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase`
- **Main Heading**:
  - Text: `Nền tảng \n Luyện thi IELTS`
  - Style: `text-[#112d14] font-extrabold text-5xl md:text-7xl leading-tight`
- **Subtitle**:
  - Text: `Đầy đủ tài liệu, bài luyện, phương pháp và từ vựng giúp bạn chinh phục IELTS dễ dàng hơn mỗi ngày.`
  - Style: `text-[#4e5c4c] text-lg max-w-[500px]`
- **Primary Button**:
  - Text: `Bài viết của Quali IELTS →`
  - Position: Direct overlay of the green TID button.
  - Style: `bg-[#2b5424] hover:bg-[#1f3e1b] text-white font-bold text-sm px-6 py-3 rounded-full shadow-md transition-all cursor-pointer`
- **Secondary Link**:
  - Text: `Khám phá tài liệu miễn phí >`
  - Style: `text-[#2b5424] hover:underline font-bold text-sm`

### 4. Right-Side Mascot Speech Bubble Overlay
- **Target**: Dinosaur speech bubble.
- **New Text**: `"Bạn in the house! Quali IELTS mở khóa bài học mới nè."`
- **Style**: Styled speech bubble component with solid white background `bg-white`, border, shadow, and text aligned correctly to mask the burned-in bubble content underneath.
