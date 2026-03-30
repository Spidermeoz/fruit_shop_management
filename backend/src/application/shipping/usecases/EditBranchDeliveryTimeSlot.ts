import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";
import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

type EditBranchDeliveryTimeSlotInput = {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status?: string;
};

export class EditBranchDeliveryTimeSlot {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: EditBranchDeliveryTimeSlotInput) {
    const id = Number(input.id);
    const branchId = Number(input.branchId);
    const deliveryTimeSlotId = Number(input.deliveryTimeSlotId);
    const status = String(input.status ?? "active").trim() || "active";

    let maxOrdersOverride: number | null = null;
    if (
      input.maxOrdersOverride !== undefined &&
      input.maxOrdersOverride !== null
    ) {
      maxOrdersOverride = Number(input.maxOrdersOverride);
    }

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID branch delivery time slot không hợp lệ.");
    }

    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new Error("Chi nhánh không hợp lệ.");
    }

    if (!Number.isInteger(deliveryTimeSlotId) || deliveryTimeSlotId <= 0) {
      throw new Error("Khung giờ giao hàng không hợp lệ.");
    }

    if (
      maxOrdersOverride !== null &&
      (!Number.isInteger(maxOrdersOverride) || maxOrdersOverride < 0)
    ) {
      throw new Error("Max orders override phải là số nguyên >= 0.");
    }

    const current = await this.branchDeliveryTimeSlotRepo.findById(id);
    if (!current) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    const branch = await this.branchRepo.findById(branchId);
    if (!branch) {
      throw new Error("Không tìm thấy chi nhánh.");
    }

    const deliveryTimeSlot =
      await this.deliveryTimeSlotRepo.findById(deliveryTimeSlotId);
    if (!deliveryTimeSlot) {
      throw new Error("Không tìm thấy khung giờ giao hàng.");
    }

    const existing = await this.branchDeliveryTimeSlotRepo.findByBranchAndSlot(
      branchId,
      deliveryTimeSlotId,
    );

    if (existing && existing.id !== id) {
      throw new Error("Khung giờ này đã được gán cho chi nhánh.");
    }

    return this.branchDeliveryTimeSlotRepo.update(id, {
      branchId,
      deliveryTimeSlotId,
      maxOrdersOverride,
      status,
    });
  }
}
