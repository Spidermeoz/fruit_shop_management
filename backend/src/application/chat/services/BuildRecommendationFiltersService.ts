import type {
  ExtractedChatIntent,
  RecommendationFilters,
} from "../../../domain/chat/types";

export class BuildRecommendationFiltersService {
  execute(input: {
    userMessage: string;
    extractedIntent: ExtractedChatIntent;
  }): RecommendationFilters {
    const { userMessage, extractedIntent } = input;
    const tags = Array.from(
      new Set([
        ...extractedIntent.intents,
        ...extractedIntent.audienceKeywords,
        ...extractedIntent.usageKeywords,
      ]),
    );

    return {
      searchText: String(userMessage ?? "").trim(),
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
