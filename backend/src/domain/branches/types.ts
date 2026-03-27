// src/domain/branches/types.ts
import type { BranchStatus } from "./Branch";

export type BranchSortColumn =
  | "id"
  | "name"
  | "code"
  | "status"
  | "created_at"
  | "updated_at";

export type BranchSort = { column: BranchSortColumn; dir: "ASC" | "DESC" };

export type ListBranchesFilter = {
  q?: string;
  status?: BranchStatus | "all";
  includeDeleted?: boolean;
  sort?: BranchSort;
  limit?: number;
  offset?: number;
};

export type CreateBranchInput = {
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  status?: BranchStatus;
};

export type UpdateBranchPatch = Partial<CreateBranchInput>;
