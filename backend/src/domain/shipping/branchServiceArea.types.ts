import type { BranchServiceAreaStatus } from "./BranchServiceArea";

export type ListBranchServiceAreasFilter = {
  branchId?: number;
  shippingZoneId?: number;
  status?: BranchServiceAreaStatus | "all";
  q?: string;
  limit?: number;
  offset?: number;
};

export type CreateBranchServiceAreaInput = {
  branchId: number;
  shippingZoneId: number;

  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;

  supportsSameDay?: boolean;
  status?: BranchServiceAreaStatus;
};

export type UpdateBranchServiceAreaPatch = {
  branchId?: number;
  shippingZoneId?: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status?: BranchServiceAreaStatus;
};
