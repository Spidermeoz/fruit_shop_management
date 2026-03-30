import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class ChangeBranchDeliverySlotCapacityStatus {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(id: number, status: "active" | "inactive") {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    await this.repo.changeStatus(id, status);
  }
}
