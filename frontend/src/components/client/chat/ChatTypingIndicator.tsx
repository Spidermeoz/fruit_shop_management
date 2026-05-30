import React, { useEffect, useState } from "react";

const THINKING_MESSAGES = [
  "Đang tìm sản phẩm phù hợp...",
  "Đang phân tích nhu cầu của bạn...",
  "Đang chọn lọc từ kho hàng...",
  "Sắp có kết quả rồi...",
];

const ChatTypingIndicator: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-start">
      <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2.5">
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-green-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-green-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-green-400" />
          </div>
          {/* Rotating thinking message */}
          <span
            key={msgIndex}
            className="animate-fade-in text-xs text-slate-500"
            style={{
              animation: "fadeIn 0.4s ease-in-out",
            }}
          >
            {THINKING_MESSAGES[msgIndex]}
          </span>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ChatTypingIndicator;
