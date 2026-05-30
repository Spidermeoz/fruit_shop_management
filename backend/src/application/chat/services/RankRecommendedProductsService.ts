import type {
  ChatProductCandidate,
  ConversationTurn,
  ExtractedChatIntent,
  ProductHealthCaution,
  RankedChatRecommendation,
  RecommendationFilters,
} from "../../../domain/chat/types";

// ─── HTML stripping ────────────────────────────────────────────────────────────
const stripHtml = (value: unknown): string => {
  const text = String(value ?? "");
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const truncatePlain = (text: string, maxLen: number): string => {
  const plain = stripHtml(text);
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const normalize = (value: unknown) => stripHtml(value).toLowerCase();
const hasKeyword = (haystacks: Array<unknown>, keyword: string) =>
  haystacks.some((value) => normalize(value).includes(normalize(keyword)));

/**
 * ─── Từ điển đồng nghĩa tiếng Việt ──────────────────────────────────────────
 * Map từ keyword người dùng → các từ đồng nghĩa cần tìm trong dữ liệu sản phẩm.
 * Giải quyết vấn đề: user gõ "mọng nước" → data lưu "nhiều nước" và ngược lại.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  "giảm cân": ["ăn kiêng", "eat clean", "diet", "ít calo", "ít ngọt", "chất xơ", "low calorie"],
  "ăn kiêng": ["giảm cân", "ít calo", "ít đường", "chất xơ", "eat clean"],
  "ít ngọt": ["ít đường", "low sugar", "nhẹ ngọt", "thanh mát", "không ngọt"],
  "ít đường": ["ít ngọt", "low sugar", "không ngọt", "thanh mát"],
  "ép nước": ["nước ép", "sinh tố", "juicing", "nhiều nước", "mọng nước"],
  "sinh tố": ["ép nước", "nước ép", "nhiều nước", "mọng nước"],
  "mọng nước": ["nhiều nước", "ngọt nước", "ép nước", "nước ép"],
  "nhiều nước": ["mọng nước", "ngọt nước", "ép nước"],
  "biếu tặng": ["quà tặng", "tặng quà", "gift", "đẹp", "cao cấp", "sang"],
  "quà tặng": ["biếu tặng", "tặng quà", "gift", "cao cấp"],
  "trẻ em": ["bé", "trẻ nhỏ", "kid", "children", "ngọt mềm"],
  "người già": ["người lớn tuổi", "ông bà", "senior", "mềm", "dễ tiêu"],
  "tăng cường miễn dịch": ["vitamin c", "kháng khuẩn", "chống oxy hóa", "antioxidant", "immunity"],
  "vitamin c": ["miễn dịch", "kháng khuẩn", "chống oxy hóa", "antioxidant"],
  "chất xơ": ["fiber", "tiêu hóa", "ruột", "táo bón", "đường ruột"],
  "tiêu hóa": ["chất xơ", "fiber", "ruột", "đường ruột", "probiotics"],
  "năng lượng": ["carbohydrate", "glucose", "đường", "calo", "tăng lực"],
  "thanh mát": ["mát lạnh", "làm mát", "ít ngọt", "thanh đạm", "nhẹ"],
  "chua ngọt": ["vị chua", "vị ngọt", "thanh chua", "chua nhẹ"],
  "ngọt": ["ngọt tự nhiên", "ngọt đậm", "đường tự nhiên", "fructose"],
  "mềm": ["dễ nhai", "mềm mịn", "không cứng", "chín mềm"],
  "giàu": ["nhiều", "cao", "phong phú", "dồi dào"],
  "tươi": ["fresh", "tươi ngon", "tươi xanh", "tươi mới"],
  "thơm": ["hương thơm", "mùi thơm", "thơm ngon", "thơm ngát"],
};

/**
 * Tìm tất cả từ đồng nghĩa của một keyword.
 */
const expandSynonyms = (keyword: string): string[] => {
  const lower = keyword.toLowerCase();
  const synonyms: string[] = [lower];

  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      synonyms.push(...values);
    }
    for (const val of values) {
      if (lower.includes(val) || val.includes(lower)) {
        synonyms.push(key, ...values.filter((v) => v !== val));
      }
    }
  }

  return Array.from(new Set(synonyms));
};

/**
 * Tính điểm keyword/synonym match với hệ số giảm dần cho synonym.
 * exact match = 1.0, synonym = 0.6
 */
const scoreKeyword = (
  haystacks: Array<unknown>,
  keyword: string,
  weight: number,
): number => {
  const expandedTerms = expandSynonyms(keyword);
  let bestScore = 0;

  // Exact match → điểm đầy đủ
  if (hasKeyword(haystacks, keyword)) {
    bestScore = weight;
  } else {
    // Synonym match → điểm 60%
    for (const synonym of expandedTerms.slice(1)) {
      if (hasKeyword(haystacks, synonym)) {
        bestScore = Math.max(bestScore, weight * 0.6);
      }
    }
  }

  return bestScore;
};

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
   * 1 keyword match thật sự (8đ) hoặc synonym match (4.8đ × 2 = 9.6đ ~ ≥ 11).
   */
  private static readonly MIN_RELEVANCE_SCORE = 11;

  execute(input: {
    products: ChatProductCandidate[];
    filters: RecommendationFilters;
    extractedIntent: ExtractedChatIntent;
    conversationHistory?: ConversationTurn[];
  }): RankedChatRecommendation[] {
    const { products, filters, extractedIntent } = input;

    const ranked = products.map((product) => {
      let score = 0;
      const matchedTags = new Set<string>();
      const matchedAttributes: Record<string, any> = {};

      // Các field searchable chính (có trọng số cao)
      const primaryTexts = [
        product.nutritionNotes,
        product.usageSuggestions,
        product.shortDescription,
      ];

      // Các field searchable phụ (tag/origin/title)
      const secondaryTexts = [
        product.title,
        product.description,
        product.storageGuide,
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

      const allTexts = [...primaryTexts, ...secondaryTexts];

      // ── Keyword scoring với synonym expansion ──────────────────────────────
      for (const keyword of filters.keywords) {
        // Primary fields → trọng số cao hơn
        const primaryScore = scoreKeyword(primaryTexts, keyword, 10);
        const secondaryScore =
          primaryScore === 0 ? scoreKeyword(secondaryTexts, keyword, 6) : 0;
        const kwScore = primaryScore + secondaryScore;

        if (kwScore > 0) {
          score += kwScore;
          matchedTags.add(keyword);
        }
      }

      // ── Tag scoring với synonym expansion ─────────────────────────────────
      for (const tag of filters.tags) {
        const tagScore = scoreKeyword(allTexts, tag, 10);
        if (tagScore > 0) {
          score += tagScore;
          matchedTags.add(tag);
        }
      }

      // ── Usage keywords (trọng số cao nhất) ────────────────────────────────
      for (const usage of filters.usageKeywords) {
        const usageScore = scoreKeyword(
          [product.usageSuggestions, ...(product.tags ?? []).map((tag) => tag.name)],
          usage,
          14,
        );
        if (usageScore > 0) {
          score += usageScore;
          matchedTags.add(usage);
        }
      }

      // ── Audience keywords ──────────────────────────────────────────────────
      for (const audience of filters.audienceKeywords) {
        const audScore = scoreKeyword(allTexts, audience, 12);
        if (audScore > 0) {
          score += audScore;
          matchedTags.add(audience);
        }
      }

      // ── Featured bonus ─────────────────────────────────────────────────────
      if (product.featured) {
        score += 2;
        matchedAttributes.featured = true;
      }

      // ── Stock check ────────────────────────────────────────────────────────
      const totalStock = Number(product.totalStock ?? 0);
      if (totalStock > 0) {
        score += 5;
        matchedAttributes.totalStock = totalStock;
      } else if (filters.requireInStock) {
        score -= 25;
      }

      // ── Rating bonus ───────────────────────────────────────────────────────
      const rating = Number(product.averageRating ?? 0);
      if (rating > 0) {
        score += Math.min(5, rating);
        matchedAttributes.averageRating = rating;
      }

      // ── Intent-specific bonus ──────────────────────────────────────────────
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
        if (scoreKeyword(primaryTexts, "ít ngọt", 1) > 0) {
          score += 7;
          matchedAttributes.lowSugarMention = true;
        }
        if (
          scoreKeyword([product.nutritionNotes], "chất xơ", 1) > 0 ||
          scoreKeyword([product.usageSuggestions], "ăn kiêng", 1) > 0
        ) {
          score += 6;
          matchedAttributes.weightLossFit = true;
        }
      }

      if (extractedIntent.primaryIntent === "juicing") {
        if (
          scoreKeyword([product.usageSuggestions], "ép nước", 1) > 0 ||
          scoreKeyword(
            [product.tags?.map((tag) => tag.name).join(" ")],
            "ép nước",
            1,
          ) > 0
        ) {
          score += 10;
          matchedAttributes.juicingFit = true;
        }
      }

      if (extractedIntent.primaryIntent === "kids") {
        if (scoreKeyword(primaryTexts, "ngọt", 1) > 0 || scoreKeyword(primaryTexts, "mềm", 1) > 0) {
          score += 5;
          matchedAttributes.kidFriendly = true;
        }
      }

      if (extractedIntent.primaryIntent === "seniors") {
        if (scoreKeyword(primaryTexts, "mềm", 1) > 0 || scoreKeyword(primaryTexts, "dễ tiêu", 1) > 0) {
          score += 5;
          matchedAttributes.seniorFriendly = true;
        }
      }

      // ── Health caution penalty ─────────────────────────────────────────────
      const penalty = cautionPenalty(product.healthCautions);
      if (extractedIntent.shouldAvoidMedicalClaims) {
        score -= penalty;
      }

      const variantId = pickVariantId(product, filters);
      if (variantId) {
        matchedAttributes.variantId = variantId;
      }

      // ── Xây reason text từ dữ liệu thực tế ───────────────────────────────
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
      if (matchedAttributes.kidFriendly) {
        reasonParts.push("ngọt mềm, phù hợp cho trẻ em");
      }
      if (matchedAttributes.seniorFriendly) {
        reasonParts.push("mềm, dễ tiêu, phù hợp người lớn tuổi");
      }

      // Ưu tiên usageSuggestions → nutritionNotes → shortDescription
      if (product.usageSuggestions) {
        const plain = truncatePlain(product.usageSuggestions, 80);
        if (plain) reasonParts.push(plain);
      } else if (product.nutritionNotes) {
        const plain = truncatePlain(product.nutritionNotes, 80);
        if (plain) reasonParts.push(plain);
      } else if (product.shortDescription) {
        const plain = truncatePlain(product.shortDescription, 80);
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
        // Loại bỏ sản phẩm điểm âm sâu (hết hàng + caution nặng)
        if (item.score < 0) return false;

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
            item.matchedAttributes.giftSize ||
            item.matchedAttributes.kidFriendly ||
            item.matchedAttributes.seniorFriendly;

          if (!hasMeaningfulMatch) return false;
        }

        return true;
      })
      .sort((a, b) => b.score - a.score || a.product.id - b.product.id);
  }
}
