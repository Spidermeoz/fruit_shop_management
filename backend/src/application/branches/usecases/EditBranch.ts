import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { UpdateBranchPatch } from "../../../domain/branches/types";
import { Branch } from "../../../domain/branches/Branch";

const normalizeNullableText = (
  value?: string | null,
): string | null | undefined => {
  if (value === undefined) return undefined;
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

export class EditBranch {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(id: number, patch: UpdateBranchPatch) {
    const branchId = Number(id);
    if (!branchId || branchId <= 0) {
      throw new Error("Branch id không hợp lệ");
    }

    const current = await this.branchRepo.findById(branchId);
    if (!current) {
      throw new Error("Chi nhánh không tồn tại");
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

    if (patch.phone !== undefined) {
      patch.phone = normalizeNullableText(patch.phone);
    }

    if (patch.addressLine1 !== undefined) {
      patch.addressLine1 = normalizeNullableText(patch.addressLine1);
    }

    if (patch.addressLine2 !== undefined) {
      patch.addressLine2 = normalizeNullableText(patch.addressLine2);
    }

    if (patch.ward !== undefined) {
      patch.ward = normalizeNullableText(patch.ward);
    }

    if (patch.district !== undefined) {
      patch.district = normalizeNullableText(patch.district);
    }

    if (patch.province !== undefined) {
      patch.province = normalizeNullableText(patch.province);
    }

    if (patch.openTime !== undefined) {
      patch.openTime = normalizeNullableText(patch.openTime);
    }

    if (patch.closeTime !== undefined) {
      patch.closeTime = normalizeNullableText(patch.closeTime);
    }

    if (patch.status !== undefined) {
      const normalizedStatus = String(patch.status ?? "")
        .trim()
        .toLowerCase();
      if (!["active", "inactive"].includes(normalizedStatus)) {
        throw new Error("Trạng thái chi nhánh không hợp lệ");
      }
      patch.status = normalizedStatus as any;
    }

    Branch.create({
      ...current.props,
      ...patch,
    });

    const updated = await this.branchRepo.update(branchId, patch);
    return updated.props;
  }
}
