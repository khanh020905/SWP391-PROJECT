import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Xin chào! Mình là trợ lý IELTS AI. Hỏi mình về ngữ pháp, từ vựng hoặc bất kỳ thắc mắc IELTS nào nhé! 📚",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages list changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    setError(null);

    const userMessageId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Add temporary assistant message for streaming
    const assistantMessageId = Math.random().toString(36).substring(7);
    const tempAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Gặp sự cố khi kết nối với máy chủ AI.");
      }

      setMessages((prev) => [...prev, tempAssistantMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          // Update the streaming assistant message in state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Đã xảy ra lỗi không mong muốn.");
      // Remove empty temp message if it exists
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
          <div>
            <h3 className="font-semibold text-sm">Trợ lý IELTS AI</h3>
            <span className="text-[10px] text-blue-100 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-ping" />
              Sẵn sàng giải đáp
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/50 dark:bg-gray-950/20 scroll-smooth"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex w-full items-start space-x-3 my-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shrink-0">
              <Sparkles size={14} className="animate-spin" />
            </div>
            <TypingIndicator />
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 my-2 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input panel */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
