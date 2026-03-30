import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

interface Input {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  status?: string;
}

export class EditBranchDeliverySlotCapacity {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(input: Input) {
    const { id } = input;

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    if (
      input.maxOrders !== undefined &&
      input.maxOrders !== null &&
      (!Number.isInteger(input.maxOrders) || input.maxOrders < 0)
    ) {
      throw new Error("maxOrders must be >= 0");
    }

    // check unique nếu đổi key
    if (
      existing.branchId !== input.branchId ||
      existing.deliveryDate !== input.deliveryDate ||
      existing.deliveryTimeSlotId !== input.deliveryTimeSlotId
    ) {
      const duplicated = await this.repo.findByUniqueKey({
        branchId: input.branchId,
        deliveryDate: input.deliveryDate,
        deliveryTimeSlotId: input.deliveryTimeSlotId,
      });

      if (duplicated && duplicated.id !== id) {
        throw new Error("Duplicate capacity record");
      }
    }

    return this.repo.update(id, {
      branchId: input.branchId,
      deliveryDate: input.deliveryDate,
      deliveryTimeSlotId: input.deliveryTimeSlotId,
      maxOrders:
        input.maxOrders === undefined ? existing.maxOrders : input.maxOrders,
      status: (input.status as any) || existing.status,
    });
  }
}
