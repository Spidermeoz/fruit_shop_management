import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

export class GetDeliveryTimeSlotDetail {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID khung giờ giao hàng không hợp lệ.");
    }

    const slot = await this.deliveryTimeSlotRepo.findById(id);

    if (!slot) {
      throw new Error("Không tìm thấy khung giờ giao hàng.");
    }

    return slot;
  }
}
