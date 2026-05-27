import type { ChatMessageRepository } from "../../../domain/chat/ChatMessageRepository";
import type { ChatSessionRepository } from "../../../domain/chat/ChatSessionRepository";
import type { ProductRecommendationLogRepository } from "../../../domain/chat/ProductRecommendationLogRepository";
import type { SendChatMessageResult } from "../../../domain/chat/types";
import { BuildRecommendationFiltersService } from "../services/BuildRecommendationFiltersService";
import { ChatSafetyPolicyService } from "../services/ChatSafetyPolicyService";
import { ExtractChatIntentService } from "../services/ExtractChatIntentService";
import { GenerateChatAnswerService } from "../services/GenerateChatAnswerService";
import { NormalizeChatInputService } from "../services/NormalizeChatInputService";
import { RecommendProductsForChat } from "./RecommendProductsForChat";

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
    const extractedIntent =
      this.extractIntentService.execute(normalizedContent);
    const filters = this.buildFiltersService.execute({
      userMessage: normalizedContent,
      extractedIntent,
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
      extractedIntent.isUnrealisticRequest;

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
    });

    // Nếu LLM quyết định từ chối do câu hỏi vô lý/gây hại/off-topic,
    // ta bắt tín hiệu [REJECT] và dọn dẹp danh sách recommendations
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
