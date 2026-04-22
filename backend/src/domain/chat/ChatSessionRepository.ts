import type { ChatSession, ChatSessionStatus } from "./types";

export type CreateChatSessionInput = {
  userId?: number | null;
  sessionToken: string;
  channel?: string;
  status?: ChatSessionStatus;
  metadataJson?: Record<string, any> | null;
};

export type UpdateChatSessionPatch = Partial<
  Omit<CreateChatSessionInput, "sessionToken"> & {
    endedAt?: Date | null;
    lastMessageAt?: Date | null;
  }
>;

export interface ChatSessionRepository {
  create(input: CreateChatSessionInput): Promise<ChatSession>;
  findById(id: number): Promise<ChatSession | null>;
  findByToken(sessionToken: string): Promise<ChatSession | null>;
  update(id: number, patch: UpdateChatSessionPatch): Promise<ChatSession>;
  touchLastMessageAt(id: number, at?: Date): Promise<void>;
}
