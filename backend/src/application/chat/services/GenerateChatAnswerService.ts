import type {
  ChatSafetyAssessment,
  ExtractedChatIntent,
  RankedChatRecommendation,
  RecommendationFilters,
} from "../../../domain/chat/types";
import type {
  ChatModelGenerateOutput,
  ChatModelService,
} from "./ChatModelService";
import { BuildChatPromptService } from "./BuildChatPromptService";

const formatFallback = (input: {
  recommendations: RankedChatRecommendation[];
  safety: ChatSafetyAssessment;
}) => {
  const { recommendations, safety } = input;

  if (!recommendations.length) {
    return [
      "Hiện mình chưa tìm được sản phẩm thật sự phù hợp từ dữ liệu đang có.",
      "Bạn có thể nói rõ hơn nhu cầu như: muốn ít ngọt, để ép nước hay để biếu tặng, mình sẽ lọc sát hơn.",
      safety.requiresDisclaimer
        ? "Thông tin mang tính tham khảo, không thay thế tư vấn bác sĩ hoặc chuyên gia dinh dưỡng."
        : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const lines = [
    "Mình gợi ý bạn cân nhắc các sản phẩm sau:",
    ...recommendations.slice(0, 3).map((item, index) => {
      const variant = item.product.variants?.find(
        (v) => v.id === item.variantId,
      );
      return `${index + 1}. ${item.product.title}${variant?.title ? ` (${variant.title})` : ""} - ${item.reason}.`;
    }),
  ];

  if (safety.requiresDisclaimer) {
    lines.push(
      "Thông tin mang tính tham khảo, không thay thế tư vấn bác sĩ hoặc chuyên gia dinh dưỡng.",
    );
  }

  return lines.join(" ");
};

export class GenerateChatAnswerService {
  constructor(
    private promptBuilder: BuildChatPromptService,
    private chatModel?: ChatModelService,
  ) {}

  async execute(input: {
    userMessage: string;
    extractedIntent: ExtractedChatIntent;
    filters: RecommendationFilters;
    recommendations: RankedChatRecommendation[];
    safety: ChatSafetyAssessment;
  }): Promise<ChatModelGenerateOutput> {
    const fallbackText = formatFallback({
      recommendations: input.recommendations,
      safety: input.safety,
    });

    if (!this.chatModel) {
      return {
        text: fallbackText,
        modelName: null,
        promptTokens: null,
        completionTokens: null,
        latencyMs: null,
      };
    }

    try {
      const prompt = this.promptBuilder.execute(input);
      const response = await this.chatModel.generate({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        temperature: 0.4,
        maxTokens: 500,
      });
      return {
        ...response,
        text: String(response.text ?? "").trim() || fallbackText,
      };
    } catch (error) {
      return {
        text: fallbackText,
        modelName: null,
        promptTokens: null,
        completionTokens: null,
        latencyMs: null,
        raw: error,
      };
    }
  }
}
