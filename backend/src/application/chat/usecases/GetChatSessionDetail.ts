import type { ChatMessageRepository } from "../../../domain/chat/ChatMessageRepository";
import type { ChatSessionRepository } from "../../../domain/chat/ChatSessionRepository";

export class GetChatSessionDetail {
  constructor(
    private sessionRepo: ChatSessionRepository,
    private messageRepo: ChatMessageRepository,
  ) {}

  async execute(input: { sessionId: number; limit?: number }) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) throw new Error("Chat session not found");

    const messages = await this.messageRepo.listBySessionId(input.sessionId, {
      page: 1,
      limit: input.limit ?? 50,
    });

    return { session, messages: messages.rows };
  }
}
