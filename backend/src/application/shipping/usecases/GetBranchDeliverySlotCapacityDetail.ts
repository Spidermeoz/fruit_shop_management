import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class GetBranchDeliverySlotCapacityDetail {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(id: number) {
    const item = await this.repo.findById(id);

    if (!item) {
      throw new Error("Branch delivery slot capacity not found");
    }

    return item;
  }
}
