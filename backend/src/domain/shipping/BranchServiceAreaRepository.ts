import type { BranchServiceArea } from "./BranchServiceArea";
import type {
  BulkChangeBranchServiceAreaStatusInput,
  BulkUpsertBranchServiceAreaItem,
  CopyBranchServiceAreasFromBranchInput,
  CreateBranchServiceAreaInput,
  ListBranchServiceAreasFilter,
  UpdateBranchServiceAreaPatch,
} from "./branchServiceArea.types";

export interface BranchServiceAreaBulkWriteResult {
  created: BranchServiceArea[];
  updated: BranchServiceArea[];
  skipped: Array<{ branchId: number; shippingZoneId: number; reason: string }>;
  conflicts: Array<{
    branchId: number;
    shippingZoneId: number;
    reason: string;
  }>;
}

export interface BranchServiceAreaRepository {
  list(
    filter: ListBranchServiceAreasFilter,
  ): Promise<{ rows: BranchServiceArea[]; count: number }>;

  findById(
    id: number,
    includeDeleted?: boolean,
  ): Promise<BranchServiceArea | null>;

  findByIds(ids: number[]): Promise<BranchServiceArea[]>;

  findByBranchAndZone(
    branchId: number,
    shippingZoneId: number,
  ): Promise<BranchServiceArea | null>;

  findDeletedByBranchAndZone(
    branchId: number,
    shippingZoneId: number,
  ): Promise<BranchServiceArea | null>;

  findByBranchIds(branchIds: number[]): Promise<BranchServiceArea[]>;

  create(input: CreateBranchServiceAreaInput): Promise<BranchServiceArea>;

  update(
    id: number,
    patch: UpdateBranchServiceAreaPatch,
  ): Promise<BranchServiceArea>;

  revive(
    id: number,
    patch: UpdateBranchServiceAreaPatch,
  ): Promise<BranchServiceArea>;

  bulkUpsert(
    items: BulkUpsertBranchServiceAreaItem[],
    mode?: CopyBranchServiceAreasFromBranchInput["mode"],
  ): Promise<BranchServiceAreaBulkWriteResult>;

  copyFromBranch(
    input: CopyBranchServiceAreasFromBranchInput,
  ): Promise<BranchServiceAreaBulkWriteResult>;

  updateStatus(
    id: number,
    status: "active" | "inactive",
  ): Promise<BranchServiceArea>;

  bulkUpdateStatus(
    input: BulkChangeBranchServiceAreaStatusInput,
  ): Promise<{ updatedIds: number[]; notFoundIds: number[] }>;

  softDelete(id: number): Promise<{ id: number; deletedAt: Date }>;
}
