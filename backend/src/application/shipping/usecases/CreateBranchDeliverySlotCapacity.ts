import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

interface Input {
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  status?: string;
}

export class CreateBranchDeliverySlotCapacity {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(input: Input) {
    const { branchId, deliveryDate, deliveryTimeSlotId, maxOrders, status } =
      input;

    if (!branchId) throw new Error("branchId is required");
    if (!deliveryDate) throw new Error("deliveryDate is required");
    if (!deliveryTimeSlotId) throw new Error("deliveryTimeSlotId is required");

    if (maxOrders !== undefined && maxOrders !== null) {
      if (!Number.isInteger(maxOrders) || maxOrders < 0) {
        throw new Error("maxOrders must be >= 0");
      }
    }

    const existed = await this.repo.findByUniqueKey({
      branchId,
      deliveryDate,
      deliveryTimeSlotId,
    });

    if (existed) {
      throw new Error("Capacity already exists for this branch/date/slot");
    }

    return this.repo.create({
      branchId,
      deliveryDate,
      deliveryTimeSlotId,
      maxOrders: maxOrders ?? null,
      reservedOrders: 0,
      status: (status as any) || "active",
    });
  }
}
