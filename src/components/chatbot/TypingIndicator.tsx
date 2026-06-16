import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl rounded-tl-none max-w-[80px]">
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
