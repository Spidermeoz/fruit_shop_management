import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { UpdateBranchPatch } from "../../../domain/branches/types";

export class EditBranch {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(id: number, patch: UpdateBranchPatch) {
    const branchId = Number(id);
    if (!branchId || branchId <= 0) {
      throw new Error("Branch id không hợp lệ");
    }

    if (patch.code !== undefined) {
      const normalizedCode = String(patch.code ?? "")
        .trim()
        .toUpperCase();
      if (!normalizedCode) {
        throw new Error("Mã chi nhánh không được để trống");
      }

      const existed = await this.branchRepo.findByCode(normalizedCode);
      if (existed && existed.props.id !== branchId) {
        throw new Error("Mã chi nhánh đã tồn tại");
      }

      patch.code = normalizedCode;
    }

    if (patch.name !== undefined) {
      const normalizedName = String(patch.name ?? "").trim();
      if (!normalizedName) {
        throw new Error("Tên chi nhánh không được để trống");
      }
      patch.name = normalizedName;
    }

    if (patch.email !== undefined) {
      patch.email = patch.email
        ? String(patch.email).trim().toLowerCase()
        : null;
    }

    const updated = await this.branchRepo.update(branchId, patch);
    return updated.props;
  }
}
