import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";
import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

interface Input {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  status?: string;
}

const normalizeDate = (value: string) => String(value ?? "").trim();
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export class EditBranchDeliverySlotCapacity {
  constructor(
    private readonly repo: BranchDeliverySlotCapacityRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: Input) {
    const id = Number(input.id);
    const branchId = Number(input.branchId);
    const deliveryDate = normalizeDate(input.deliveryDate);
    const deliveryTimeSlotId = Number(input.deliveryTimeSlotId);
    const status = String(input.status ?? "active")
      .trim()
      .toLowerCase();

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new Error("branchId is invalid");
    }
    if (!deliveryDate || !isIsoDate(deliveryDate)) {
      throw new Error("deliveryDate is invalid");
    }
    if (!Number.isInteger(deliveryTimeSlotId) || deliveryTimeSlotId <= 0) {
      throw new Error("deliveryTimeSlotId is invalid");
    }
    if (!["active", "inactive"].includes(status)) {
      throw new Error("status is invalid");
    }

    const branch = await this.branchRepo.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const slot = await this.deliveryTimeSlotRepo.findById(deliveryTimeSlotId);
    if (!slot) {
      throw new Error("Delivery time slot not found");
    }

    let maxOrders = existing.maxOrders ?? null;
    if (input.maxOrders !== undefined) {
      if (input.maxOrders === null) {
        maxOrders = null;
      } else {
        maxOrders = Number(input.maxOrders);
        if (!Number.isInteger(maxOrders) || maxOrders < 0) {
          throw new Error("maxOrders must be >= 0");
        }
      }
    }

    if (maxOrders !== null && maxOrders < existing.reservedOrders) {
      throw new Error("maxOrders cannot be lower than reservedOrders");
    }

    if (
      existing.branchId !== branchId ||
      existing.deliveryDate !== deliveryDate ||
      existing.deliveryTimeSlotId !== deliveryTimeSlotId
    ) {
      const duplicated = await this.repo.findByUniqueKey({
        branchId,
        deliveryDate,
        deliveryTimeSlotId,
      });

      if (duplicated && duplicated.id !== id) {
        throw new Error("Duplicate capacity record");
      }
    }

    return this.repo.update(id, {
      branchId,
      deliveryDate,
      deliveryTimeSlotId,
      maxOrders,
      status: status as "active" | "inactive",
    });
  }
}
