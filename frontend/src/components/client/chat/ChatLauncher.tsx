import React from "react";
import { useChatbot } from "../../../hooks/useChatbot";
import ChatWidget from "./ChatWidget";

const ChatLauncher: React.FC = () => {
  const { isOpen, toggle } = useChatbot();

  return (
    <>
      <ChatWidget />
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-5 right-4 z-[99] inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition hover:scale-[1.03] hover:bg-green-700"
        aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}
      >
        <span className="text-2xl leading-none">{isOpen ? "×" : "💬"}</span>
      </button>
    </>
  );
};

export default ChatLauncher;
