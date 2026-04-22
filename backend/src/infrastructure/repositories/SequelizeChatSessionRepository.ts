import type {
  ChatSessionRepository,
  CreateChatSessionInput,
  UpdateChatSessionPatch,
} from "../../domain/chat/ChatSessionRepository";
import type { ChatSession } from "../../domain/chat/types";

type Models = { ChatSession: any };

export class SequelizeChatSessionRepository implements ChatSessionRepository {
  constructor(private models: Models) {}

  private get model() {
    if (!this.models.ChatSession)
      throw new Error("ChatSession model is not configured");
    return this.models.ChatSession;
  }

  private toEntity(row: any): ChatSession {
    const r = typeof row?.get === "function" ? row.get({ plain: true }) : row;
    return {
      id: Number(r.id),
      userId: r.user_id != null ? Number(r.user_id) : null,
      sessionToken: r.session_token,
      channel: r.channel,
      status: r.status,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      lastMessageAt: r.last_message_at,
      metadataJson: r.metadata_json ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async create(input: CreateChatSessionInput): Promise<ChatSession> {
    const created = await this.model.create({
      user_id: input.userId ?? null,
      session_token: input.sessionToken,
      channel: input.channel ?? "web",
      status: input.status ?? "active",
      metadata_json: input.metadataJson ?? null,
    });
    return this.toEntity(created);
  }

  async findById(id: number): Promise<ChatSession | null> {
    const row = await this.model.findByPk(id);
    return row ? this.toEntity(row) : null;
  }

  async findByToken(sessionToken: string): Promise<ChatSession | null> {
    const row = await this.model.findOne({
      where: { session_token: sessionToken },
    });
    return row ? this.toEntity(row) : null;
  }

  async update(
    id: number,
    patch: UpdateChatSessionPatch,
  ): Promise<ChatSession> {
    const row = await this.model.findByPk(id);
    if (!row) throw new Error("Chat session not found");

    await row.update({
      user_id: patch.userId,
      channel: patch.channel,
      status: patch.status,
      metadata_json: patch.metadataJson,
      ended_at: patch.endedAt,
      last_message_at: patch.lastMessageAt,
    });

    return this.toEntity(row);
  }

  async touchLastMessageAt(id: number, at = new Date()): Promise<void> {
    await this.model.update({ last_message_at: at }, { where: { id } });
  }
}
