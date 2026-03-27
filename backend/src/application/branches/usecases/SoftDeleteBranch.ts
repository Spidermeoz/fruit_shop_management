import type { BranchRepository } from "../../../domain/branches/BranchRepository";

export class SoftDeleteBranch {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(id: number) {
    const branchId = Number(id);
    if (!branchId || branchId <= 0) {
      throw new Error("Branch id không hợp lệ");
    }

    return this.branchRepo.softDelete(branchId);
  }
}
