import type {
  ChatSafetyAssessment,
  ConversationTurn,
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

/**
 * Dựng đoạn lịch sử hội thoại thành định dạng rõ ràng cho AI.
 * Chỉ giữ tối đa 6 lượt (3 user + 3 assistant) để tránh tốn token.
 */
const buildConversationHistorySection = (
  history: ConversationTurn[],
): string | null => {
  if (!history.length) return null;
  const recentTurns = history.slice(-6);
  const lines = recentTurns.map((turn) => {
    const role = turn.role === "user" ? "Khách" : "Tư vấn viên";
    const content = truncatePrompt(turn.content, 200);
    return `${role}: ${content}`;
  });
  return `--- LỊCH SỬ HỘI THOẠI GẦN ĐÂY ---\n${lines.join("\n")}\n--- KẾT THÚC LỊCH SỬ ---`;
};

export class BuildChatPromptService {
  execute(input: {
    userMessage: string;
    extractedIntent: ExtractedChatIntent;
    filters: RecommendationFilters;
    recommendations: RankedChatRecommendation[];
    safety: ChatSafetyAssessment;
    conversationHistory?: ConversationTurn[];
  }) {
    const {
      userMessage,
      extractedIntent,
      filters,
      recommendations,
      safety,
      conversationHistory = [],
    } = input;

    const systemPromptParts = [
      "Bạn là nhân viên tư vấn chuyên nghiệp của cửa hàng trái cây. Nhiệm vụ duy nhất của bạn là giúp khách hàng tìm sản phẩm trái cây phù hợp.",

      // — Quy tắc hiểu ngữ cảnh đa lượt —
      "BẠN CÓ KHẢ NĂNG NHỚ lịch sử hội thoại. Khi khách hỏi câu ngắn như 'Còn cái nào nữa không?', 'Loại nào rẻ hơn?', 'Cái đó có vitamin C không?' — hãy nhìn vào LỊCH SỬ HỘI THOẠI để hiểu họ đang nói về sản phẩm nào, chủ đề gì từ lượt trước.",

      // — Quy tắc coi mục đích câu hỏi —
      "LƯU Ý CỰC KỲ QUAN TRỌNG: Lắng nghe kỹ câu hỏi của khách. Nếu câu hỏi rơi vào các trường hợp sau:",
      "- Vô lý, phi thực tế (biến thành siêu nhân, giàu có, bất tử...)",
      "- Gây hại cho sức khỏe (ăn để bị tiểu đường, béo phì, táo bón, ung thư...)",
      "- Hoàn toàn không liên quan đến trái cây / sức khỏe (thời tiết, chứng khoán...)",
      "- Chỉ là lời chào hỏi / xã giao (xin chào, cảm ơn, bạn khỏe không...)",
      "-> BẠN BẮT BUỘC phải bắt đầu câu trả lời bằng đúng chuỗi ký tự `[REJECT]` (viết hoa, có ngoặc vuông). Sau đó viết lời giải thích thân thiện để từ chối hoặc chào lại. Tuyệt đối KHÔNG đưa ra danh sách sản phẩm trong trường hợp này.",

      // — Quy tắc trình bày khi có sản phẩm —
      "Khi gợi ý sản phẩm, BẠN PHẢI: (1) Bắt đầu bằng câu nhắc lại yêu cầu của khách và giải thích tại sao lại chọn những sản phẩm này dựa trên ghi chú dinh dưỡng và công dụng thực tế. (2) Liệt kê từng sản phẩm có giải thích NGẮN GỌN tại sao phù hợp. (3) Thêm lưu ý nếu cần.",
      "TUYỆT ĐỐI KHÔNG sao chép y hệt dòng 'Lý do hệ thống chọn'. Thay vào đó hãy dùng ngôn ngữ tự nhiên dựa vào Mô tả ngắn và Ghi chú dinh dưỡng của sản phẩm.",
      "KHÔNG tự bịa ra sản phẩm hoặc công dụng không có trong dữ liệu.",
      "KHÔNG chẩn đoán, kê đơn hoặc nói như bác sĩ.",
      "Luôn trả lời tiếng Việt, giọng điệu thân thiện, ngắn gọn.",

      // — Cảnh báo y tế —
      safety.shouldAvoidMedicalClaims
        ? "Câu hỏi liên quan đến sức khỏe đặc thù. Chỉ trả lời ở mức tham khảo, tránh mọi khẳng định y khoa mạnh, không dùng từ như 'chữa', 'trị', 'điều trị'."
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

    // Xây dựng phần lịch sử hội thoại (chỉ hiển thị nếu có)
    const historySection = buildConversationHistorySection(conversationHistory);

    // Ghi chú follow-up context nếu có
    const followUpNote =
      extractedIntent.isContextualFollowUp && extractedIntent.contextKeywords.length > 0
        ? `[Ngữ cảnh nhận diện: Câu hỏi nối tiếp. Từ khóa từ cuộc trò chuyện trước: ${extractedIntent.contextKeywords.slice(0, 8).join(", ")}]`
        : null;

    const userPromptParts = [
      // Lịch sử hội thoại → đặt đầu tiên để AI có context
      historySection,

      // Ngữ cảnh follow-up (nếu có)
      followUpNote,

      `Câu hỏi hiện tại của khách: "${userMessage}"`,
      `Intent phát hiện: ${extractedIntent.primaryIntent}${extractedIntent.isContextualFollowUp ? " (câu hỏi nối tiếp ngữ cảnh)" : ""}`,

      // Quyền phủ quyết của AI
      "Nếu câu hỏi hoàn toàn vô lý (ví dụ: ăn vào sẽ học giỏi hơn, phép thuật, bất tử...), mang tính chửi bới/gây hấn (ví dụ: đồ ngu ngốc...), gây hại sức khỏe (ví dụ: ăn để bị bệnh...), hoặc ngoài lề, HÃY CHỦ ĐỘNG bắt đầu câu trả lời bằng `[REJECT]` để từ chối lịch sự và KHÔNG liệt kê sản phẩm.",
      extractedIntent.isHarmfulRequest
        ? "⚠️ CẢNH BÁO TỪ HỆ THỐNG: Câu hỏi này yêu cầu sản phẩm GÂY HẠI. Bắt buộc dùng `[REJECT]`."
        : null,
      extractedIntent.isUnrealisticRequest
        ? "⚠️ CẢNH BÁO TỪ HỆ THỐNG: Câu hỏi phi thực tế. Bắt buộc dùng `[REJECT]`."
        : null,
      extractedIntent.isOffTopic
        ? "⚠️ CẢNH BÁO TỪ HỆ THỐNG: Câu hỏi ngoài phạm vi. Bắt buộc dùng `[REJECT]`."
        : null,
      extractedIntent.isGreeting || extractedIntent.isSocialChat
        ? "⚠️ CẢNH BÁO TỪ HỆ THỐNG: Lời chào hoặc chat xã giao. Hãy chào lại, từ chối và KHÔNG gợi ý sản phẩm (Nên dùng `[REJECT]`)."
        : null,

      // Data cho context
      filters.keywords.length
        ? `Từ khóa trích xuất: ${filters.keywords.join(", ")}`
        : null,
      filters.tags.length
        ? `Tags liên quan: ${filters.tags.join(", ")}`
        : null,
      productSection,

      // Định dạng đầu ra nếu câu hỏi hợp lệ
      "Nếu câu hỏi HOÀN TOÀN HỢP LÝ và liên quan đến trái cây:",
      recommendations.length > 0
        ? "=> Hãy trả lời theo format: (1) Nhắc lại yêu cầu và giải thích tại sao những sản phẩm này phù hợp; (2) Liệt kê sản phẩm; (3) Thêm lưu ý."
        : "=> Hãy giải thích tại sao chưa tìm được sản phẩm phù hợp và gợi ý khách hỏi lại cụ thể hơn.",
    ]
      .filter(Boolean)
      .join("\n\n");

    return { systemPrompt: systemPromptParts, userPrompt: userPromptParts };
  }
}
