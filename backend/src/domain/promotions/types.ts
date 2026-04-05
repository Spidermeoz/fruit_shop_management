export type PromotionScope = "order" | "shipping";
export type PromotionDiscountType = "fixed" | "percent" | "free_shipping";
export type PromotionStatus = "active" | "inactive";
export type PromotionCodeStatus = "active" | "inactive";

export type PromotionTargetScope =
  | "all"
  | "products"
  | "categories"
  | "variants"
  | "origins"
  | "branches";

export type PromotionApplicabilityReason =
  | "OK"
  | "CODE_NOT_FOUND"
  | "CODE_INACTIVE"
  | "CODE_DELETED"
  | "CODE_EXPIRED"
  | "CODE_NOT_STARTED"
  | "PROMOTION_NOT_FOUND"
  | "PROMOTION_INACTIVE"
  | "PROMOTION_DELETED"
  | "PROMOTION_EXPIRED"
  | "PROMOTION_NOT_STARTED"
  | "MIN_ORDER_NOT_MET"
  | "PROMOTION_NOT_APPLICABLE_TO_BRANCH"
  | "PROMOTION_NOT_APPLICABLE_TO_CART"
  | "PROMOTION_NOT_APPLICABLE_TO_SCOPE"
  | "PROMOTION_USAGE_LIMIT_EXCEEDED"
  | "PROMOTION_USER_LIMIT_EXCEEDED"
  | "AUTO_PROMOTION_NOT_ELIGIBLE";

export interface PromotionCodeProps {
  id: number;
  promotionId: number;
  code: string;
  status: PromotionCodeStatus;
  deleted: boolean;
  usageLimit: number | null;
  usageCount: number;
  startAt: Date | null;
  endAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromotionUsageProps {
  id?: number;
  promotionId: number;
  promotionCodeId?: number | null;
  orderId: number;
  userId: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  snapshotJson?: Record<string, any> | null;
  createdAt?: Date;
}

export interface PromotionTargetIds {
  productIds: number[];
  categoryIds: number[];
  variantIds: number[];
  originIds: number[];
  branchIds: number[];
}

export interface PromotionProps {
  id?: number;
  name: string;
  description?: string | null;
  promotionScope: PromotionScope;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  isAutoApply: boolean;
  canCombine: boolean;
  priority: number;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
  status: PromotionStatus;
  deleted: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  codes?: PromotionCodeProps[];
  targets?: PromotionTargetIds;
}

export interface PromotionListFilter {
  page?: number;
  limit?: number;
  q?: string;
  status?: PromotionStatus | "all";
  promotionScope?: PromotionScope | "all";
  isAutoApply?: boolean | null;
  includeDeleted?: boolean;
}

export interface PromotionListResult {
  rows: PromotionProps[];
  count: number;
}

export interface CreatePromotionInput {
  name: string;
  description?: string | null;
  promotionScope: PromotionScope;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  isAutoApply?: boolean;
  canCombine?: boolean;
  priority?: number;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
  status?: PromotionStatus;

  codes?: Array<{
    code: string;
    status?: PromotionCodeStatus;
    usageLimit?: number | null;
    startAt?: Date | null;
    endAt?: Date | null;
  }>;

  productIds?: number[];
  categoryIds?: number[];
  variantIds?: number[];
  originIds?: number[];
  branchIds?: number[];
}

export type UpdatePromotionPatch = Partial<CreatePromotionInput> & {
  deleted?: boolean;
};

export interface PromotionCartItemInput {
  productId: number | null;
  categoryId?: number | null;
  originId?: number | null;
  productVariantId: number | null;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  title?: string | null;
  variantTitle?: string | null;
}

export interface PromotionEvaluationInput {
  userId: number;
  branchId?: number | null;
  promotionCode?: string | null;
  subtotal: number;
  shippingFee: number;
  cartItems: PromotionCartItemInput[];
  now?: Date;
  allowAutoApply?: boolean;
}

export interface PromotionValidationResult {
  ok: boolean;
  reason: PromotionApplicabilityReason;
  message: string;
  promotion: PromotionProps | null;
  promotionCode: PromotionCodeProps | null;
}

export interface AppliedPromotionBreakdown {
  promotionId: number;
  promotionName: string;
  promotionScope: PromotionScope;
  discountType: PromotionDiscountType;
  discountValue: number;
  promotionCodeId?: number | null;
  promotionCode?: string | null;
  discountAmount: number;
  shippingDiscountAmount: number;
  affectedProductIds: number[];
  affectedVariantIds: number[];
  affectedCategoryIds: number[];
  affectedOriginIds: number[];
}

export interface PromotionEvaluationResult {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  finalPrice: number;
  appliedPromotions: AppliedPromotionBreakdown[];
  promotionCode: string | null;
  promotionSnapshotJson: Record<string, any> | null;
  messages: string[];
}
