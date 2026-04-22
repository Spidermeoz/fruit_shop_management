import type {
  ChatSafetyAssessment,
  ExtractedChatIntent,
  RankedChatRecommendation,
  RecommendationFilters,
} from "../../../domain/chat/types";

const productToPromptLine = (item: RankedChatRecommendation, index: number) => {
  const product = item.product;
  const variant = (product.variants ?? []).find((v) => v.id === item.variantId);

  return [
    `${index + 1}. ${product.title}`,
    product.shortDescription
      ? `- Mô tả ngắn: ${product.shortDescription}`
      : null,
    product.usageSuggestions
      ? `- Gợi ý sử dụng: ${product.usageSuggestions}`
      : null,
    product.nutritionNotes
      ? `- Ghi chú dinh dưỡng: ${product.nutritionNotes}`
      : null,
    product.origin?.name ? `- Xuất xứ: ${product.origin.name}` : null,
    variant
      ? `- Variant đề xuất: ${variant.title ?? variant.sku ?? `#${variant.id}`}`
      : null,
    variant
      ? `- Giá variant: ${Number(variant.price ?? 0)}`
      : product.price != null
        ? `- Giá: ${Number(product.price)}`
        : null,
    `- Lý do hệ thống: ${item.reason}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export class BuildChatPromptService {
  execute(input: {
    userMessage: string;
    extractedIntent: ExtractedChatIntent;
    filters: RecommendationFilters;
    recommendations: RankedChatRecommendation[];
    safety: ChatSafetyAssessment;
  }) {
    const { userMessage, extractedIntent, filters, recommendations, safety } =
      input;

    const systemPrompt = [
      "Bạn là trợ lý gợi ý sản phẩm của cửa hàng trái cây.",
      "Chỉ được gợi ý dựa trên dữ liệu sản phẩm được cung cấp.",
      "Không được tự tạo sản phẩm hoặc công dụng không có trong dữ liệu.",
      "Không được chẩn đoán, kê đơn, hứa hẹn điều trị hoặc nói như bác sĩ.",
      "Trả lời ngắn gọn, tự nhiên, ưu tiên tiếng Việt.",
      safety.shouldAvoidMedicalClaims
        ? "Vì câu hỏi có yếu tố sức khỏe, chỉ trả lời ở mức tham khảo và tránh mọi khẳng định y khoa mạnh."
        : null,
      extractedIntent.requiresDisclaimer || safety.requiresDisclaimer
        ? "Kết câu bằng một disclaimer ngắn: Thông tin mang tính tham khảo, không thay thế tư vấn bác sĩ hoặc chuyên gia dinh dưỡng."
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const userPrompt = [
      `Yêu cầu khách hàng: ${userMessage}`,
      `Intent chính: ${extractedIntent.primaryIntent}`,
      `Từ khóa: ${filters.keywords.join(", ") || "không có"}`,
      `Tag gợi ý: ${filters.tags.join(", ") || "không có"}`,
      recommendations.length
        ? `Danh sách sản phẩm có thể gợi ý:
${recommendations.map((item, index) => productToPromptLine(item, index)).join("\n\n")}`
        : "Không tìm thấy sản phẩm phù hợp trong dữ liệu hiện có.",
      "Hãy trả lời với 3 phần: (1) gợi ý ngắn, (2) danh sách sản phẩm nên cân nhắc, (3) lưu ý ngắn nếu có.",
    ].join("\n\n");

    return { systemPrompt, userPrompt };
  }
}
