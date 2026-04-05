import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";

export interface ListPromotionUsagesFilter {
  promotionId?: number | null;
  userId?: number | null;
  orderId?: number | null;
  page?: number;
  limit?: number;
}

type PromotionUsageListItem = {
  id: number;
  promotionId: number;
  promotionCodeId?: number | null;
  orderId: number;
  userId: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  snapshotJson?: Record<string, any> | null;
  createdAt?: Date | string;
};

type PromotionUsageListResult = {
  rows: PromotionUsageListItem[];
  count: number;
};

type PromotionUsageReadableRepository = PromotionRepository & {
  listUsages: (
    filter: ListPromotionUsagesFilter,
  ) => Promise<PromotionUsageListResult>;
};

export class ListPromotionUsages {
  private readonly repo: PromotionUsageReadableRepository;

  constructor(promotionRepo: PromotionRepository) {
    this.repo = promotionRepo as PromotionUsageReadableRepository;
  }

  async execute(
    filter: ListPromotionUsagesFilter = {},
  ): Promise<PromotionUsageListResult> {
    if (typeof this.repo.listUsages !== "function") {
      throw new Error(
        "Promotion repository chưa hỗ trợ listUsages. Hãy bổ sung method này trong repository.",
      );
    }

    const page =
      filter.page !== undefined && filter.page !== null
        ? Math.max(1, Number(filter.page) || 1)
        : 1;

    const limit =
      filter.limit !== undefined && filter.limit !== null
        ? Math.max(1, Number(filter.limit) || 20)
        : 20;

    const promotionId =
      filter.promotionId !== undefined && filter.promotionId !== null
        ? Number(filter.promotionId)
        : null;

    const userId =
      filter.userId !== undefined && filter.userId !== null
        ? Number(filter.userId)
        : null;

    const orderId =
      filter.orderId !== undefined && filter.orderId !== null
        ? Number(filter.orderId)
        : null;

    if (
      promotionId !== null &&
      (!Number.isFinite(promotionId) || promotionId <= 0)
    ) {
      throw new Error("ID khuyến mãi không hợp lệ");
    }

    if (userId !== null && (!Number.isFinite(userId) || userId <= 0)) {
      throw new Error("ID người dùng không hợp lệ");
    }

    if (orderId !== null && (!Number.isFinite(orderId) || orderId <= 0)) {
      throw new Error("ID đơn hàng không hợp lệ");
    }

    return this.repo.listUsages({
      promotionId,
      userId,
      orderId,
      page,
      limit,
    });
  }
}
