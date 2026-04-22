import { randomUUID } from "crypto";
import type {
  ChatSessionRepository,
  CreateChatSessionInput,
} from "../../../domain/chat/ChatSessionRepository";

export class CreateChatSession {
  constructor(private repo: ChatSessionRepository) {}

  async execute(input?: {
    userId?: number | null;
    sessionToken?: string;
    channel?: string;
    metadataJson?: Record<string, any> | null;
  }) {
    const payload: CreateChatSessionInput = {
      userId: input?.userId ?? null,
      sessionToken: input?.sessionToken?.trim() || randomUUID(),
      channel: input?.channel ?? "web",
      status: "active",
      metadataJson: input?.metadataJson ?? null,
    };

    return this.repo.create(payload);
  }
}
