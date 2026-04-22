import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";
import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

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

interface Input {
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  status?: string;
}

const normalizeDate = (value: string) => String(value ?? "").trim();

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export class CreateBranchDeliverySlotCapacity {
  constructor(
    private readonly repo: BranchDeliverySlotCapacityRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
    private readonly createAuditLog?: CreateAuditLog,
  ) {}

  async execute(input: Input, actor?: ActorContext) {
    const branchId = Number(input.branchId);
    const deliveryDate = normalizeDate(input.deliveryDate);
    const deliveryTimeSlotId = Number(input.deliveryTimeSlotId);
    const status = String(input.status ?? "active")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new Error("branchId is required");
    }
    if (!deliveryDate || !isIsoDate(deliveryDate)) {
      throw new Error("deliveryDate is required");
    }
    if (!Number.isInteger(deliveryTimeSlotId) || deliveryTimeSlotId <= 0) {
      throw new Error("deliveryTimeSlotId is required");
    }
    if (!["active", "inactive"].includes(status)) {
      throw new Error("status is invalid");
    }

    let maxOrders: number | null = null;
    if (input.maxOrders !== undefined && input.maxOrders !== null) {
      maxOrders = Number(input.maxOrders);
      if (!Number.isInteger(maxOrders) || maxOrders < 0) {
        throw new Error("maxOrders must be >= 0");
      }
    }

    const branch = await this.branchRepo.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const slot = await this.deliveryTimeSlotRepo.findById(deliveryTimeSlotId);
    if (!slot) {
      throw new Error("Delivery time slot not found");
    }

    const existed = await this.repo.findByUniqueKey({
      branchId,
      deliveryDate,
      deliveryTimeSlotId,
    });

    if (existed) {
      throw new Error("Capacity already exists for this branch/date/slot");
    }

    const deletedCandidate = await this.repo.findDeletedByUniqueKey({
      branchId,
      deliveryDate,
      deliveryTimeSlotId,
    });

    let created;

    if (deletedCandidate) {
      created = await this.repo.revive(deletedCandidate.id, {
        branchId,
        deliveryDate,
        deliveryTimeSlotId,
        maxOrders,
        reservedOrders: deletedCandidate.reservedOrders ?? 0,
        status: status as "active" | "inactive",
      });
    } else {
      created = await this.repo.create({
        branchId,
        deliveryDate,
        deliveryTimeSlotId,
        maxOrders,
        reservedOrders: 0,
        status: status as "active" | "inactive",
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
        moduleName: "branch_delivery_slot_capacity",
        entityType: "branch_delivery_slot_capacity",
        entityId: Number(created?.id ?? 0) || null,
        requestId: actor?.requestId ?? null,
        ipAddress: actor?.ipAddress ?? null,
        userAgent: actor?.userAgent ?? null,
        newValuesJson: toSnapshot(created) as any,
        metaJson: { branchId, deliveryDate, deliveryTimeSlotId } as any,
      });
    }
    return created;
  }
}
