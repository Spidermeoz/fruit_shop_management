import type {
  ChatProductCandidate,
  ProductHealthCaution,
  RankedChatRecommendation,
  RecommendationFilters,
  ExtractedChatIntent,
} from "../../../domain/chat/types";

const normalize = (value: unknown) => String(value ?? "").toLowerCase();
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

export class RankRecommendedProductsService {
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

      const reasonParts: string[] = [];
      if (matchedTags.size)
        reasonParts.push(
          `Khớp nhu cầu: ${Array.from(matchedTags).slice(0, 3).join(", ")}`,
        );
      if (matchedAttributes.totalStock) reasonParts.push("đang còn hàng");
      if (matchedAttributes.giftSize)
        reasonParts.push("có quy cách phù hợp biếu tặng");
      if (matchedAttributes.juicingFit)
        reasonParts.push("có gợi ý phù hợp để ép nước");
      if (!reasonParts.length) reasonParts.push("phù hợp với nhu cầu hiện tại");

      return {
        product,
        variantId,
        score,
        reason: reasonParts.join(", "),
        matchedTags: Array.from(matchedTags),
        matchedAttributes,
      } as RankedChatRecommendation;
    });

    return ranked.sort(
      (a, b) => b.score - a.score || a.product.id - b.product.id,
    );
  }
}
