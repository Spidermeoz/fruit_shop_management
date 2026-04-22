import type { ProductRepository } from "../../../domain/products/ProductRepository";
import type { ProductHealthCautionRepository } from "../../../domain/chat/ProductHealthCautionRepository";
import type { ProductHealthFactRepository } from "../../../domain/chat/ProductHealthFactRepository";
import type {
  ChatProductCandidate,
  RecommendProductsInput,
  RecommendProductsOutput,
} from "../../../domain/chat/types";
import { RankRecommendedProductsService } from "../services/RankRecommendedProductsService";

const normalizeProduct = (raw: any): ChatProductCandidate => {
  const p = raw?.props ?? raw;
  return {
    id: Number(p.id),
    title: String(p.title ?? ""),
    slug: p.slug ?? null,
    status: p.status ?? "active",
    featured: !!p.featured,
    thumbnail: p.thumbnail ?? null,
    description: p.description ?? null,
    shortDescription: p.shortDescription ?? p.short_description ?? null,
    storageGuide: p.storageGuide ?? p.storage_guide ?? null,
    usageSuggestions: p.usageSuggestions ?? p.usage_suggestions ?? null,
    nutritionNotes: p.nutritionNotes ?? p.nutrition_notes ?? null,
    price: p.price !== undefined && p.price !== null ? Number(p.price) : null,
    totalStock: Number(p.totalStock ?? p.stock ?? 0),
    averageRating: Number(p.averageRating ?? 0),
    reviewCount: Number(p.reviewCount ?? 0),
    origin: p.origin
      ? {
          id: Number(p.origin.id),
          name: String(p.origin.name ?? ""),
          slug: p.origin.slug ?? null,
        }
      : null,
    tags: Array.isArray(p.tags)
      ? p.tags.map((tag: any) => ({
          id: Number(tag.id),
          name: String(tag.name ?? ""),
          slug: tag.slug ?? null,
          productTagGroupId:
            tag.productTagGroupId ?? tag.product_tag_group_id ?? null,
          group: tag.group
            ? {
                id: Number(tag.group.id),
                name: String(tag.group.name ?? ""),
                slug: tag.group.slug ?? null,
              }
            : null,
        }))
      : [],
    variants: Array.isArray(p.variants)
      ? p.variants.map((variant: any) => ({
          id: Number(variant.id),
          productId: variant.productId ?? variant.product_id ?? null,
          sku: variant.sku ?? null,
          title: variant.title ?? null,
          price: Number(variant.price ?? 0),
          compareAtPrice:
            variant.compareAtPrice ?? variant.compare_at_price ?? null,
          stock: Number(variant.stock ?? 0),
          availableStock: Number(variant.availableStock ?? variant.stock ?? 0),
          reservedQuantity: Number(variant.reservedQuantity ?? 0),
          status: variant.status ?? "active",
          sortOrder: Number(variant.sortOrder ?? variant.sort_order ?? 0),
        }))
      : [],
  };
};

const uniqueById = <T extends { id: number }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

export class RecommendProductsForChat {
  constructor(
    private productRepo: ProductRepository,
    private rankService: RankRecommendedProductsService,
    private healthFactRepo?: ProductHealthFactRepository,
    private healthCautionRepo?: ProductHealthCautionRepository,
  ) {}

  async execute(
    input: RecommendProductsInput,
  ): Promise<RecommendProductsOutput> {
    const [primary, fallback] = await Promise.all([
      this.productRepo.list({
        page: 1,
        limit: 40,
        q: input.filters.searchText,
        status: "active",
        sortBy: "id",
        order: "DESC",
      }),
      this.productRepo.list({
        page: 1,
        limit: 60,
        q: undefined,
        status: "active",
        sortBy: "id",
        order: "DESC",
      }),
    ]);

    const candidates = uniqueById(
      [...(primary.rows ?? []), ...(fallback.rows ?? [])].map(normalizeProduct),
    );
    const productIds = candidates.map((item) => item.id);

    const [facts, cautions] = await Promise.all([
      this.healthFactRepo?.listByProductIds(productIds) ?? Promise.resolve([]),
      this.healthCautionRepo?.listActiveByProductIds(productIds) ??
        Promise.resolve([]),
    ]);

    const factsByProductId = new Map<number, any[]>();
    for (const fact of facts) {
      const arr = factsByProductId.get(Number(fact.productId)) ?? [];
      arr.push(fact);
      factsByProductId.set(Number(fact.productId), arr);
    }
    const cautionsByProductId = new Map<number, any[]>();
    for (const caution of cautions) {
      const arr = cautionsByProductId.get(Number(caution.productId)) ?? [];
      arr.push(caution);
      cautionsByProductId.set(Number(caution.productId), arr);
    }

    const enriched = candidates.map((item) => ({
      ...item,
      healthFacts: factsByProductId.get(item.id) ?? [],
      healthCautions: cautionsByProductId.get(item.id) ?? [],
    }));
    const ranked = this.rankService
      .execute({
        products: enriched,
        filters: input.filters,
        extractedIntent: input.extractedIntent,
      })
      .filter((item) => item.score > -10)
      .slice(0, input.filters.maxResults);

    return { filters: input.filters, recommendations: ranked };
  }
}
