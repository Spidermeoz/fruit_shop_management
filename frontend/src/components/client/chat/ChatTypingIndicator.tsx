import React from "react";

const ChatTypingIndicator: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 shadow-sm">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
    </div>
  );
};

export default ChatTypingIndicator;
