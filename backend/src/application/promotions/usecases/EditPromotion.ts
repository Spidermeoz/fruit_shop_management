import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type {
  PromotionDiscountType,
  PromotionProps,
  PromotionScope,
  PromotionStatus,
  UpdatePromotionPatch,
} from "../../../domain/promotions/types";

const normalizeNullableNumber = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Giá trị số không hợp lệ");
  }
  return parsed;
};

const normalizeDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw new Error("Ngày giờ không hợp lệ");
  }
  return d;
};

const normalizeIdList = (value: unknown): number[] | undefined => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0),
    ),
  );
};

const normalizeCode = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

export class EditPromotion {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(
    id: number,
    patch: UpdatePromotionPatch,
  ): Promise<PromotionProps> {
    const promotionId = Number(id);

    if (!Number.isFinite(promotionId) || promotionId <= 0) {
      throw new Error("ID khuyến mãi không hợp lệ");
    }

    const existing = await this.promotionRepo.findById(promotionId);

    if (!existing) {
      throw new Error("Khuyến mãi không tồn tại");
    }

    const normalizedPatch: UpdatePromotionPatch = {};

    if (patch.name !== undefined) {
      const name = String(patch.name ?? "").trim();
      if (!name) {
        throw new Error("Tên khuyến mãi không được để trống");
      }
      normalizedPatch.name = name;
    }

    if (patch.description !== undefined) {
      normalizedPatch.description =
        patch.description !== null
          ? String(patch.description).trim() || null
          : null;
    }

    if (patch.promotionScope !== undefined) {
      const promotionScope = String(patch.promotionScope) as PromotionScope;
      if (!["order", "shipping"].includes(promotionScope)) {
        throw new Error("Phạm vi khuyến mãi không hợp lệ");
      }
      normalizedPatch.promotionScope = promotionScope;
    }

    if (patch.discountType !== undefined) {
      const discountType = String(patch.discountType) as PromotionDiscountType;
      if (!["fixed", "percent", "free_shipping"].includes(discountType)) {
        throw new Error("Loại giảm giá không hợp lệ");
      }
      normalizedPatch.discountType = discountType;
    }

    if (patch.discountValue !== undefined) {
      const discountValue = normalizeNullableNumber(patch.discountValue);
      if (discountValue === null || discountValue === undefined || discountValue < 0) {
        throw new Error("Giá trị giảm giá không hợp lệ");
      }
      normalizedPatch.discountValue = discountValue;
    }

    if (patch.maxDiscountAmount !== undefined) {
      const maxDiscountAmount = normalizeNullableNumber(
        patch.maxDiscountAmount,
      );
      if (
        maxDiscountAmount !== null &&
        maxDiscountAmount !== undefined &&
        maxDiscountAmount < 0
      ) {
        throw new Error("Mức giảm tối đa không hợp lệ");
      }
      normalizedPatch.maxDiscountAmount = maxDiscountAmount;
    }

    if (patch.minOrderValue !== undefined) {
      const minOrderValue = normalizeNullableNumber(patch.minOrderValue);
      if (
        minOrderValue !== null &&
        minOrderValue !== undefined &&
        minOrderValue < 0
      ) {
        throw new Error("Giá trị đơn tối thiểu không hợp lệ");
      }
      normalizedPatch.minOrderValue = minOrderValue;
    }

    if (patch.priority !== undefined) {
      const priority = normalizeNullableNumber(patch.priority);
      if (priority === null || priority === undefined || priority < 0) {
        throw new Error("Độ ưu tiên không hợp lệ");
      }
      normalizedPatch.priority = priority;
    }

    if (patch.usageLimit !== undefined) {
      const usageLimit = normalizeNullableNumber(patch.usageLimit);
      if (usageLimit !== null && usageLimit !== undefined && usageLimit < 0) {
        throw new Error("Giới hạn sử dụng không hợp lệ");
      }
      normalizedPatch.usageLimit = usageLimit;
    }

    if (patch.usageLimitPerUser !== undefined) {
      const usageLimitPerUser = normalizeNullableNumber(
        patch.usageLimitPerUser,
      );
      if (
        usageLimitPerUser !== null &&
        usageLimitPerUser !== undefined &&
        usageLimitPerUser < 0
      ) {
        throw new Error("Giới hạn sử dụng mỗi người không hợp lệ");
      }
      normalizedPatch.usageLimitPerUser = usageLimitPerUser;
    }

    if (patch.startAt !== undefined) {
      normalizedPatch.startAt = normalizeDate(patch.startAt);
    }

    if (patch.endAt !== undefined) {
      normalizedPatch.endAt = normalizeDate(patch.endAt);
    }

    const nextStartAt =
      normalizedPatch.startAt !== undefined
        ? normalizedPatch.startAt
        : (existing.startAt ?? null);

    const nextEndAt =
      normalizedPatch.endAt !== undefined
        ? normalizedPatch.endAt
        : (existing.endAt ?? null);

    if (nextStartAt && nextEndAt && nextStartAt > nextEndAt) {
      throw new Error("Thời gian bắt đầu không được sau thời gian kết thúc");
    }

    if (patch.status !== undefined) {
      const status = patch.status as PromotionStatus;
      if (!["active", "inactive"].includes(status)) {
        throw new Error("Trạng thái khuyến mãi không hợp lệ");
      }
      normalizedPatch.status = status;
    }

    if (patch.isAutoApply !== undefined) {
      normalizedPatch.isAutoApply = !!patch.isAutoApply;
    }

    if (patch.canCombine !== undefined) {
      normalizedPatch.canCombine = !!patch.canCombine;
    }

    const nextScope = normalizedPatch.promotionScope ?? existing.promotionScope;
    const nextDiscountType =
      normalizedPatch.discountType ?? existing.discountType;
    const nextDiscountValue =
      normalizedPatch.discountValue ?? existing.discountValue;

    if (nextDiscountType === "percent" && Number(nextDiscountValue) > 100) {
      throw new Error("Khuyến mãi phần trăm không được vượt quá 100%");
    }

    if (nextDiscountType === "free_shipping" && nextScope !== "shipping") {
      throw new Error("Kiểu free_shipping chỉ áp dụng cho khuyến mãi shipping");
    }

    if (patch.codes !== undefined) {
      const codes = Array.isArray(patch.codes)
        ? patch.codes.map((item) => {
            const code = normalizeCode(item?.code);
            if (!code) {
              throw new Error("Mã khuyến mãi không được để trống");
            }

            const codeUsageLimit = normalizeNullableNumber(item?.usageLimit);
            const codeStartAt = normalizeDate(item?.startAt);
            const codeEndAt = normalizeDate(item?.endAt);
            const codeStatus = item?.status ?? "active";

            if (
              codeUsageLimit !== null &&
              codeUsageLimit !== undefined &&
              codeUsageLimit < 0
            ) {
              throw new Error(`Giới hạn sử dụng của mã ${code} không hợp lệ`);
            }

            if (codeStartAt && codeEndAt && codeStartAt > codeEndAt) {
              throw new Error(`Khoảng thời gian của mã ${code} không hợp lệ`);
            }

            if (!["active", "inactive"].includes(codeStatus)) {
              throw new Error(`Trạng thái của mã ${code} không hợp lệ`);
            }

            return {
              code,
              status: codeStatus,
              usageLimit: codeUsageLimit,
              startAt: codeStartAt,
              endAt: codeEndAt,
            };
          })
        : [];

      const uniqueCodes = new Set<string>();
      for (const item of codes) {
        if (uniqueCodes.has(item.code)) {
          throw new Error(`Mã khuyến mãi bị trùng: ${item.code}`);
        }
        uniqueCodes.add(item.code);
      }

      normalizedPatch.codes = codes;
    }

    if (patch.productIds !== undefined) {
      normalizedPatch.productIds = normalizeIdList(patch.productIds);
    }

    if (patch.categoryIds !== undefined) {
      normalizedPatch.categoryIds = normalizeIdList(patch.categoryIds);
    }

    if (patch.variantIds !== undefined) {
      normalizedPatch.variantIds = normalizeIdList(patch.variantIds);
    }

    if (patch.originIds !== undefined) {
      normalizedPatch.originIds = normalizeIdList(patch.originIds);
    }

    if (patch.branchIds !== undefined) {
      normalizedPatch.branchIds = normalizeIdList(patch.branchIds);
    }

    return this.promotionRepo.update(promotionId, normalizedPatch);
  }
}
