import React from "react";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  const formatMessageContent = (text: string) => {
    if (!text) return null;
    
    return text.split("\n").map((line, idx) => {
      // Bold text formatting (**bold**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }
        elements.push(
          <strong key={match.index} className="font-bold text-gray-900 dark:text-white">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      // Check if it is a bullet list item
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        // Strip the bullet marker
        const markerLength = line.trim().startsWith("* ") ? 2 : 2;
        const indentClass = line.startsWith("  ") ? "ml-6" : "ml-4";
        return (
          <li key={idx} className={`${indentClass} list-disc my-1 text-gray-800 dark:text-gray-200 leading-relaxed`}>
            {elements.length > 0 ? elements : line.trim().substring(markerLength)}
          </li>
        );
      }

      // Render standard paragraph
      return (
        <p key={idx} className="min-h-[1.2rem] my-1 text-gray-800 dark:text-gray-200 leading-relaxed">
          {elements.length > 0 ? elements : line}
        </p>
      );
    });
  };

  return (
    <div className={`flex w-full items-start space-x-3 my-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
      {/* Avatar Icon */}
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm shrink-0 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm border ${
          isUser
            ? "bg-blue-600 text-white border-blue-700 rounded-tr-none text-left"
            : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-150 dark:border-gray-750 rounded-tl-none text-left"
        }`}
      >
        <div className={`text-sm ${isUser ? "[&_strong]:text-white [&_li]:text-white" : ""}`}>
          {formatMessageContent(content)}
        </div>
      </div>
    </div>
  );
}
