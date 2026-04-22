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

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-green-600 text-white"
            : "bg-white text-slate-700 ring-1 ring-slate-200"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {message.content}
        </p>
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
