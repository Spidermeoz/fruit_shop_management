import type { BranchRepository } from "../../../domain/branches/BranchRepository";

export class ChangeBranchStatus {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(id: number, status: "active" | "inactive") {
    const branchId = Number(id);
    if (!branchId || branchId <= 0) {
      throw new Error("Branch id không hợp lệ");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái chi nhánh không hợp lệ");
    }

    const updated = await this.branchRepo.updateStatus(branchId, status);
    return updated.props;
  }
}
