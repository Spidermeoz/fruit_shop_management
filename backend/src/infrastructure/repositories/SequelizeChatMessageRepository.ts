import type {
  ChatMessageRepository,
  CreateChatMessageInput,
} from "../../domain/chat/ChatMessageRepository";
import type {
  ChatMessage,
  ChatMessageListResult,
} from "../../domain/chat/types";

type Models = { ChatMessage: any };

export class SequelizeChatMessageRepository implements ChatMessageRepository {
  constructor(private models: Models) {}

  private get model() {
    if (!this.models.ChatMessage)
      throw new Error("ChatMessage model is not configured");
    return this.models.ChatMessage;
  }

  private toEntity(row: any): ChatMessage {
    const r = typeof row?.get === "function" ? row.get({ plain: true }) : row;
    return {
      id: Number(r.id),
      chatSessionId: Number(r.chat_session_id),
      senderType: r.sender_type,
      messageType: r.message_type,
      content: r.content,
      intent: r.intent ?? null,
      extractedFiltersJson: r.extracted_filters_json ?? null,
      modelName: r.model_name ?? null,
      promptTokens: r.prompt_tokens ?? null,
      completionTokens: r.completion_tokens ?? null,
      latencyMs: r.latency_ms ?? null,
      createdAt: r.created_at,
    };
  }

  async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    const created = await this.model.create({
      chat_session_id: input.chatSessionId,
      sender_type: input.senderType,
      message_type: input.messageType ?? "text",
      content: input.content,
      intent: input.intent ?? null,
      extracted_filters_json: input.extractedFiltersJson ?? null,
      model_name: input.modelName ?? null,
      prompt_tokens: input.promptTokens ?? null,
      completion_tokens: input.completionTokens ?? null,
      latency_ms: input.latencyMs ?? null,
    });
    return this.toEntity(created);
  }

  async findById(id: number): Promise<ChatMessage | null> {
    const row = await this.model.findByPk(id);
    return row ? this.toEntity(row) : null;
  }

  async listBySessionId(
    chatSessionId: number,
    filter?: { page?: number; limit?: number },
  ): Promise<ChatMessageListResult> {
    const page = Math.max(1, Number(filter?.page ?? 1));
    const limit = Math.max(1, Number(filter?.limit ?? 50));
    const offset = (page - 1) * limit;

    const { rows, count } = await this.model.findAndCountAll({
      where: { chat_session_id: chatSessionId },
      order: [["id", "ASC"]],
      limit,
      offset,
    });

    return { rows: rows.map((row: any) => this.toEntity(row)), count };
  }
}
