import type {
  ChatProductCandidate,
  ProductHealthCaution,
  RankedChatRecommendation,
  RecommendationFilters,
  ExtractedChatIntent,
} from "../../../domain/chat/types";

// ─── HTML stripping ────────────────────────────────────────────────────────────
/**
 * Loại bỏ toàn bộ HTML tags, entities và whitespace thừa từ field text.
 * Dữ liệu sản phẩm (usageSuggestions, nutritionNotes, description...) có thể
 * chứa rich-text HTML từ admin editor.
 */
const stripHtml = (value: unknown): string => {
  const text = String(value ?? "");
  return text
    .replace(/<[^>]*>/g, " ")          // loại bỏ HTML tags
    .replace(/&[a-z#0-9]+;/gi, " ")    // loại bỏ HTML entities
    .replace(/\s+/g, " ")               // chuẩn hóa whitespace
    .trim();
};

/** Truncate plain text về maxLen ký tự, thêm "..." nếu cắt */
const truncatePlain = (text: string, maxLen: number): string => {
  const plain = stripHtml(text);
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const normalize = (value: unknown) => stripHtml(value).toLowerCase();
const hasKeyword = (haystacks: Array<unknown>, keyword: string) =>
  haystacks.some((value) => normalize(value).includes(normalize(keyword)));

const pickVariantId = (
  product: ChatProductCandidate,
  filters: RecommendationFilters,
): number | null => {
  const activeVariants = (product.variants ?? []).filter(
    (variant) => variant.status === "active",
  );
  if (!activeVariants.length) return null;

  if (filters.requireInStock) {
    const inStock = activeVariants.find(
      (variant) => Number(variant.availableStock ?? variant.stock ?? 0) > 0,
    );
    if (inStock) return inStock.id;
  }

  if (filters.sizePreference) {
    const preferred = activeVariants.find((variant) => {
      const title = normalize(variant.title);
      return filters.sizePreference === "small"
        ? /(size\s*s|small|nhỏ|mini)/i.test(title)
        : filters.sizePreference === "medium"
          ? /(size\s*m|medium|vừa|trung bình)/i.test(title)
          : /(size\s*l|large|lớn|big)/i.test(title);
    });
    if (preferred) return preferred.id;
  }

  return activeVariants[0]?.id ?? null;
};

const cautionPenalty = (cautions: ProductHealthCaution[] = []) =>
  cautions.reduce(
    (sum, item) =>
      sum +
      (item.severity === "high" ? 12 : item.severity === "medium" ? 6 : 2),
    0,
  );

// ─── Ranking Service ───────────────────────────────────────────────────────────
export class RankRecommendedProductsService {
  /**
   * Ngưỡng score tối thiểu để một sản phẩm được coi là "thực sự liên quan".
   * Stock (+5) + Rating (max 5) = 10 → đặt ngưỡng = 11 để buộc phải có ít nhất
   * 1 keyword match (8đ) hoặc tag match (10đ) thật sự.
   */
  private static readonly MIN_RELEVANCE_SCORE = 11;

  execute(input: {
    products: ChatProductCandidate[];
    filters: RecommendationFilters;
    extractedIntent: ExtractedChatIntent;
  }): RankedChatRecommendation[] {
    const { products, filters, extractedIntent } = input;

    const ranked = products.map((product) => {
      let score = 0;
      const matchedTags = new Set<string>();
      const matchedAttributes: Record<string, any> = {};

      // Các field searchable — đều đã được strip HTML trước khi search
      const searchableTexts = [
        product.title,
        product.description,
        product.shortDescription,
        product.storageGuide,
        product.usageSuggestions,
        product.nutritionNotes,
        ...(product.tags ?? []).flatMap((tag) => [
          tag.name,
          tag.slug,
          tag.group?.name,
        ]),
        ...(product.healthFacts ?? []).flatMap((fact) => [
          fact.factKey,
          fact.factValueText,
          fact.evidenceNote,
        ]),
      ];

      for (const keyword of filters.keywords) {
        if (hasKeyword(searchableTexts, keyword)) {
          score += 8;
          matchedTags.add(keyword);
        }
      }
      for (const tag of filters.tags) {
        if (hasKeyword(searchableTexts, tag)) {
          score += 10;
          matchedTags.add(tag);
        }
      }
      for (const usage of filters.usageKeywords) {
        if (
          hasKeyword(
            [
              product.usageSuggestions,
              ...(product.tags ?? []).map((tag) => tag.name),
            ],
            usage,
          )
        ) {
          score += 12;
          matchedTags.add(usage);
        }
      }
      for (const audience of filters.audienceKeywords) {
        if (hasKeyword(searchableTexts, audience)) {
          score += 11;
          matchedTags.add(audience);
        }
      }

      if (product.featured) {
        score += 2;
        matchedAttributes.featured = true;
      }

      const totalStock = Number(product.totalStock ?? 0);
      if (totalStock > 0) {
        score += 5;
        matchedAttributes.totalStock = totalStock;
      } else if (filters.requireInStock) {
        score -= 25;
      }

      const rating = Number(product.averageRating ?? 0);
      if (rating > 0) {
        score += Math.min(5, rating);
        matchedAttributes.averageRating = rating;
      }

      if (extractedIntent.primaryIntent === "gifting") {
        const hasLargeVariant = (product.variants ?? []).some((variant) =>
          /(size\s*l|large|lớn|gift|quà)/i.test(normalize(variant.title)),
        );
        if (hasLargeVariant) {
          score += 9;
          matchedAttributes.giftSize = true;
        }
      }

      if (extractedIntent.primaryIntent === "weight_loss") {
        if (
          hasKeyword(
            [product.nutritionNotes, product.shortDescription],
            "ít ngọt",
          )
        ) {
          score += 7;
          matchedAttributes.lowSugarMention = true;
        }
        if (
          hasKeyword([product.nutritionNotes], "chất xơ") ||
          hasKeyword([product.usageSuggestions], "ăn kiêng")
        ) {
          score += 6;
          matchedAttributes.weightLossFit = true;
        }
      }

      if (extractedIntent.primaryIntent === "juicing") {
        if (
          hasKeyword([product.usageSuggestions], "ép nước") ||
          hasKeyword(
            [product.tags?.map((tag) => tag.name).join(" ")],
            "ép nước",
          )
        ) {
          score += 10;
          matchedAttributes.juicingFit = true;
        }
      }

      const penalty = cautionPenalty(product.healthCautions);
      if (extractedIntent.shouldAvoidMedicalClaims) {
        score -= penalty;
      }

      const variantId = pickVariantId(product, filters);
      if (variantId) {
        matchedAttributes.variantId = variantId;
      }

      // ─── Xây reason text từ dữ liệu thực tế của sản phẩm (đã strip HTML) ──
      const reasonParts: string[] = [];

      if (matchedAttributes.weightLossFit || matchedAttributes.lowSugarMention) {
        reasonParts.push("ít đường, phù hợp cho người ăn kiêng");
      }
      if (matchedAttributes.juicingFit) {
        reasonParts.push("phù hợp để ép nước hoặc làm sinh tố");
      }
      if (matchedAttributes.giftSize) {
        reasonParts.push("có quy cách đóng gói đẹp, phù hợp biếu tặng");
      }

      // Dùng usageSuggestions → nutritionNotes → shortDescription (theo thứ tự ưu tiên)
      if (product.usageSuggestions) {
        const plain = truncatePlain(product.usageSuggestions, 70);
        if (plain) reasonParts.push(plain);
      } else if (product.nutritionNotes) {
        const plain = truncatePlain(product.nutritionNotes, 70);
        if (plain) reasonParts.push(plain);
      } else if (product.shortDescription) {
        const plain = truncatePlain(product.shortDescription, 70);
        if (plain) reasonParts.push(plain);
      }

      if (product.origin?.name) {
        reasonParts.push(`Xuất xứ ${product.origin.name}`);
      }

      const productRating = Number(product.averageRating ?? 0);
      if (productRating >= 4) {
        reasonParts.push(`Đánh giá ${productRating.toFixed(1)}/5 ⭐`);
      }

      if (!reasonParts.length) {
        reasonParts.push("Phù hợp với nhu cầu hiện tại");
      }

      return {
        product,
        variantId,
        score,
        reason: reasonParts.slice(0, 2).join(" • "),
        matchedTags: Array.from(matchedTags),
        matchedAttributes,
      } as RankedChatRecommendation;
    });

    return ranked
      .filter((item) => {
        // Ngưỡng điểm cứng: loại bỏ sản phẩm điểm âm sâu (hết hàng + caution nặng)
        if (item.score < 0) return false;

        // Nếu user có yêu cầu cụ thể (có keyword sau khi loại stopword, hoặc intent không phải general)
        // thì bắt buộc phải có ít nhất 1 match thực sự (tag, keyword, hoặc thuộc tính intent)
        const hasSpecificNeeds =
          filters.keywords.length > 0 ||
          filters.tags.length > 0 ||
          filters.usageKeywords.length > 0 ||
          filters.audienceKeywords.length > 0 ||
          extractedIntent.primaryIntent !== "general";

        if (hasSpecificNeeds) {
          const hasMeaningfulMatch =
            item.matchedTags.length > 0 ||
            item.matchedAttributes.weightGainFit ||
            item.matchedAttributes.weightLossFit ||
            item.matchedAttributes.lowSugarMention ||
            item.matchedAttributes.juicingFit ||
            item.matchedAttributes.giftSize;

          if (!hasMeaningfulMatch) return false;
        }

        return true;
      })
      .sort((a, b) => b.score - a.score || a.product.id - b.product.id);
  }
}
