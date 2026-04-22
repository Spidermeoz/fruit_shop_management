import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type {
  CreatePromotionInput,
  PromotionDiscountType,
  PromotionProps,
  PromotionScope,
  PromotionStatus,
} from "../../../domain/promotions/types";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

const normalizeNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Giá trị số không hợp lệ");
  }
  return parsed;
};

const normalizeDate = (value: unknown): Date | null => {
  if (value === undefined || value === null || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw new Error("Ngày giờ không hợp lệ");
  }
  return d;
};

const normalizeIdList = (value: unknown): number[] => {
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

type ActorContext = {
  id?: number | null;
  roleId?: number | null;
  branchIds?: number[];
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const pickActorBranchId = (actor?: ActorContext): number | null => {
  if (!Array.isArray(actor?.branchIds)) return null;
  const branchId = actor.branchIds
    .map(Number)
    .find((x) => Number.isFinite(x) && x > 0);
  return branchId ?? null;
};
const toSnapshot = (value: any) => value?.props ?? value ?? null;

export class CreatePromotion {
  constructor(
    private readonly promotionRepo: PromotionRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    input: CreatePromotionInput,
    actor?: ActorContext,
  ): Promise<PromotionProps> {
    const name = String(input.name ?? "").trim();
    const description =
      input.description !== undefined && input.description !== null
        ? String(input.description).trim() || null
        : null;

    const promotionScope = String(input.promotionScope ?? "") as PromotionScope;

    const discountType = String(
      input.discountType ?? "",
    ) as PromotionDiscountType;

    const discountValue = normalizeNullableNumber(input.discountValue);
    const maxDiscountAmount = normalizeNullableNumber(input.maxDiscountAmount);
    const minOrderValue = normalizeNullableNumber(input.minOrderValue);
    const priority = normalizeNullableNumber(input.priority) ?? 0;
    const usageLimit = normalizeNullableNumber(input.usageLimit);
    const usageLimitPerUser = normalizeNullableNumber(input.usageLimitPerUser);
    const startAt = normalizeDate(input.startAt);
    const endAt = normalizeDate(input.endAt);
    const status = (input.status ?? "active") as PromotionStatus;

    if (!name) {
      throw new Error("Tên khuyến mãi là bắt buộc");
    }

    if (!["order", "shipping"].includes(promotionScope)) {
      throw new Error("Phạm vi khuyến mãi không hợp lệ");
    }

    if (!["fixed", "percent", "free_shipping"].includes(discountType)) {
      throw new Error("Loại giảm giá không hợp lệ");
    }

    if (discountValue === null || discountValue < 0) {
      throw new Error("Giá trị giảm giá không hợp lệ");
    }

    if (discountType === "percent" && discountValue > 100) {
      throw new Error("Khuyến mãi phần trăm không được vượt quá 100%");
    }

    if (discountType === "free_shipping" && promotionScope !== "shipping") {
      throw new Error("Kiểu free_shipping chỉ áp dụng cho khuyến mãi shipping");
    }

    if (maxDiscountAmount !== null && maxDiscountAmount < 0) {
      throw new Error("Mức giảm tối đa không hợp lệ");
    }

    if (minOrderValue !== null && minOrderValue < 0) {
      throw new Error("Giá trị đơn tối thiểu không hợp lệ");
    }

    if (priority < 0) {
      throw new Error("Độ ưu tiên không hợp lệ");
    }

    if (usageLimit !== null && usageLimit < 0) {
      throw new Error("Giới hạn sử dụng không hợp lệ");
    }

    if (usageLimitPerUser !== null && usageLimitPerUser < 0) {
      throw new Error("Giới hạn sử dụng mỗi người không hợp lệ");
    }

    if (startAt && endAt && startAt > endAt) {
      throw new Error("Thời gian bắt đầu không được sau thời gian kết thúc");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái khuyến mãi không hợp lệ");
    }

    const codes = Array.isArray(input.codes)
      ? input.codes.map((item) => {
          const code = normalizeCode(item?.code);
          if (!code) {
            throw new Error("Mã khuyến mãi không được để trống");
          }

          const codeUsageLimit = normalizeNullableNumber(item?.usageLimit);
          const codeStartAt = normalizeDate(item?.startAt);
          const codeEndAt = normalizeDate(item?.endAt);
          const codeStatus = item?.status ?? "active";

          if (codeUsageLimit !== null && codeUsageLimit < 0) {
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

    const created = await this.promotionRepo.create({
      name,
      description,
      promotionScope,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderValue,
      isAutoApply: !!input.isAutoApply,
      canCombine: !!input.canCombine,
      priority,
      usageLimit,
      usageLimitPerUser,
      startAt,
      endAt,
      status,
      codes,
      productIds: normalizeIdList(input.productIds),
      categoryIds: normalizeIdList(input.categoryIds),
      variantIds: normalizeIdList(input.variantIds),
      originIds: normalizeIdList(input.originIds),
      branchIds: normalizeIdList(input.branchIds),
    });

    if (this.createAuditLog) {
      const createdSnapshot = toSnapshot(created);
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "create",
        moduleName: "promotion",
        entityType: "promotion",
        entityId: Number(createdSnapshot?.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: createdSnapshot as any,
      });
    }

    return created;
  }
}
