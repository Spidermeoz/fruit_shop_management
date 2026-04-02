export type BranchServiceAreaStatus = "active" | "inactive";

export interface BranchServiceAreaProps {
  id?: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status?: BranchServiceAreaStatus;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BranchServiceArea {
  private _props: BranchServiceAreaProps;

  private constructor(props: BranchServiceAreaProps) {
    this._props = BranchServiceArea.validate(props);
  }

  static create(props: BranchServiceAreaProps) {
    return new BranchServiceArea(props);
  }

  get props(): Readonly<BranchServiceAreaProps> {
    return this._props;
  }

  static validate(p: BranchServiceAreaProps): BranchServiceAreaProps {
    if (!p.branchId || p.branchId <= 0) {
      throw new Error("branchId không hợp lệ");
    }

    if (!p.shippingZoneId || p.shippingZoneId <= 0) {
      throw new Error("shippingZoneId không hợp lệ");
    }

    const deliveryFeeOverride =
      p.deliveryFeeOverride !== undefined && p.deliveryFeeOverride !== null
        ? Number(p.deliveryFeeOverride)
        : null;

    const minOrderValue =
      p.minOrderValue !== undefined && p.minOrderValue !== null
        ? Number(p.minOrderValue)
        : null;

    const maxOrderValue =
      p.maxOrderValue !== undefined && p.maxOrderValue !== null
        ? Number(p.maxOrderValue)
        : null;

    if (
      deliveryFeeOverride !== null &&
      (!Number.isFinite(deliveryFeeOverride) || deliveryFeeOverride < 0)
    ) {
      throw new Error("deliveryFeeOverride không hợp lệ");
    }

    if (
      minOrderValue !== null &&
      (!Number.isFinite(minOrderValue) || minOrderValue < 0)
    ) {
      throw new Error("minOrderValue không hợp lệ");
    }

    if (
      maxOrderValue !== null &&
      (!Number.isFinite(maxOrderValue) || maxOrderValue < 0)
    ) {
      throw new Error("maxOrderValue không hợp lệ");
    }

    if (
      minOrderValue !== null &&
      maxOrderValue !== null &&
      minOrderValue > maxOrderValue
    ) {
      throw new Error("minOrderValue không được lớn hơn maxOrderValue");
    }

    const status = String(p.status ?? "active")
      .trim()
      .toLowerCase() as BranchServiceAreaStatus;

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái vùng phục vụ không hợp lệ");
    }

    return {
      ...p,
      deliveryFeeOverride,
      minOrderValue,
      maxOrderValue,
      supportsSameDay: p.supportsSameDay ?? true,
      status,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
    };
  }

  changeStatus(status: BranchServiceAreaStatus) {
    this._props = BranchServiceArea.validate({
      ...this._props,
      status,
    });
  }
}
