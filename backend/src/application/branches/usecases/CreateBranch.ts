import { Branch } from "../../../domain/branches/Branch";
import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { CreateBranchInput } from "../../../domain/branches/types";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

const normalizeNullableText = (value?: string | null): string | null => {
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

export class CreateBranch {
  constructor(
    private readonly branchRepo: BranchRepository,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateBranchInput, actor?: ActorContext) {
    const name = String(input?.name ?? "").trim();
    const rawCode = String(input?.code ?? "").trim();

    if (!name) {
      throw new Error("Tên chi nhánh là bắt buộc");
    }

    if (!rawCode) {
      throw new Error("Mã chi nhánh là bắt buộc");
    }

    const code = rawCode.toUpperCase();

    const existed = await this.branchRepo.findByCode(code);
    if (existed) {
      throw new Error("Mã chi nhánh đã tồn tại");
    }

    const normalizedInput: CreateBranchInput = {
      ...input,
      name,
      code,
      phone: normalizeNullableText(input.phone),
      email: normalizeNullableText(input.email)?.toLowerCase() ?? null,
      addressLine1: normalizeNullableText(input.addressLine1),
      addressLine2: normalizeNullableText(input.addressLine2),
      ward: normalizeNullableText(input.ward),
      district: normalizeNullableText(input.district),
      province: normalizeNullableText(input.province),
      openTime: normalizeNullableText(input.openTime),
      closeTime: normalizeNullableText(input.closeTime),
      supportsPickup: input.supportsPickup ?? true,
      supportsDelivery: input.supportsDelivery ?? true,
      latitude:
        input.latitude !== undefined && input.latitude !== null
          ? Number(input.latitude)
          : null,
      longitude:
        input.longitude !== undefined && input.longitude !== null
          ? Number(input.longitude)
          : null,
      status: input.status ?? "active",
    };

    Branch.create(normalizedInput);

    const created = await this.branchRepo.create(normalizedInput);

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
        action: "create",
        moduleName: "branch",
        entityType: "branch",
        entityId: Number(created.props.id),
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: {
          id: Number(created.props.id),
          name: String(created.props.name ?? ""),
          code: String(created.props.code ?? ""),
          status: String(created.props.status ?? ""),
          email: String(created.props.email ?? ""),
          phone: String(created.props.phone ?? ""),
          supportsPickup: Boolean(created.props.supportsPickup),
          supportsDelivery: Boolean(created.props.supportsDelivery),
        },
        metaJson: {
          province: String(created.props.province ?? ""),
          district: String(created.props.district ?? ""),
        },
      });
    }

    return created.props;
  }
}
