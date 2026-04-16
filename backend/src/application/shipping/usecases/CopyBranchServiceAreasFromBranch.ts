import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

export class CopyBranchServiceAreasFromBranch {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly branchRepo: BranchRepository,
  ) {}

  async execute(input: {
    sourceBranchId: number;
    targetBranchIds: number[];
    mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
    statusOverride?: "active" | "inactive";
  }) {
    const sourceBranchId = Number(input.sourceBranchId);
    const targetBranchIds = [
      ...new Set(
        (input.targetBranchIds ?? [])
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0 && x !== sourceBranchId),
      ),
    ];
    if (!Number.isInteger(sourceBranchId) || sourceBranchId <= 0)
      throw new Error("Chi nhánh nguồn không hợp lệ");
    if (!targetBranchIds.length)
      throw new Error("Danh sách chi nhánh đích không hợp lệ");
    const sourceBranch = await this.branchRepo.findById(sourceBranchId);
    if (!sourceBranch) throw new Error("Không tìm thấy chi nhánh nguồn");
    for (const targetId of targetBranchIds) {
      const targetBranch = await this.branchRepo.findById(targetId);
      if (!targetBranch)
        throw new Error(`Không tìm thấy chi nhánh đích #${targetId}`);
    }
    return this.branchServiceAreaRepo.copyFromBranch({
      ...input,
      sourceBranchId,
      targetBranchIds,
    });
  }
}
