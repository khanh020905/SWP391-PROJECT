"use client";

// 2D bookshelf UI — ported from The IELTS Dictionary
// (Website-Ielts frontend/src/components/listening/Bookshelf2D.tsx).

import React, { useState } from "react";
import { CamVolume } from "@/lib/listening/dictationParser";
import { Play, ChevronRight, BookOpen, Headphones, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Bookshelf2DProps {
  volumes: CamVolume[];
}

export function Bookshelf2D({ volumes }: Bookshelf2DProps) {
  const [expandedVolId, setExpandedVolId] = useState<string | null>(null);

  const bookColors: Record<string, string> = {
    cam10: "bg-[#7c2d12]", cam11: "bg-[#1e3a8a]", cam12: "bg-[#064e3b]", cam13: "bg-[#4c1d95]",
    cam14: "bg-[#831843]", cam15: "bg-[#451a03]", cam16: "bg-[#164e63]", cam17: "bg-[#3f2b96]",
    cam18: "bg-[#0f172a]", cam19: "bg-[#1e293b]", cam20: "bg-[#b45309]",
    spelling: "bg-[#be123c]", numbers: "bg-[#15803d]", ipa: "bg-[#7e22ce]", conversations: "bg-[#0369a1]",
    other: "bg-[#475569]"
  };

  const borderColors: Record<string, string> = {
    cam10: "border-[#7c2d12]/20", cam11: "border-[#1e3a8a]/20", cam12: "border-[#064e3b]/20", cam13: "border-[#4c1d95]/20",
    cam14: "border-[#831843]/20", cam15: "border-[#451a03]/20", cam16: "border-[#164e63]/20", cam17: "border-[#3f2b96]/20",
    cam18: "border-[#0f172a]/20", cam19: "border-[#1e293b]/20", cam20: "border-[#b45309]/20",
    spelling: "border-[#be123c]/20", numbers: "border-[#15803d]/20", ipa: "border-[#7e22ce]/20", conversations: "border-[#0369a1]/20",
    other: "border-[#475569]/20"
  };

  return (
    <div className="flex flex-col space-y-4">
      {volumes.map((vol) => (
        <div
          key={vol.id}
          className={`bg-white rounded-3xl border ${expandedVolId === vol.id ? borderColors[vol.id] + " shadow-xl" : "border-gray-100 shadow-sm"} overflow-hidden transition-all duration-500`}
        >
          {/* Volume Header */}
          <button
            onClick={() => setExpandedVolId(expandedVolId === vol.id ? null : vol.id)}
            className={`w-full flex items-center p-6 text-left transition-all duration-300 ${expandedVolId === vol.id ? 'bg-slate-50' : 'hover:bg-gray-50'}`}
          >
            {/* Realistic Physical Book Icon */}
            <div className="relative mr-8 flex-shrink-0 group">
              {/* Stacked Pages Effect (Shadow/Depth) */}
              <div className="absolute top-1 -right-1 w-full h-full bg-gray-200 rounded-r-lg -z-10" />
              <div className="absolute top-0.5 -right-0.5 w-full h-full bg-gray-100 rounded-r-lg -z-10" />

              <div className={`w-16 h-20 ${bookColors[vol.id] || "bg-slate-700"} rounded-l-md rounded-r-lg shadow-[4px_0_15px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center text-white relative overflow-hidden`}>
                {/* Book Spine Detail */}
                <div className="absolute left-0 top-0 w-2 h-full bg-black/20 border-r border-white/10" />
                <div className="absolute left-2.5 top-0 w-0.5 h-full bg-white/5" />

                {/* Gold Accent Lines */}
                <div className="absolute left-0 top-4 w-2 h-[1px] bg-yellow-500/40" />
                <div className="absolute left-0 bottom-4 w-2 h-[1px] bg-yellow-500/40" />

                <span className="text-[8px] font-black uppercase opacity-60 tracking-[1px] mb-1">
                  {vol.id.startsWith('cam') ? 'IELTS' : 'SKILL'}
                </span>
                <span className="text-3xl font-black drop-shadow-md">
                  {vol.id.startsWith('cam') ? vol.id.replace("cam", "") : vol.id.charAt(0).toUpperCase()}
                </span>

                {/* Subtle Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-black text-moss text-xl uppercase tracking-tight">{vol.title}</h3>
                {expandedVolId === vol.id && (
                  <span className="px-2 py-0.5 bg-herb-100 text-herb-700 text-[10px] font-black rounded-md uppercase tracking-wider">Active</span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400 font-medium">
                <span className="flex items-center"><BookOpen className="w-3.5 h-3.5 mr-1.5" /> {Object.keys(vol.tests).length} Tests</span>
                <span className="flex items-center"><Headphones className="w-3.5 h-3.5 mr-1.5" /> Listening</span>
              </div>
            </div>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-gray-100 transition-all duration-500 ${expandedVolId === vol.id ? 'bg-herb-600 text-white border-herb-600 rotate-90' : 'text-gray-300'}`}>
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>

          {/* Table-like Content */}
          <AnimatePresence>
            {expandedVolId === vol.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-white border-t border-gray-100">
                  <div className="space-y-10">
                    {Object.entries(vol.tests)
                      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
                      .map(([testName, tasks]) => (
                      <div key={testName} className="relative">
                        <div className="flex items-center mb-6">
                          <h4 className="text-sm font-black text-herb-600 uppercase tracking-[3px]">
                            {testName}
                          </h4>
                          <div className="flex-1 h-px bg-herb-100 ml-6" />
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-2">
                          <div className="col-span-6 md:col-span-8 text-left">Lesson Name</div>
                          <div className="col-span-3 md:col-span-2 text-center">Questions</div>
                          <div className="col-span-3 md:col-span-2 text-right">Action</div>
                        </div>

                        {/* Table Rows */}
                        <div className="space-y-1">
                          {tasks.map((task) => (
                            <Link
                              key={task.id}
                              href={`/listening/dictation/${task.id}`}
                              className="grid grid-cols-12 gap-4 items-center p-4 rounded-2xl hover:bg-herb-50 group transition-all duration-300 border border-transparent hover:border-herb-100"
                            >
                              <div className="col-span-6 md:col-span-8 flex items-center">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center mr-4 text-slate-400 group-hover:bg-herb-600 group-hover:text-white transition-all">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-gray-700 group-hover:text-moss transition-colors">
                                  {task.title.split("-").pop()?.trim() || task.title}
                                </span>
                              </div>
                              <div className="col-span-3 md:col-span-2 text-center">
                                <span className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                                  Dictation
                                </span>
                              </div>
                              <div className="col-span-3 md:col-span-2 flex justify-end">
                                <div className="px-4 py-2 bg-slate-50 text-slate-400 group-hover:bg-herb-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-herb-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
                                  <Play className="w-3 h-3 mr-2 fill-current" />
                                  Start
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
