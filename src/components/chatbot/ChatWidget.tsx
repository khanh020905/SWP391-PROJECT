"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || "";

  // Detect pages with fixed bottom bars, pagination, or floating controls
  const hasBottomBar =
    pathname.includes("/admin") ||
    pathname.includes("/cam/") ||
    pathname.includes("/test") ||
    pathname.includes("/exam") ||
    pathname.includes("/practice") ||
    pathname.includes("/dictation") ||
    pathname.includes("/shadowing") ||
    pathname.includes("/writing") ||
    pathname.includes("/speaking") ||
    pathname.includes("/reading");

  // Elevate ChatWidget position above bottom bars/pagination (bottom-20 = 80px) to prevent overlap
  const positionClass = hasBottomBar
    ? "fixed bottom-20 right-6 z-50 flex flex-col items-end"
    : "fixed bottom-6 right-6 z-50 flex flex-col items-end";

  return (
    <div className={positionClass}>
      {/* Chat Panel Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[360px] xs:w-[380px] h-[520px] max-h-[80vh] shadow-2xl mb-4"
          >
            <ChatPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-colors cursor-pointer bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <MessageCircle size={26} />
        </motion.div>
      </motion.button>
    </div>
  );
}
