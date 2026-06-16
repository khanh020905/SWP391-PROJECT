import React, { useRef, useState, useEffect } from "react";
import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  onSend: (msg: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea up to 4 lines
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      // Max height for approx 4 lines
      const maxHeight = 120;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end space-x-2 p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-xl">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Đang trả lời..." : "Hỏi về IELTS (ngữ pháp, từ vựng)..."}
        disabled={disabled}
        className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-200 dark:border-gray-700 resize-none max-h-[120px] transition-colors"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shadow-sm ${
          disabled || !text.trim()
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
        }`}
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
}
