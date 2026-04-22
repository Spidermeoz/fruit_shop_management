import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

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

const toSnapshot = (value: any) => value?.props ?? value ?? null;

type CreateShippingZoneInput = {
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee?: number | null;
  freeShipThreshold?: number | null;
  priority?: number | null;
  status?: string | null;
};

const normalizeNullableText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

export class CreateShippingZone {
  constructor(
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: CreateShippingZoneInput, actor?: ActorContext) {
    const name = String(input?.name ?? "").trim();
    const rawCode = String(input?.code ?? "").trim();

    if (!name) {
      throw new Error("Tên vùng giao hàng là bắt buộc");
    }

    if (!rawCode) {
      throw new Error("Mã vùng giao hàng là bắt buộc");
    }

    const code = rawCode.toUpperCase();

    const province = normalizeNullableText(input.province);
    const district = normalizeNullableText(input.district);
    const ward = normalizeNullableText(input.ward);

    if (ward && !district) {
      throw new Error("Nếu có phường/xã thì phải chọn quận/huyện");
    }

    if ((district || ward) && !province) {
      throw new Error(
        "Nếu có quận/huyện hoặc phường/xã thì phải có tỉnh/thành phố",
      );
    }

    const baseFee = Number(input.baseFee ?? 0);
    if (!Number.isFinite(baseFee) || baseFee < 0) {
      throw new Error("Phí giao hàng cơ bản không hợp lệ");
    }

    let freeShipThreshold: number | null = null;
    if (
      input.freeShipThreshold !== undefined &&
      input.freeShipThreshold !== null
    ) {
      freeShipThreshold = Number(input.freeShipThreshold);
      if (!Number.isFinite(freeShipThreshold) || freeShipThreshold < 0) {
        throw new Error("Ngưỡng miễn phí vận chuyển không hợp lệ");
      }
    }

    const priority = Number(input.priority ?? 0);
    if (!Number.isInteger(priority) || priority < 0) {
      throw new Error("Độ ưu tiên phải là số nguyên >= 0");
    }

    const status = String(input.status ?? "active")
      .trim()
      .toLowerCase();
    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái vùng giao hàng không hợp lệ");
    }

    const existed = await this.shippingZoneRepo.findByCode(code);
    if (existed) {
      throw new Error("Mã vùng giao hàng đã tồn tại");
    }

    const deletedCandidate =
      await this.shippingZoneRepo.findDeletedByCode(code);

    let created;

    if (deletedCandidate) {
      created = await this.shippingZoneRepo.revive(deletedCandidate.id, {
        code,
        name,
        province,
        district,
        ward,
        baseFee,
        freeShipThreshold,
        priority,
        status,
      });
    } else {
      created = await this.shippingZoneRepo.create({
        code,
        name,
        province,
        district,
        ward,
        baseFee,
        freeShipThreshold,
        priority,
        status,
      });
    }

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
        moduleName: "shipping_zone",
        entityType: "shipping_zone",
        entityId: Number(created?.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: toSnapshot(created) as any,
        metaJson: { code, name } as any,
      });
    }

    return created;
  }
}
