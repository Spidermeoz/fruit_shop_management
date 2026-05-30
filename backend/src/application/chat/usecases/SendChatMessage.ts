import type { ChatMessageRepository } from "../../../domain/chat/ChatMessageRepository";
import type { ChatSessionRepository } from "../../../domain/chat/ChatSessionRepository";
import type { ProductRecommendationLogRepository } from "../../../domain/chat/ProductRecommendationLogRepository";
import type {
  ConversationTurn,
  SendChatMessageResult,
} from "../../../domain/chat/types";
import { BuildRecommendationFiltersService } from "../services/BuildRecommendationFiltersService";
import { ChatSafetyPolicyService } from "../services/ChatSafetyPolicyService";
import { ExtractChatIntentService } from "../services/ExtractChatIntentService";
import { GenerateChatAnswerService } from "../services/GenerateChatAnswerService";
import { NormalizeChatInputService } from "../services/NormalizeChatInputService";
import { RecommendProductsForChat } from "./RecommendProductsForChat";

/** Số lượt hội thoại gần nhất truyền vào làm ngữ cảnh (user + assistant pairs) */
const CONTEXT_TURNS = 4;

export class SendChatMessage {
  constructor(
    private sessionRepo: ChatSessionRepository,
    private messageRepo: ChatMessageRepository,
    private recommendationLogRepo: ProductRecommendationLogRepository,
    private normalizeService: NormalizeChatInputService,
    private safetyService: ChatSafetyPolicyService,
    private extractIntentService: ExtractChatIntentService,
    private buildFiltersService: BuildRecommendationFiltersService,
    private recommendProductsUsecase: RecommendProductsForChat,
    private generateAnswerService: GenerateChatAnswerService,
  ) {}

  async execute(input: {
    sessionId: number;
    content: string;
  }): Promise<SendChatMessageResult> {
    const session = await this.sessionRepo.findById(Number(input.sessionId));
    if (!session) throw new Error("Chat session not found");

    const normalizedContent = this.normalizeService.execute(input.content);
    const safety = this.safetyService.evaluate(normalizedContent);

    // ── Lấy lịch sử hội thoại để làm ngữ cảnh multi-turn ──────────────────
    // Lấy CONTEXT_TURNS * 2 messages gần nhất (mỗi turn = 1 user + 1 assistant)
    const historyResult = await this.messageRepo.listBySessionId(
      Number(input.sessionId),
      { page: 1, limit: CONTEXT_TURNS * 2 + 10 }, // lấy dư để đảm bảo đủ sau filter
    );

    // Xây dựng conversation history: chỉ lấy user + assistant, bỏ system
    const conversationHistory: ConversationTurn[] = historyResult.rows
      .filter((m) => m.senderType === "user" || m.senderType === "assistant")
      .slice(-(CONTEXT_TURNS * 2)) // Giữ CONTEXT_TURNS lượt cuối
      .map((m) => ({
        role: m.senderType === "user" ? "user" : "assistant",
        content: m.content,
      }));

    // ── Trích xuất intent có tính đến ngữ cảnh ──────────────────────────────
    const extractedIntent = this.extractIntentService.execute(
      normalizedContent,
      conversationHistory,
    );

    const filters = this.buildFiltersService.execute({
      userMessage: normalizedContent,
      extractedIntent,
      conversationHistory,
    });

    const userMessage = await this.messageRepo.create({
      chatSessionId: Number(session.id),
      senderType: "user",
      messageType: "text",
      content: normalizedContent,
      intent: extractedIntent.primaryIntent,
      extractedFiltersJson: { extractedIntent, filters },
    });

    // Không chạy recommend khi câu hỏi rõ ràng không cần sản phẩm
    const shouldSkipRecommendation =
      extractedIntent.isGreeting ||
      extractedIntent.isSocialChat ||
      extractedIntent.isOffTopic ||
      extractedIntent.isHarmfulRequest ||
      extractedIntent.isUnrealisticRequest ||
      (!extractedIntent.hasFoodHealthSignal &&
        extractedIntent.primaryIntent === "general" &&
        !extractedIntent.isContextualFollowUp); // Không bỏ qua nếu là câu hỏi nối tiếp

    const recommendationResult = shouldSkipRecommendation
      ? { filters, recommendations: [] }
      : await this.recommendProductsUsecase.execute({
          userMessage: normalizedContent,
          extractedIntent,
          filters,
        });

    const generated = await this.generateAnswerService.execute({
      userMessage: normalizedContent,
      extractedIntent,
      filters,
      recommendations: recommendationResult.recommendations,
      safety,
      conversationHistory, // ← truyền ngữ cảnh vào prompt builder
    });

    // Nếu LLM quyết định từ chối do câu hỏi vô lý/gây hại/off-topic,
    // bắt tín hiệu [REJECT] và dọn dẹp danh sách recommendations
    if (generated.text.includes("[REJECT]")) {
      recommendationResult.recommendations = [];
      generated.text = generated.text.replace(/\[REJECT\]\s*/g, "").trim();
    }

    const assistantMessage = await this.messageRepo.create({
      chatSessionId: Number(session.id),
      senderType: "assistant",
      messageType: recommendationResult.recommendations.length
        ? "recommendation"
        : "text",
      content: generated.text,
      intent: extractedIntent.primaryIntent,
      extractedFiltersJson: {
        extractedIntent,
        filters,
        recommendationCount: recommendationResult.recommendations.length,
      },
      modelName: generated.modelName ?? null,
      promptTokens: generated.promptTokens ?? null,
      completionTokens: generated.completionTokens ?? null,
      latencyMs: generated.latencyMs ?? null,
    });

    await this.sessionRepo.touchLastMessageAt(Number(session.id), new Date());

    if (recommendationResult.recommendations.length > 0) {
      await this.recommendationLogRepo.createMany(
        recommendationResult.recommendations.map((item, index) => ({
          chatSessionId: Number(session.id),
          chatMessageId: Number(assistantMessage.id),
          productId: Number(item.product.id),
          productVariantId: item.variantId ?? null,
          rankPosition: index + 1,
          score: item.score,
          reason: item.reason,
          matchedTagsJson: item.matchedTags,
          matchedAttributesJson: item.matchedAttributes,
        })),
      );
    }

    return {
      session: { ...session, lastMessageAt: new Date() },
      userMessage,
      assistantMessage,
      filters,
      extractedIntent,
      recommendations: recommendationResult.recommendations,
      safety,
    };
  }
}
