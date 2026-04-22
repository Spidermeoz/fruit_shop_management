import React, { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useChatbot } from "../../../hooks/useChatbot";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatQuickActions from "./ChatQuickActions";
import ChatRecommendationList from "./ChatRecommendationList";
import ChatTypingIndicator from "./ChatTypingIndicator";

const ChatWidget: React.FC = () => {
  const {
    isOpen,
    isLoading,
    messages,
    recommendations,
    error,
    close,
    reset,
    sendMessage,
    quickActions,
  } = useChatbot();

  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessages = messages.length > 0;

  const introBlocks = useMemo(
    () => ({
      title: "Trợ lý gợi ý hoa quả",
      description:
        "Mô tả nhu cầu của bạn, mình sẽ gợi ý sản phẩm phù hợp theo mục đích sử dụng, độ ngọt và quy cách.",
    }),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages, recommendations, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    textareaRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isLoading) return;
    setDraft("");
    await sendMessage(content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex h-[min(78vh,720px)] w-[min(calc(100vw-2rem),420px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[#f8fbf8] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {introBlocks.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {introBlocks.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng chatbot"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!hasMessages ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-green-200 bg-white/80 p-4 text-sm text-slate-600">
            <p>
              Bạn có thể hỏi như:{" "}
              <span className="font-medium text-slate-800">
                “Tôi muốn hoa quả ít ngọt”
              </span>{" "}
              hoặc{" "}
              <span className="font-medium text-slate-800">
                “Gợi ý loại phù hợp để ép nước”
              </span>
              .
            </p>
            <ChatQuickActions
              items={quickActions}
              onSelect={(prompt) => void sendMessage(prompt)}
              disabled={isLoading}
            />
          </div>
        ) : null}

        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {isLoading ? <ChatTypingIndicator /> : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        {!isLoading && recommendations.length > 0 ? (
          <ChatRecommendationList items={recommendations} />
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-white p-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-green-400 focus-within:bg-white">
          <textarea
            ref={textareaRef}
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhập nhu cầu của bạn..."
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            maxLength={1000}
          />
          <div className="mt-2 flex items-center justify-between gap-3 px-2 pb-1">
            <span className="text-[11px] text-slate-400">
              Gợi ý chỉ mang tính tham khảo.
            </span>
            <button
              type="submit"
              disabled={isLoading || !draft.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Gửi
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatWidget;
