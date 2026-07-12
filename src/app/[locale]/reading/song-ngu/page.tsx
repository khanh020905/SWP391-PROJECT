"use client";

import React, { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

const COVERS = [
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv01.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv02.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv03.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv04.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv05.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv06.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv07.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv08.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv09.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv10.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv11.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv12.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv13.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv14.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv15.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv16.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv17.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv18.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv19.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv20.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv21.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv22.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv23.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv24.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv25.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv26.webp",
  "https://pub-c71988294a9b45099e83dad66bb73426.r2.dev/images/migrated/ielts_dict/covers/cv27.webp"
];

export default function BilingualBooksPage() {
  const bookRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverStates = useRef<{ target: number; current: number }[]>(
    COVERS.map(() => ({ target: 0, current: 0 }))
  );
  const lastZRefs = useRef<number[]>(COVERS.map(() => -1));

  useEffect(() => {
    let offset = 0;
    let lastTime = performance.now();
    const SPEED = 0.16; // radians / second
    const POP = 0.62;
    
    let cx = 0, cy = 0, rx = 0, ry = 0;
    const layout = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      cx = vw / 2;
      cy = vh / 2 - 20; // Slightly upper but not too much
      rx = Math.min(vw * 0.40, 560);
      ry = Math.max(vh * 0.32, 150); // Flatten the vertical radius slightly to narrow the top and bottom
    };

    let animationId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      offset += SPEED * dt;

      const k = 1 - Math.pow(0.001, dt);
      const N = COVERS.length;

      for (let i = 0; i < N; i++) {
        const el = bookRefs.current[i];
        if (!el) continue;

        const state = hoverStates.current[i];
        state.current += (state.target - state.current) * k;
        if (state.current < 0.0006) state.current = 0;
        const h = state.current;

        const a = (i / N) * Math.PI * 2 + offset;
        const x = cx + Math.sin(a) * rx;
        const y = cy - Math.cos(a) * ry;

        const t = (y - (cy - ry)) / (2 * ry);
        const depthScale = 0.74 + 0.34 * t;
        const depthOpacity = 0.5 + 0.5 * t;

        const sc = depthScale + POP * h;
        const op = depthOpacity + (1 - depthOpacity) * h;
        const lift = -26 * h;

        const tx = Math.round((x) * 10) / 10;
        const ty = Math.round((y + lift) * 10) / 10;
        const ts = Math.round(sc * 1000) / 1000;

        el.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%) scale(${ts}) translateZ(0)`;
        el.style.opacity = String(Math.round(op * 100) / 100);

        const z = Math.round(y) + (h > 0.02 ? 5000 : 0);
        if (z !== lastZRefs.current[i]) {
          el.style.zIndex = String(z);
          lastZRefs.current[i] = z;
        }
      }
      animationId = requestAnimationFrame(tick);
    };

    layout();
    window.addEventListener("resize", layout);
    animationId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", layout);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --green: #6e8a4a;
          --grid-line: rgba(255, 255, 255, 0.16);
          --grid-line-strong: rgba(255, 255, 255, 0.26);
          --cream: #f4f1e6;
        }
        .hero-bilingual {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 560px;
          overflow: hidden;
          isolation: isolate;
          background: var(--green);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .hero-bilingual .grid-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-color: var(--green);
          background-image:
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
            linear-gradient(var(--grid-line-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-strong) 1px, transparent 1px);
          background-size: 38px 38px, 38px 38px, 190px 190px, 190px 190px;
          background-position: -1px -1px, -1px -1px, -1px -1px, -1px -1px;
        }
        .hero-bilingual .grid-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(58% 58% at 50% 50%, rgba(72,93,46,0.62) 0%, rgba(110,138,74,0) 62%);
        }
        .hero-bilingual .stage { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
        .hero-bilingual .book {
          position: absolute;
          left: 0; top: 0;
          width: clamp(86px, 9.2vw, 132px);
          cursor: pointer;
          user-select: none;
          will-change: transform, opacity;
          transform: translate(-50%, -50%);
          perspective: 1200px;
          pointer-events: auto;
        }
        .hero-bilingual .book-inner {
          position: relative;
          width: 100%;
          --d: 14px;
          transform-style: preserve-3d;
          transform: rotateY(-25deg) rotateX(6deg);
          transition: transform .55s cubic-bezier(.2,.8,.25,1);
        }
        .hero-bilingual .book.is-hover .book-inner {
          transform: rotateY(-13deg) rotateX(3deg);
        }
        .hero-bilingual .face-front {
          position: relative;
          display: block;
          border-radius: 2px 6px 6px 2px;
          overflow: hidden;
          transform: translateZ(calc(var(--d) / 2));
          box-shadow: 0 2px 3px rgba(20,28,10,0.30), 0 20px 38px rgba(14,20,7,0.5);
        }
        .hero-bilingual .face-front img { display: block; width: 100%; height: auto; pointer-events: none; }
        .hero-bilingual .face-front .gloss {
          position: absolute; inset: 0; pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
          background: linear-gradient(105deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 30%);
        }
        .hero-bilingual .edge {
          position: absolute;
          background-color: #ece3cb;
          backface-visibility: hidden;
        }
        .hero-bilingual .edge-right {
          top: 0; right: 0; width: var(--d); height: 100%;
          transform-origin: right center;
          transform: rotateY(90deg);
          background-image: repeating-linear-gradient(to left,
            #f3ecd8 0px, #f3ecd8 1px, #c9bd9b 1.3px, #f3ecd8 2.4px);
          border-radius: 0 3px 3px 0;
          box-shadow: inset -2px 0 6px rgba(120,108,78,0.45);
        }
        .hero-bilingual .edge-bottom {
          left: 0; bottom: 0; width: 100%; height: var(--d);
          transform-origin: bottom center;
          transform: rotateX(-90deg);
          background-image: repeating-linear-gradient(to right,
            #f3ecd8 0px, #f3ecd8 1px, #c9bd9b 1.3px, #f3ecd8 2.4px);
          box-shadow: inset 0 -2px 6px rgba(120,108,78,0.4);
        }
        .hero-bilingual .edge-top {
          left: 0; top: 0; width: 100%; height: var(--d);
          transform-origin: top center;
          transform: rotateX(90deg);
          background-image: repeating-linear-gradient(to right,
            #f3ecd8 0px, #f3ecd8 1px, #c9bd9b 1.3px, #f3ecd8 2.4px);
          box-shadow: inset 0 2px 6px rgba(120,108,78,0.4);
        }
        .hero-bilingual .face-back {
          position: absolute; inset: 0;
          transform: translateZ(calc(var(--d) / -2));
          background: #20251a;
          border-radius: 2px 6px 6px 2px;
        }
        .hero-bilingual .edge-spine {
          top: 0; left: 0; width: var(--d); height: 100%;
          transform-origin: left center;
          transform: rotateY(-90deg);
          background: linear-gradient(to right, #1a1f14, #2f3622);
          border-radius: 3px 0 0 3px;
        }
        .hero-bilingual .center {
          position: absolute;
          z-index: 900;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: min(540px, 80vw);
          text-align: center;
          padding: 0 16px;
          pointer-events: none;
        }
        .hero-bilingual .eyebrow {
          font-size: clamp(10px, 0.95vw, 12.5px);
          font-weight: 600;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(244,241,230,0.66);
          margin-bottom: 16px;
        }
        .hero-bilingual .eyebrow .dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #d7e8a8;
          margin-right: 9px;
          vertical-align: middle;
          animation: blink 1.8s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:.35} 50%{opacity:1} }
        .hero-bilingual h1 {
          font-family: "Be Vietnam Pro", system-ui, sans-serif;
          font-weight: 800;
          font-size: clamp(30px, 4.4vw, 60px);
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: var(--cream);
          text-wrap: balance;
          text-shadow: 0 2px 26px rgba(40,54,22,0.5);
          margin: 0;
        }
        .hero-bilingual .note {
          margin: clamp(16px, 2.4vh, 26px) auto 0;
          width: min(440px, 78vw);
          font-size: clamp(11px, 0.92vw, 13px);
          line-height: 1.6;
          font-weight: 500;
          color: rgba(244,241,230,0.8);
          text-wrap: pretty;
          text-shadow: 0 1px 14px rgba(40,54,22,0.55);
        }
        .hero-bilingual .note p { margin: 0; }
        .hero-bilingual .note p + p { margin-top: 9px; }
        .hero-bilingual .note strong { color: var(--cream); font-weight: 700; }
      `}} />
      <div className="hero-bilingual relative w-full h-screen min-h-[560px] overflow-hidden">
        {/* Back Button */}
        <Link 
          href="/reading" 
          className="absolute top-8 left-8 z-[1000] inline-flex items-center text-[#d7e8a8] hover:text-white font-bold text-sm transition-colors drop-shadow-md bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Reading
        </Link>

        <div className="grid-bg"></div>
        <div className="stage" id="stage">
          {COVERS.map((src, i) => (
            <div 
              key={i} 
              className="book" 
              ref={(el) => { bookRefs.current[i] = el; }}
              onMouseEnter={() => { 
                hoverStates.current[i].target = 1; 
                if (bookRefs.current[i]) bookRefs.current[i].classList.add("is-hover"); 
              }}
              onMouseLeave={() => { 
                hoverStates.current[i].target = 0; 
                if (bookRefs.current[i]) bookRefs.current[i].classList.remove("is-hover"); 
              }}
            >
              <div className="book-inner">
                <div className="face-back"></div>
                <div className="edge edge-spine"></div>
                <div className="edge edge-right"></div>
                <div className="edge edge-bottom"></div>
                <div className="edge edge-top"></div>
                <div className="face-front">
                  <Image src={src} alt="Book cover" width={200} height={300} priority={true} className="w-full h-auto pointer-events-none" />
                  <div className="gloss"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="center">
          <div className="eyebrow"><span className="dot"></span>Sắp ra mắt</div>
          <h1>Tính năng đang<br />được cập nhật</h1>
          <div className="note">
            <p>Phát triển tính năng này là một khối lượng công việc <strong>siêu siêu khổng lồ</strong>, và các giáo viên siêu nhân của TID đang ngày đêm cặm cụi dịch những cuốn sách hay nhất quả đất để phục vụ việc học của các bạn.</p>
            <p>Chúng mình cố gắng hoàn thiện nhanh nhất có thể, nên mọi người đợi TID một tẹo nha.</p>
          </div>
        </div>
      </div>
    </>
  );
}
