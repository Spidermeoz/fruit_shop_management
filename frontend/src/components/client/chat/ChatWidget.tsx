import React, {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const charCount = draft.length;
  const maxChars = 1000;

  const introBlocks = useMemo(
    () => ({
      title: "Trợ lý gợi ý hoa quả",
      description:
        "Mô tả nhu cầu của bạn, mình sẽ gợi ý sản phẩm phù hợp theo mục đích sử dụng, độ ngọt và quy cách.",
    }),
    [],
  );

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages, recommendations, isLoading]);

  // Focus textarea khi mở
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isLoading) return;
    setDraft("");
    await sendMessage(content);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter → gửi | Shift+Enter → xuống dòng
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex h-[min(82vh,740px)] w-[min(calc(100vw-2rem),440px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[#f8fbf8] shadow-2xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar icon */}
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-lg">
            🍃
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {introBlocks.title}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {introBlocks.description}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={reset}
            title="Bắt đầu cuộc trò chuyện mới"
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng chatbot"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Body (scrollable) ───────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Intro / Quick actions */}
        {!hasMessages ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-green-200 bg-white/80 p-4 text-sm text-slate-600">
            <p>
              Bạn có thể hỏi như:{" "}
              <span className="font-medium text-slate-800">
                "Tôi muốn hoa quả ít ngọt"
              </span>{" "}
              hoặc{" "}
              <span className="font-medium text-slate-800">
                "Gợi ý loại phù hợp để ép nước"
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

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {isLoading ? <ChatTypingIndicator /> : null}

        {/* Error banner */}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        {/* Recommendation cards */}
        {!isLoading && recommendations.length > 0 ? (
          <ChatRecommendationList items={recommendations} />
        ) : null}

        <div ref={endRef} />
      </div>

      {/* ── Input form ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-white p-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-green-400 focus-within:bg-white focus-within:shadow-sm">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập nhu cầu của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
            className="max-h-[140px] min-h-[40px] w-full resize-none overflow-auto bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            maxLength={maxChars}
            disabled={isLoading}
          />

          <div className="mt-1 flex items-center justify-between gap-3 px-2 pb-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Gợi ý mang tính tham khảo.</span>
              {charCount > maxChars * 0.8 ? (
                <span
                  className={
                    charCount >= maxChars ? "text-red-500" : "text-amber-500"
                  }
                >
                  {charCount}/{maxChars}
                </span>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isLoading || !draft.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang xử lý
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Gửi
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatWidget;
