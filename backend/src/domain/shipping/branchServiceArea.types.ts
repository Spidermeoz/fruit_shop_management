import type { BranchServiceAreaStatus } from "./BranchServiceArea";

export type BulkWriteMode = "skip_existing" | "overwrite" | "fail_on_conflict";

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

export type BulkUpsertBranchServiceAreaItem = {
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status?: BranchServiceAreaStatus;
};

export type CopyBranchServiceAreasFromBranchInput = {
  sourceBranchId: number;
  targetBranchIds: number[];
  mode?: BulkWriteMode;
  statusOverride?: BranchServiceAreaStatus;
};

export type BulkChangeBranchServiceAreaStatusInput = {
  ids: number[];
  status: BranchServiceAreaStatus;
};
