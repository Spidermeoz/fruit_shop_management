import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class GetBranchDeliverySlotCapacityDetail {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(id: number) {
    const capacityId = Number(id);
    if (!Number.isInteger(capacityId) || capacityId <= 0) {
      throw new Error("Branch delivery slot capacity id không hợp lệ");
    }

    const existing = await this.repo.findById(capacityId);
    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    return existing;
  }
}
