import type {
  ChatMessage,
  ChatMessagesResponse,
  ChatRecommendation,
  ChatSessionSummary,
  CreateChatSessionPayload,
  SendChatMessagePayload,
  SendChatMessageResponse,
} from "../../types/chat";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1/client/chat`;

const buildHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
});

const requestJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but got ${contentType || "unknown"}: ${text.slice(0, 200)}`,
    );
  }

  const json = text
    ? (JSON.parse(text) as {
        success?: boolean;
        data?: unknown;
        meta?: Record<string, unknown>;
        message?: string;
      })
    : {};

  if (!response.ok) {
    throw new Error(String(json?.message ?? "Không thể kết nối chatbot"));
  }

  return json as T;
};

const toIsoString = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const normalizeMessage = (message: any): ChatMessage => ({
  id:
    message?.id ??
    `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: (message?.senderType ??
    message?.role ??
    "assistant") as ChatMessage["role"],
  content: String(message?.content ?? ""),
  timestamp: toIsoString(message?.createdAt ?? message?.created_at),
  messageType: (message?.messageType ??
    message?.message_type ??
    "text") as ChatMessage["messageType"],
  intent: message?.intent ?? null,
});

const normalizeSession = (session: any): ChatSessionSummary => ({
  id: Number(session?.id ?? 0),
  userId: session?.userId ?? session?.user_id ?? null,
  sessionToken: session?.sessionToken ?? session?.session_token,
  channel: session?.channel,
  status: session?.status,
  startedAt: toIsoString(session?.startedAt ?? session?.started_at),
  endedAt: toIsoString(session?.endedAt ?? session?.ended_at) ?? null,
  lastMessageAt:
    toIsoString(session?.lastMessageAt ?? session?.last_message_at) ?? null,
  metadataJson: session?.metadataJson ?? session?.metadata_json ?? null,
  createdAt: toIsoString(session?.createdAt ?? session?.created_at),
  updatedAt: toIsoString(session?.updatedAt ?? session?.updated_at),
});

const normalizeRecommendations = (items: any[]): ChatRecommendation[] => {
  return (items ?? []).map((item, index) => ({
    id: item?.product?.id ?? item?.productId ?? `recommendation-${index}`,
    productId: item?.product?.id
      ? Number(item.product.id)
      : item?.productId
        ? Number(item.productId)
        : undefined,
    productVariantId: item?.variantId ?? item?.productVariantId ?? null,
    title: String(item?.product?.title ?? item?.title ?? "Sản phẩm gợi ý"),
    slug: item?.product?.slug ?? item?.slug ?? null,
    thumbnail: item?.product?.thumbnail ?? item?.thumbnail ?? null,
    price:
      item?.product?.price !== undefined && item?.product?.price !== null
        ? Number(item.product.price)
        : item?.price !== undefined && item?.price !== null
          ? Number(item.price)
          : null,
    compareAtPrice:
      item?.compareAtPrice ?? item?.product?.compareAtPrice ?? null,
    variantTitle:
      item?.product?.variants?.find?.(
        (variant: any) => Number(variant?.id) === Number(item?.variantId),
      )?.title ??
      item?.variantTitle ??
      null,
    reason: item?.reason ?? null,
    score:
      item?.score !== undefined && item?.score !== null
        ? Number(item.score)
        : null,
  }));
};

export const chatClient = {
  async createSession(
    payload?: CreateChatSessionPayload,
  ): Promise<ChatSessionSummary> {
    const json = await requestJson<{ data?: unknown }>(`${API_BASE}/sessions`, {
      method: "POST",
      body: JSON.stringify({
        channel: payload?.channel ?? "web",
        metadataJson: payload?.metadataJson ?? null,
        sessionToken: payload?.sessionToken,
      }),
    });

    return normalizeSession((json as any).data ?? {});
  },

  async listMessages(
    sessionId: number,
    params?: { page?: number; limit?: number },
  ): Promise<ChatMessagesResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const json = await requestJson<{
      data?: unknown[];
      meta?: Record<string, unknown>;
    }>(
      `${API_BASE}/sessions/${sessionId}/messages?page=${page}&limit=${limit}`,
      { method: "GET" },
    );

    const rows = Array.isArray((json as any).data)
      ? (json as any).data.map(normalizeMessage)
      : [];
    return {
      rows,
      total: Number((json as any).meta?.total ?? rows.length),
      page: Number((json as any).meta?.page ?? page),
      limit: Number((json as any).meta?.limit ?? limit),
    };
  },

  async sendMessage(
    sessionId: number,
    payload: SendChatMessagePayload,
  ): Promise<SendChatMessageResponse> {
    const json = await requestJson<{ data?: any }>(
      `${API_BASE}/sessions/${sessionId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: payload.content,
          message: payload.content,
        }),
      },
    );

    const data = (json as any).data ?? {};

    return {
      session: normalizeSession(data.session ?? {}),
      userMessage: normalizeMessage(
        data.userMessage ?? { senderType: "user", content: payload.content },
      ),
      assistantMessage: normalizeMessage(
        data.assistantMessage ?? { senderType: "assistant", content: "" },
      ),
      recommendations: normalizeRecommendations(
        Array.isArray(data.recommendations) ? data.recommendations : [],
      ),
      extractedIntent: data.extractedIntent ?? null,
      filters: data.filters ?? null,
      safety: data.safety ?? null,
    };
  },
};
