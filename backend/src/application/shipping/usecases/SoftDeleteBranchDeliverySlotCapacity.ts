import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class SoftDeleteBranchDeliverySlotCapacity {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(id: number) {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    await this.repo.softDelete(id);

    return {
      success: true,
      message: "Soft delete branch delivery slot capacity thành công.",
    };
  }
}
