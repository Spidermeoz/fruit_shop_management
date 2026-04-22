import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { UpdateBranchPatch } from "../../../domain/branches/types";
import { Branch } from "../../../domain/branches/Branch";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

const normalizeNullableText = (
  value?: string | null,
): string | null | undefined => {
  if (value === undefined) return undefined;
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

type ActorContext = {
  id?: number | null;
  roleId?: number | null;
  branchIds?: number[];
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const pickActorBranchId = (actor?: ActorContext): number | null => {
  if (!Array.isArray(actor?.branchIds)) return null;
  const branchId = actor.branchIds
    .map(Number)
    .find((x) => Number.isFinite(x) && x > 0);
  return branchId ?? null;
};

export class EditBranch {
  constructor(
    private readonly branchRepo: BranchRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(id: number, patch: UpdateBranchPatch, actor?: ActorContext) {
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

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : null,
        actorRoleId:
          actor?.roleId !== undefined && actor?.roleId !== null
            ? Number(actor.roleId)
            : null,
        branchId: pickActorBranchId(actor),
        action: "update",
        moduleName: "branch",
        entityType: "branch",
        entityId: branchId,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        oldValuesJson: {
          id: Number(branchId),
          name: String(current.props?.name ?? ""),
          code: String(current.props?.code ?? ""),
          status: String(current.props?.status ?? ""),
          email: String(current.props?.email ?? ""),
          phone: String(current.props?.phone ?? ""),
          addressLine1: String(current.props?.addressLine1 ?? ""),
          district: String(current.props?.district ?? ""),
          province: String(current.props?.province ?? ""),
          supportsPickup: Boolean(current.props?.supportsPickup),
          supportsDelivery: Boolean(current.props?.supportsDelivery),
        },
        newValuesJson: {
          id: Number(branchId),
          name: String(updated.props?.name ?? ""),
          code: String(updated.props?.code ?? ""),
          status: String(updated.props?.status ?? ""),
          email: String(updated.props?.email ?? ""),
          phone: String(updated.props?.phone ?? ""),
          addressLine1: String(updated.props?.addressLine1 ?? ""),
          district: String(updated.props?.district ?? ""),
          province: String(updated.props?.province ?? ""),
          supportsPickup: Boolean(updated.props?.supportsPickup),
          supportsDelivery: Boolean(updated.props?.supportsDelivery),
        },
        metaJson: {
          changedFields: Object.keys(patch),
        },
      });
    }

    return updated.props;
  }
}
