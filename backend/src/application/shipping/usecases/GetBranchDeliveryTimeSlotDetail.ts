import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";

export class GetBranchDeliveryTimeSlotDetail {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
  ) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID branch delivery time slot không hợp lệ.");
    }

    const item = await this.branchDeliveryTimeSlotRepo.findById(id);

    if (!item) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    return item;
  }
}
