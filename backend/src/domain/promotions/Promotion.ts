import type {
  PromotionCodeProps,
  PromotionProps,
  PromotionTargetIds,
} from "./types";

const normalizeTargets = (
  targets?: PromotionTargetIds | null,
): PromotionTargetIds => ({
  productIds: Array.isArray(targets?.productIds) ? targets!.productIds : [],
  categoryIds: Array.isArray(targets?.categoryIds) ? targets!.categoryIds : [],
  variantIds: Array.isArray(targets?.variantIds) ? targets!.variantIds : [],
  originIds: Array.isArray(targets?.originIds) ? targets!.originIds : [],
  branchIds: Array.isArray(targets?.branchIds) ? targets!.branchIds : [],
});

export class Promotion {
  props: PromotionProps;

  private constructor(props: PromotionProps) {
    this.props = {
      ...props,
      description: props.description ?? null,
      maxDiscountAmount: props.maxDiscountAmount ?? null,
      minOrderValue: props.minOrderValue ?? null,
      isAutoApply: !!props.isAutoApply,
      canCombine: !!props.canCombine,
      priority: Number(props.priority ?? 0),
      usageLimit: props.usageLimit ?? null,
      usageLimitPerUser: props.usageLimitPerUser ?? null,
      startAt: props.startAt ?? null,
      endAt: props.endAt ?? null,
      deleted: !!props.deleted,
      deletedAt: props.deletedAt ?? null,
      codes: Array.isArray(props.codes) ? props.codes : [],
      targets: normalizeTargets(props.targets),
    };
  }

  static create(props: PromotionProps) {
    return new Promotion(props);
  }

  get id() {
    return this.props.id ?? null;
  }

  get name() {
    return this.props.name;
  }

  get status() {
    return this.props.status;
  }

  get promotionScope() {
    return this.props.promotionScope;
  }

  get discountType() {
    return this.props.discountType;
  }

  get discountValue() {
    return Number(this.props.discountValue ?? 0);
  }

  get maxDiscountAmount() {
    return this.props.maxDiscountAmount ?? null;
  }

  get minOrderValue() {
    return this.props.minOrderValue ?? null;
  }

  get isAutoApply() {
    return !!this.props.isAutoApply;
  }

  get canCombine() {
    return !!this.props.canCombine;
  }

  get priority() {
    return Number(this.props.priority ?? 0);
  }

  get usageLimit() {
    return this.props.usageLimit ?? null;
  }

  get usageLimitPerUser() {
    return this.props.usageLimitPerUser ?? null;
  }

  get startAt() {
    return this.props.startAt ?? null;
  }

  get endAt() {
    return this.props.endAt ?? null;
  }

  get deleted() {
    return !!this.props.deleted;
  }

  get codes(): PromotionCodeProps[] {
    return Array.isArray(this.props.codes) ? this.props.codes : [];
  }

  get targets(): PromotionTargetIds {
    return normalizeTargets(this.props.targets);
  }

  hasTargetRestrictions() {
    const t = this.targets;
    return (
      t.productIds.length > 0 ||
      t.categoryIds.length > 0 ||
      t.variantIds.length > 0 ||
      t.originIds.length > 0 ||
      t.branchIds.length > 0
    );
  }

  isActiveAt(now: Date) {
    if (this.deleted) return false;
    if (this.status !== "active") return false;
    if (this.startAt && now < this.startAt) return false;
    if (this.endAt && now > this.endAt) return false;
    return true;
  }
}
