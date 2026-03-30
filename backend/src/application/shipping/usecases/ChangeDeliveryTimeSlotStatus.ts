import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

type ChangeDeliveryTimeSlotStatusInput = {
  id: number;
  status: string;
};

export class ChangeDeliveryTimeSlotStatus {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: ChangeDeliveryTimeSlotStatusInput) {
    const id = Number(input.id);
    const status = String(input.status ?? "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID khung giờ giao hàng không hợp lệ.");
    }

    if (!status) {
      throw new Error("Trạng thái là bắt buộc.");
    }

    const current = await this.deliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error("Không tìm thấy khung giờ giao hàng.");
    }

    return this.deliveryTimeSlotRepo.changeStatus(id, status);
  }
}
