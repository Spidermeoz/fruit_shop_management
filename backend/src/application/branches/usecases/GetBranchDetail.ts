import type { BranchRepository } from "../../../domain/branches/BranchRepository";

export class GetBranchDetail {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(id: number) {
    const branchId = Number(id);
    if (!branchId || branchId <= 0) {
      throw new Error("Branch id không hợp lệ");
    }

    const branch = await this.branchRepo.findById(branchId, true);
    if (!branch) {
      throw new Error("Không tìm thấy chi nhánh");
    }

    return branch.props;
  }
}
