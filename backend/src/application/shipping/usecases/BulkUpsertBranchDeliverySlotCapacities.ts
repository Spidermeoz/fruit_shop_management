import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type {
  BranchDeliverySlotCapacityRepository,
  BulkUpsertBranchDeliverySlotCapacityItem,
} from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";
import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

export class BulkUpsertBranchDeliverySlotCapacities {
  constructor(
    private readonly capacityRepo: BranchDeliverySlotCapacityRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: {
    items: BulkUpsertBranchDeliverySlotCapacityItem[];
    mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
  }) {
    const items = input.items ?? [];
    if (!items.length)
      throw new Error("Danh sách capacity cần lưu không hợp lệ");
    for (const item of items) {
      const branchId = Number(item.branchId);
      const slotId = Number(item.deliveryTimeSlotId);
      if (!Number.isInteger(branchId) || branchId <= 0)
        throw new Error("Chi nhánh không hợp lệ");
      if (!item.deliveryDate) throw new Error("Ngày giao không hợp lệ");
      if (!Number.isInteger(slotId) || slotId <= 0)
        throw new Error("Khung giờ không hợp lệ");
      if (
        item.maxOrders !== undefined &&
        item.maxOrders !== null &&
        (!Number.isInteger(Number(item.maxOrders)) ||
          Number(item.maxOrders) < 0)
      ) {
        throw new Error("maxOrders phải là số nguyên >= 0");
      }
      const branch = await this.branchRepo.findById(branchId);
      if (!branch) throw new Error(`Không tìm thấy chi nhánh #${branchId}`);
      const slot = await this.deliveryTimeSlotRepo.findById(slotId);
      if (!slot) throw new Error(`Không tìm thấy khung giờ #${slotId}`);
    }
    return this.capacityRepo.bulkUpsert(items, input.mode);
  }
}
