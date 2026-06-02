"use client";

import { useReadingTest } from "@/context/ReadingTestContext";

export default function PassagePanel() {
  const { passage } = useReadingTest();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4 md:px-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
          {passage.sectionLabel}
        </p>
        <h1 className="mt-1 text-lg font-bold leading-snug text-gray-900 md:text-xl">
          {passage.title}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-gray-500 italic">
          {passage.subtitle}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
        <article className="max-w-prose space-y-5 select-text">
          {passage.paragraphs.map((para) => (
            <section key={para.id} id={para.id} className="scroll-mt-4">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-600/80">
                {para.label}
              </p>
              <p className="text-[15px] leading-[1.75] text-gray-800">{para.text}</p>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
