// src/domain/branches/BranchRepository.ts
import type { Branch } from "./Branch";
import type {
  CreateBranchInput,
  ListBranchesFilter,
  UpdateBranchPatch,
} from "./types";

export interface BranchRepository {
  list(filter: ListBranchesFilter): Promise<{ rows: Branch[]; count: number }>;
  findById(id: number, includeDeleted?: boolean): Promise<Branch | null>;
  findByCode(code: string): Promise<Branch | null>;
  create(input: CreateBranchInput): Promise<Branch>;
  update(id: number, patch: UpdateBranchPatch): Promise<Branch>;
  updateStatus(id: number, status: "active" | "inactive"): Promise<Branch>;
  softDelete(id: number): Promise<{ id: number; deletedAt: Date }>;
}
