import type {
  ChatSafetyAssessment,
  ExtractedChatIntent,
  RankedChatRecommendation,
  RecommendationFilters,
} from "../../../domain/chat/types";

/** Strip HTML tags/entities khỏi field text trước khi đưa vào prompt */
const stripHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncatePrompt = (value: unknown, maxLen = 120): string => {
  const plain = stripHtml(value);
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
};

const productToPromptLine = (item: RankedChatRecommendation, index: number) => {
  const product = item.product;
  const variant = (product.variants ?? []).find((v) => v.id === item.variantId);

  return [
    `${index + 1}. ${stripHtml(product.title)}`,
    product.shortDescription
      ? `- Mô tả ngắn: ${truncatePrompt(product.shortDescription)}`
      : null,
    product.usageSuggestions
      ? `- Gợi ý sử dụng: ${truncatePrompt(product.usageSuggestions)}`
      : null,
    product.nutritionNotes
      ? `- Ghi chú dinh dưỡng: ${truncatePrompt(product.nutritionNotes)}`
      : null,
    product.origin?.name ? `- Xuất xứ: ${product.origin.name}` : null,
    variant
      ? `- Quy cách gợi ý: ${stripHtml(variant.title ?? variant.sku ?? `#${variant.id}`)}`
      : null,
    variant
      ? `- Giá: ${Number(variant.price ?? 0).toLocaleString("vi-VN")}₫`
      : product.price != null
        ? `- Giá: ${Number(product.price).toLocaleString("vi-VN")}₫`
        : null,
    `- Lý do hệ thống chọn: ${stripHtml(item.reason)}`,
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

    const systemPromptParts = [
      "Bạn là nhân viên tư vấn chuyên nghiệp của cửa hàng trái cây. Nhiệm vụ duy nhất của bạn là giúp khách hàng tìm sản phẩm trái cây phù hợp.",

      // — Quy tắc coi mục đích câu hỏi —
      "LƯU Ý CỰC KỲ QUAN TRỌNG: Lắng nghe kỹ câu hỏi của khách. Nếu câu hỏi rơi vào các trường hợp sau:",
      "- Vô lý, phi thực tế (biến thành siêu nhân, giàu có, bất tử...)",
      "- Gây hại cho sức khỏe (ăn để bị tiểu đường, béo phì, táo bón, ung thư...)",
      "- Hoàn toàn không liên quan đến trái cây / sức khỏe (thời tiết, chứng khoán...)",
      "- Chỉ là lời chào hỏi / xã giao (xin chào, cảm ơn, bạn khỏe không...)",
      "-> BẠN BẮT BUỘC phải bắt đầu câu trả lời bằng đúng chuỗi ký tự `[REJECT]` (viết hoa, có ngoặc vuông). Sau đó viết lời giải thích thân thiện để từ chối hoặc chào lại. Tuyệt đối KHÔNG đưa ra danh sách sản phẩm trong trường hợp này.",

      // — Quy tắc trình bày khi có sản phẩm —
      "Khi gợi ý sản phẩm, BẪN PHẢI: (1) Bắt đầu bằng câu nhắc lại yêu cầu của khách và giải thích tại sao lại chọn những sản phẩm này dựa trên ghi chú dinh dưỡng và công dụng thực tế. (2) Liệt kê từng sản phẩm có giải thích NGẮN GỌN tại sao phù hợp. (3) Thêm lưu ý nếu cần.",
      "TUYỆT ĐỐI KHÔNG sao chép y hệt dòng 'Lý do hệ thống chọn'. Thay vào đó hãy dùng ngôn ngữ tự nhiên dựa vào Mô tả ngắn và Ghi chú dinh dưỡng của sản phẩm.",
      "KHÔNG tự bịa ra sản phẩm hoặc công dụng không có trong dữ liệu.",
      "KHÔNG chẩn đoán, kê đơn hoặc nói như bác sĩ.",
      "Luôn trả lời tiếng Việt, giọng điệu thân thiện, ngắn gọn.",

      // — Cảnh báo y tế —
      safety.shouldAvoidMedicalClaims
        ? "Câu hỏi liên quan đến sức khỏe đặc thù. Chỉ trả lời ở mức tham khảo, tránh mọi khẳng định y khoa mạnh, không dùng từ như  'chữa', 'trị', 'điều trị'."
        : null,
      extractedIntent.requiresDisclaimer || safety.requiresDisclaimer
        ? "Kết thúc bằng disclaimer ngắn: 'Thông tin mang tính tham khảo, không thay thế tư vấn bác sĩ hoặc chuyên gia dinh dưỡng.'"
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const productSection =
      recommendations.length > 0
        ? `Danh sách sản phẩm phù hợp nhất từ kho dữ liệu hiện có:\n${recommendations
            .map((item, index) => productToPromptLine(item, index))
            .join("\n\n")}`
        : "Không tìm thấy sản phẩm phù hợp trong kho dữ liệu hiện có.";

    const userPromptParts = [
      `Câu hỏi của khách: "${userMessage}"`,
      `Intent phát hiện: ${extractedIntent.primaryIntent}`,
      extractedIntent.isGreeting
        ? "⚠️ Lời chào / hỏi thăm — chào lại thân thiện và mời đặt câu hỏi về trái cây."
        : null,
      extractedIntent.isSocialChat
        ? "⚠️ Chat xã giao không liên quan — giải thích phạm vi tư vấn và mời hỏi về trái cây."
        : null,
      extractedIntent.isHarmfulRequest
        ? "⚠️ CẢNH BÁO: Câu hỏi yêu cầu sản phẩm có tác dụng GÂY HẠI. Bắt buộc dùng `[REJECT]` và không gợi ý sản phẩm."
        : null,
      extractedIntent.isUnrealisticRequest
        ? "⚠️ CẢNH BÁO: Câu hỏi phi thực tế. Bắt buộc dùng `[REJECT]` và không gợi ý sản phẩm."
        : null,
      extractedIntent.isOffTopic
        ? "⚠️ CẢNH BÁO: Câu hỏi ngoài phạm vi. Bắt buộc dùng `[REJECT]`."
        : null,
      filters.keywords.length
        ? `Từ khóa trích xuất: ${filters.keywords.join(", ")}`
        : null,
      filters.tags.length
        ? `Tags liên quan: ${filters.tags.join(", ")}`
        : null,
      productSection,
      recommendations.length > 0
        ? "Hãy trả lời với: (1) Một câu giới thiệu nhắc lại yêu cầu của khách và giải thích tại sao những sản phẩm này phù hợp (dựa vào Ghi chú dinh dưỡng / Mô tả ngắn, không copy dòng 'Lý do hệ thống'); (2) Danh sách sản phẩm; (3) Lưu ý nếu cần."
        : extractedIntent.isHarmfulRequest ||
            extractedIntent.isUnrealisticRequest ||
            extractedIntent.isOffTopic ||
            extractedIntent.isGreeting ||
            extractedIntent.isSocialChat
          ? "Hãy bắt đầu câu trả lời bằng `[REJECT]` và giải thích / từ chối lịch sự."
          : "Nếu câu hỏi có vẻ vô lý hoặc gây hại mà hệ thống chưa nhận diện được, HÃY CHỦ ĐỘNG dùng `[REJECT]` để từ chối. Nếu không, hãy giải thích tại sao chưa tìm được sản phẩm phù hợp.",
    ]
      .filter(Boolean)
      .join("\n\n");

    return { systemPrompt: systemPromptParts, userPrompt: userPromptParts };
  }
}
