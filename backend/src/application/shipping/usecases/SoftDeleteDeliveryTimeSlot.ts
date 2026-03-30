import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

export class SoftDeleteDeliveryTimeSlot {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID khung giờ giao hàng không hợp lệ.");
    }

    const current = await this.deliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error("Không tìm thấy khung giờ giao hàng.");
    }

    await this.deliveryTimeSlotRepo.softDelete(id);

    return {
      success: true,
      message: "Xóa mềm khung giờ giao hàng thành công.",
    };
  }
}
