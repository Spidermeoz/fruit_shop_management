import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";

export class SoftDeleteBranchDeliveryTimeSlot {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
  ) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID branch delivery time slot không hợp lệ.");
    }

    const current = await this.branchDeliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    await this.branchDeliveryTimeSlotRepo.softDelete(id);

    return {
      success: true,
      message:
        "Xóa mềm cấu hình khung giờ giao hàng theo chi nhánh thành công.",
    };
  }
}
