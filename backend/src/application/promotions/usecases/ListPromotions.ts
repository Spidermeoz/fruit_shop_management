import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type {
  PromotionListFilter,
  PromotionListResult,
} from "../../../domain/promotions/types";

export class ListPromotions {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(
    filter: PromotionListFilter = {},
  ): Promise<PromotionListResult> {
    const page =
      filter.page !== undefined && filter.page !== null
        ? Math.max(1, Number(filter.page) || 1)
        : 1;

    const limit =
      filter.limit !== undefined && filter.limit !== null
        ? Math.max(1, Number(filter.limit) || 10)
        : 10;

    return this.promotionRepo.list({
      ...filter,
      page,
      limit,
      q: filter.q ? String(filter.q).trim() : undefined,
      status: filter.status ?? "all",
      promotionScope: filter.promotionScope ?? "all",
      includeDeleted: !!filter.includeDeleted,
    });
  }
}
