import type { ChatMessageRepository } from "../../../domain/chat/ChatMessageRepository";
import type { ChatSessionRepository } from "../../../domain/chat/ChatSessionRepository";

export class ListChatMessages {
  constructor(
    private sessionRepo: ChatSessionRepository,
    private messageRepo: ChatMessageRepository,
  ) {}

  async execute(input: { sessionId: number; page?: number; limit?: number }) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) throw new Error("Chat session not found");

    return this.messageRepo.listBySessionId(input.sessionId, {
      page: input.page ?? 1,
      limit: input.limit ?? 50,
    });
  }
}
