import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { chatClient } from "../services/api/chatClient";
import type {
  ChatContextValue,
  ChatMessage,
  ChatQuickAction,
  ChatRecommendation,
} from "../types/chat";

const STORAGE_KEY = "phase9-chatbot-session-id";

const quickActions: ChatQuickAction[] = [
  {
    id: "weight-loss",
    label: "Gợi ý giảm cân",
    prompt:
      "Tôi muốn hoa quả phù hợp cho nhu cầu giảm cân, ưu tiên loại dễ ăn và ít ngọt.",
  },
  {
    id: "low-sugar",
    label: "Ít ngọt",
    prompt: "Gợi ý giúp tôi các loại hoa quả ít ngọt, dễ ăn hằng ngày.",
  },
  {
    id: "juicing",
    label: "Ép nước",
    prompt: "Tôi cần vài loại hoa quả phù hợp để ép nước tại nhà.",
  },
  {
    id: "gifting",
    label: "Biếu tặng",
    prompt:
      "Tôi muốn chọn hoa quả để biếu tặng, ưu tiên hình thức đẹp và size phù hợp.",
  },
];

const ChatbotContext = createContext<ChatContextValue | undefined>(undefined);

const createLocalMessage = (
  role: ChatMessage["role"],
  content: string,
): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp: new Date().toISOString(),
  messageType: "text",
});

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendations, setRecommendations] = useState<ChatRecommendation[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = Number(saved);
    if (Number.isInteger(parsed) && parsed > 0) {
      setSessionId(parsed);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, String(sessionId));
  }, [sessionId]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const reset = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setRecommendations([]);
    setError(null);
    hydratedRef.current = false;
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const session = await chatClient.createSession({
      channel: "web",
      metadataJson: {
        pageUrl: typeof window !== "undefined" ? window.location.href : null,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });
    setSessionId(session.id);
    return session.id;
  }, [sessionId]);

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await chatClient.listMessages(sessionId, {
        page: 1,
        limit: 50,
      });
      setMessages(result.rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải lịch sử hội thoại",
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen || !sessionId || hydratedRef.current) return;
    hydratedRef.current = true;
    void loadHistory();
  }, [isOpen, sessionId, loadHistory]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const optimisticUser = createLocalMessage("user", trimmed);
      setMessages((prev) => [...prev, optimisticUser]);
      setError(null);
      setIsLoading(true);
      setIsOpen(true);

      try {
        const ensuredSessionId = await ensureSession();
        const result = await chatClient.sendMessage(ensuredSessionId, {
          content: trimmed,
        });

        setSessionId(result.session.id);
        setMessages((prev) => {
          const withoutOptimistic = prev.filter(
            (item) => item.id !== optimisticUser.id,
          );
          return [
            ...withoutOptimistic,
            result.userMessage,
            result.assistantMessage,
          ];
        });
        setRecommendations(result.recommendations);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể gửi tin nhắn";
        setError(message);
        setMessages((prev) => [
          ...prev,
          createLocalMessage(
            "assistant",
            "Xin lỗi, mình chưa thể phản hồi ngay lúc này. Bạn thử lại sau một chút nhé.",
          ),
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureSession],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      isOpen,
      isLoading,
      sessionId,
      messages,
      recommendations,
      error,
      quickActions,
      open,
      close,
      toggle,
      reset,
      sendMessage,
      loadHistory,
    }),
    [
      close,
      error,
      isLoading,
      isOpen,
      loadHistory,
      messages,
      open,
      recommendations,
      reset,
      sendMessage,
      sessionId,
      toggle,
    ],
  );

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
};

export const useChatbotContext = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbotContext must be used within ChatbotProvider");
  }
  return context;
};
