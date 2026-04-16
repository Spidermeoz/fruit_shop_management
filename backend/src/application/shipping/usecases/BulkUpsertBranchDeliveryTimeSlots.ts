import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type {
  BranchDeliveryTimeSlotRepository,
  BulkUpsertBranchDeliveryTimeSlotItem,
} from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";
import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

export class BulkUpsertBranchDeliveryTimeSlots {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
    private readonly branchRepo: BranchRepository,
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: {
    items: BulkUpsertBranchDeliveryTimeSlotItem[];
    mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
  }) {
    const items = input.items ?? [];
    if (!items.length)
      throw new Error("Danh sách branch slot cần lưu không hợp lệ");
    for (const item of items) {
      const branchId = Number(item.branchId);
      const deliveryTimeSlotId = Number(item.deliveryTimeSlotId);
      if (!Number.isInteger(branchId) || branchId <= 0)
        throw new Error("Chi nhánh không hợp lệ");
      if (!Number.isInteger(deliveryTimeSlotId) || deliveryTimeSlotId <= 0)
        throw new Error("Khung giờ không hợp lệ");
      const branch = await this.branchRepo.findById(branchId);
      if (!branch) throw new Error(`Không tìm thấy chi nhánh #${branchId}`);
      const slot = await this.deliveryTimeSlotRepo.findById(deliveryTimeSlotId);
      if (!slot)
        throw new Error(`Không tìm thấy khung giờ #${deliveryTimeSlotId}`);
    }
    return this.branchDeliveryTimeSlotRepo.bulkUpsert(items, input.mode);
  }
}
