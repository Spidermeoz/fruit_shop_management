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

    return {
      ...p,
      deliveryFeeOverride: p.deliveryFeeOverride ?? null,
      minOrderValue: p.minOrderValue ?? null,
      maxOrderValue: p.maxOrderValue ?? null,
      supportsSameDay: p.supportsSameDay ?? true,
      status: p.status ?? "active",
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
