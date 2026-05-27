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

/** Strip HTML tags/entities khỏi field text của sản phẩm */
const stripHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: unknown, maxLen: number): string => {
  const plain = stripHtml(value);
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
};

/**
 * Nhãn mô tả từng intent để dùng trong câu dẫn giải thích.
 */
const INTENT_CONTEXT: Record<string, string> = {
  weight_loss:
    "hỗ trợ giảm cân — ít đường, nhiều chất xơ, giúp tạo cảm giác no lâu",
  low_sugar:
    "hàm lượng đường thấp, phù hợp cho người kiêng đường hoặc tiểu đường nhẹ",
  juicing: "phù hợp để ép nước hoặc xay sinh tố, nhiều nước và mềm",
  gifting: "đẹp, sang, phù hợp làm quà biếu tặng với nhiều quy cách đóng gói",
  kids: "ngọt tự nhiên, mềm, dễ ăn và giàu vitamin tốt cho trẻ em",
  seniors:
    "mềm, dễ tiêu hoá, giàu kali và vitamin phù hợp cho người lớn tuổi",
  fresh_eating: "ngon khi ăn trực tiếp, không cần chế biến, giữ trọn vị tươi",
  energy_boost:
    "giàu carbohydrate và đường tự nhiên, cung cấp năng lượng nhanh",
  seasonal: "đang vào mùa chín rộ — tươi ngon nhất và giá tốt nhất lúc này",
  general: "phù hợp với nhu cầu của bạn",
};

/**
 * Tạo câu trả lời fallback (không dùng AI model) với 5 nhánh xử lý rõ ràng.
 */
const formatFallback = (input: {
  recommendations: RankedChatRecommendation[];
  extractedIntent: ExtractedChatIntent;
  safety: ChatSafetyAssessment;
}): string => {
  const { recommendations, extractedIntent, safety } = input;

  // ─── Nhánh 1: Lời chào / hỏi thăm thường ngày ─────────────────────────────
  if (extractedIntent.isGreeting) {
    const greetings = [
      "Xin chào! Mình là trợ lý tư vấn của cửa hàng trái cây. 🍊 Bạn đang tìm loại trái cây nào hôm nay?",
      "Chào bạn! 😊 Mình có thể giúp bạn tìm trái cây theo mục tiêu: giảm cân, ép nước, biếu tặng, hay cho trẻ em... Bạn muốn xết loại nào?",
      "Xin chào! Mình rất vui được hỗ trợ bạn. 🍍 Hãy cho mình biết bạn đang cần tìm gì nhé — ví dụ: trái cây ít ngọt, nhiều vitamin C, hay loại đang hợp mùa?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // ─── Nhánh 2: Chat xã giao / nội dung vô nghĩa ────────────────────────────
  if (extractedIntent.isSocialChat) {
    return "Mình là trợ lý tư vấn trái cây, chỉ có thể giúp bạn tìm sản phẩm phù hợp nhé. Bạn đang tìm trái cây cho mục đích gì? 😊";
  }

  // ─── Nhánh 3: Câu hỏi yêu cầu sản phẩm gây hại ─────────────────────────
  if (extractedIntent.isHarmfulRequest) {
    return [
      "Mình không có sản phẩm nào phù hợp với mô tả đó — và thực ra cũng không nên có! 😊",
      "Các loại trái cây trong cửa hàng đều được chọn lọc để tốt cho sức khoẻ,",
      "không có loại nào được thiết kế để gây ra những tác động tiêu cực như vậy.",
      "Nếu bạn đang tìm trái cây để ăn uống lành mạnh, mình rất vui được tư vấn nhé!",
    ].join(" ");
  }

  // ─── Nhánh 4: Câu hỏi phi thực tế / fantasy ────────────────────────────
  if (extractedIntent.isUnrealisticRequest) {
    return [
      "Ước mà có nhỉ! 😄 Nhưng thực tế chưa có loại trái cây nào mang lại những hiệu ứng kỳ diệu như vậy.",
      "Trái cây có rất nhiều lợi ích thực sự tốt cho sức khoẻ: cung cấp vitamin, chất xơ, tăng cường miễn dịch, làm đẹp da...",
      "Bạn có muốn mình gợi ý theo một mục tiêu thực tế hơn như giảm cân, tăng năng lượng, hay cho cả gia đình không?",
    ].join(" ");
  }

  // ─── Nhánh 5: Câu hỏi ngoài phạm vi ──────────────────────────────
  if (extractedIntent.isOffTopic) {
    return [
      "Câu hỏi này nằm ngoài phạm vi tư vấn của mình —",
      "mình chỉ có thể hỗ trợ bạn tìm trái cây phù hợp với nhu cầu thôi nhé.",
      "Bạn có muốn mình gợi ý theo mục đích như: giảm cân, ép nước, biếu tặng, cho trẻ em, hoặc theo mùa không?",
    ].join(" ");
  }

  // ─── Nhánh 6: Có sản phẩm phù hợp ─────────────────────────────────
  if (recommendations.length > 0) {
    const contextLabel =
      INTENT_CONTEXT[extractedIntent.primaryIntent] ??
      INTENT_CONTEXT["general"];

    const lines: string[] = [];
    // Dấu hỏi người dùng + giải thích tại sao chọn những sản phẩm này
    lines.push(
      `Với yêu cầu "${extractedIntent.rawText}", mình gợi ý ${recommendations.length} sản phẩm ${contextLabel}:`,
    );
    lines.push("");

    recommendations.slice(0, 3).forEach((item, index) => {
      const variant = item.product.variants?.find(
        (v) => v.id === item.variantId,
      );
      const variantLabel = variant?.title ? ` (${stripHtml(variant.title)})` : "";
      const priceInfo = variant?.price
        ? ` — ${Number(variant.price).toLocaleString("vi-VN")}₫`
        : item.product.price
          ? ` — ${Number(item.product.price).toLocaleString("vi-VN")}₫`
          : "";

      const reason = item.reason ? stripHtml(item.reason) : "";

      lines.push(
        `${index + 1}. **${stripHtml(item.product.title)}**${variantLabel}${priceInfo}`,
      );
      if (reason) {
        lines.push(`   ✓ ${reason}`);
      }
    });

    if (safety.requiresDisclaimer) {
      lines.push("");
      lines.push(
        "⚠️ Thông tin mang tính tham khảo, không thay thế tư vấn bác sĩ hoặc chuyên gia dinh dưỡng.",
      );
    }

    return lines.join("\n");
  }

  // ─── Nhánh 5: Không tìm thấy sản phẩm (câu hỏi hợp lệ) ──────────────────
  const lines: string[] = [];

  if (extractedIntent.shouldAskClarifyingQuestion) {
    lines.push(
      "Câu hỏi của bạn chưa đủ chi tiết để mình lọc chính xác sản phẩm phù hợp.",
    );
    lines.push(
      "Bạn có thể cho mình biết thêm không? Ví dụ: muốn ít ngọt, để ép nước, để biếu tặng, hay cho trẻ em?",
    );
  } else {
    lines.push(
      "Hiện mình chưa tìm được sản phẩm phù hợp với yêu cầu cụ thể này trong kho hàng đang có.",
    );
    lines.push(
      "Bạn thử mô tả thêm về mục đích sử dụng hoặc ưu tiên (vị, xuất xứ, dùng cho ai...) — mình sẽ tìm sát hơn nhé!",
    );
  }

  if (safety.requiresDisclaimer) {
    lines.push(
      "⚠️ Thông tin mang tính tham khảo, không thay thế tư vấn bác sĩ hoặc chuyên gia dinh dưỡng.",
    );
  }

  return lines.join(" ");
};

export class GenerateChatAnswerService {
  constructor(
    private promptBuilder: BuildChatPromptService,
    private chatModel?: ChatModelService,
  ) { }

  async execute(input: {
    userMessage: string;
    extractedIntent: ExtractedChatIntent;
    filters: RecommendationFilters;
    recommendations: RankedChatRecommendation[];
    safety: ChatSafetyAssessment;
  }): Promise<ChatModelGenerateOutput> {
    const fallbackText = formatFallback({
      recommendations: input.recommendations,
      extractedIntent: input.extractedIntent,
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
        maxTokens: 5000,
      });
      return {
        ...response,
        text: String(response.text ?? "").trim() || fallbackText,
      };
    } catch (error) {
      console.error("[GenerateChatAnswerService] Gemini request failed:", error);
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
