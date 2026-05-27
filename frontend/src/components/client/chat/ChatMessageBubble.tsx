import React from "react";
import type { ChatMessage } from "../../../types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Render nội dung assistant với basic markdown-like formatting:
 * - **text** → <strong>
 * - Dòng bắt đầu bằng số. → danh sách có số
 * - Dòng bắt đầu bằng ✓ / ↳ / ⚠️ → styled indented line
 * - Xuống dòng → proper line breaks
 */
const renderAssistantContent = (content: string) => {
  const lines = content.split("\n");

  return lines.map((line, lineIndex) => {
    // Inline bold: **text**
    const renderInline = (text: string): React.ReactNode => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-slate-800">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    const trimmed = line.trim();
    if (!trimmed) {
      // Dòng trống → spacing
      return <div key={lineIndex} className="h-2" />;
    }

    // Dòng cảnh báo ⚠️
    if (trimmed.startsWith("⚠️")) {
      return (
        <div
          key={lineIndex}
          className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {trimmed}
        </div>
      );
    }

    // Dòng giải thích ✓ hoặc ↳ (indented reason)
    if (trimmed.startsWith("✓") || trimmed.startsWith("↳")) {
      return (
        <div key={lineIndex} className="ml-4 mt-0.5 text-xs text-slate-500">
          {renderInline(trimmed)}
        </div>
      );
    }

    // Dòng số thứ tự (1. 2. 3.)
    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={lineIndex} className="mt-2 text-sm font-medium text-slate-700">
          {renderInline(trimmed)}
        </div>
      );
    }

    // Dòng bình thường
    return (
      <div key={lineIndex} className="text-sm leading-6 text-slate-700">
        {renderInline(trimmed)}
      </div>
    );
  });
};

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-green-600 text-white"
            : "bg-white text-slate-700 ring-1 ring-slate-200"
        }`}
      >
        {isUser ? (
          // User bubble: plain text
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.content}
          </p>
        ) : (
          // Assistant bubble: structured rendering
          <div className="space-y-0.5 break-words">
            {renderAssistantContent(message.content)}
          </div>
        )}
        <div
          className={`mt-1 text-[11px] ${isUser ? "text-green-100" : "text-slate-400"}`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
