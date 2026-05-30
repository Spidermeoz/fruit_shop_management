import type {
  ConversationTurn,
  ExtractedChatIntent,
  RecommendationFilters,
} from "../../../domain/chat/types";

export class BuildRecommendationFiltersService {
  execute(input: {
    userMessage: string;
    extractedIntent: ExtractedChatIntent;
    conversationHistory?: ConversationTurn[];
  }): RecommendationFilters {
    const { userMessage, extractedIntent, conversationHistory = [] } = input;
    const tags = Array.from(
      new Set([
        ...extractedIntent.intents,
        ...extractedIntent.audienceKeywords,
        ...extractedIntent.usageKeywords,
      ]),
    );

    // Với câu hỏi follow-up, enrichedKeywords đã bao gồm context từ lịch sử (do ExtractChatIntentService làm)
    // searchText: dùng tin nhắn hiện tại + context keywords để tìm kiếm rộng hơn
    const contextualSearchTerms =
      extractedIntent.isContextualFollowUp &&
      extractedIntent.contextKeywords.length > 0
        ? `${userMessage} ${extractedIntent.contextKeywords.slice(0, 6).join(" ")}`
        : userMessage;

    return {
      searchText: String(contextualSearchTerms ?? "").trim(),
      tags,
      keywords: extractedIntent.keywords,
      audienceKeywords: extractedIntent.audienceKeywords,
      usageKeywords: extractedIntent.usageKeywords,
      sizePreference: extractedIntent.sizePreference ?? null,
      requestedPeopleCount: extractedIntent.requestedPeopleCount ?? null,
      requireInStock: true,
      preferredStatuses: ["active"],
      maxResults: 5,
    };
  }
}
