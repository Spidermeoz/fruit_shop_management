import { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class ChangeBranchDeliverySlotCapacityStatus {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(id: number, status: string) {
    const capacityId = Number(id);
    const normalizedStatus = String(status ?? "")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(capacityId) || capacityId <= 0) {
      throw new Error("Branch delivery slot capacity id không hợp lệ");
    }

    if (!["active", "inactive"].includes(normalizedStatus)) {
      throw new Error("Status không hợp lệ");
    }

    const existing = await this.repo.findById(capacityId);
    if (!existing) {
      throw new Error("Branch delivery slot capacity not found");
    }

    await this.repo.changeStatus(
      capacityId,
      normalizedStatus as "active" | "inactive",
    );

    return {
      success: true,
      id: capacityId,
      status: normalizedStatus,
    };
  }
}
