export type ChatRole = "user" | "assistant" | "system";
export type ChatMessageType = "text" | "recommendation" | "system";

export interface ChatSessionSummary {
  id: number;
  userId?: number | null;
  sessionToken?: string;
  channel?: string;
  status?: string;
  startedAt?: string;
  endedAt?: string | null;
  lastMessageAt?: string | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string | number;
  role: ChatRole;
  content: string;
  timestamp?: string;
  messageType?: ChatMessageType;
  intent?: string | null;
}

export interface ChatRecommendation {
  id?: string | number;
  productId?: number;
  productVariantId?: number | null;
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  variantTitle?: string | null;
  reason?: string | null;
  score?: number | null;
}

export interface CreateChatSessionPayload {
  channel?: string;
  metadataJson?: Record<string, unknown> | null;
  sessionToken?: string;
}

export interface SendChatMessagePayload {
  content: string;
}

export interface SendChatMessageResponse {
  session: ChatSessionSummary;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  recommendations: ChatRecommendation[];
  extractedIntent?: Record<string, unknown> | null;
  filters?: Record<string, unknown> | null;
  safety?: Record<string, unknown> | null;
}

export interface ChatMessagesResponse {
  rows: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatQuickAction {
  id: string;
  label: string;
  prompt: string;
}

export interface ChatContextValue {
  isOpen: boolean;
  isLoading: boolean;
  sessionId: number | null;
  messages: ChatMessage[];
  recommendations: ChatRecommendation[];
  error: string | null;
  quickActions: ChatQuickAction[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: () => Promise<void>;
}
