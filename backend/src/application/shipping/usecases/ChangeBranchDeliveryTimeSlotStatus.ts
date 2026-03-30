import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";

type ChangeBranchDeliveryTimeSlotStatusInput = {
  id: number;
  status: string;
};

export class ChangeBranchDeliveryTimeSlotStatus {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
  ) {}

  async execute(input: ChangeBranchDeliveryTimeSlotStatusInput) {
    const id = Number(input.id);
    const status = String(input.status ?? "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID branch delivery time slot không hợp lệ.");
    }

    if (!status) {
      throw new Error("Trạng thái là bắt buộc.");
    }

    const current = await this.branchDeliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    return this.branchDeliveryTimeSlotRepo.changeStatus(id, status);
  }
}
