import type {
  ChatMessage,
  ChatMessageListFilter,
  ChatMessageListResult,
  ChatMessageSenderType,
  ChatMessageType,
} from "./types";

export type CreateChatMessageInput = {
  chatSessionId: number;
  senderType: ChatMessageSenderType;
  messageType?: ChatMessageType;
  content: string;
  intent?: string | null;
  extractedFiltersJson?: Record<string, any> | null;
  modelName?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  latencyMs?: number | null;
};

export interface ChatMessageRepository {
  create(input: CreateChatMessageInput): Promise<ChatMessage>;
  findById(id: number): Promise<ChatMessage | null>;
  listBySessionId(
    chatSessionId: number,
    filter?: ChatMessageListFilter,
  ): Promise<ChatMessageListResult>;
}
