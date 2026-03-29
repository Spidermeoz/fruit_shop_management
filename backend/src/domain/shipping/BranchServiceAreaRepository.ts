import type { BranchServiceArea } from "./BranchServiceArea";
import type {
  CreateBranchServiceAreaInput,
  ListBranchServiceAreasFilter,
  UpdateBranchServiceAreaPatch,
} from "./branchServiceArea.types";

export interface BranchServiceAreaRepository {
  list(
    filter: ListBranchServiceAreasFilter,
  ): Promise<{ rows: BranchServiceArea[]; count: number }>;

  findById(
    id: number,
    includeDeleted?: boolean,
  ): Promise<BranchServiceArea | null>;

  findByBranchAndZone(
    branchId: number,
    shippingZoneId: number,
  ): Promise<BranchServiceArea | null>;

  create(input: CreateBranchServiceAreaInput): Promise<BranchServiceArea>;

  update(
    id: number,
    patch: UpdateBranchServiceAreaPatch,
  ): Promise<BranchServiceArea>;

  updateStatus(
    id: number,
    status: "active" | "inactive",
  ): Promise<BranchServiceArea>;

  softDelete(id: number): Promise<{ id: number; deletedAt: Date }>;
}
