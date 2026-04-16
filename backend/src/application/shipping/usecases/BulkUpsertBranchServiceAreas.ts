import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";
import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";
import type { BulkUpsertBranchServiceAreaItem } from "../../../domain/shipping/branchServiceArea.types";

export class BulkUpsertBranchServiceAreas {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly branchRepo: BranchRepository,
    private readonly shippingZoneRepo: ShippingZoneRepository,
  ) {}

  async execute(input: {
    items: BulkUpsertBranchServiceAreaItem[];
    mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
  }) {
    const items = input.items ?? [];
    if (!items.length)
      throw new Error("Danh sách coverage cần lưu không hợp lệ");
    for (const item of items) {
      const branchId = Number(item.branchId);
      const shippingZoneId = Number(item.shippingZoneId);
      if (!Number.isInteger(branchId) || branchId <= 0)
        throw new Error("Chi nhánh không hợp lệ");
      if (!Number.isInteger(shippingZoneId) || shippingZoneId <= 0)
        throw new Error("Vùng giao hàng không hợp lệ");
      const branch = await this.branchRepo.findById(branchId);
      if (!branch) throw new Error(`Không tìm thấy chi nhánh #${branchId}`);
      const zone = await this.shippingZoneRepo.findById(shippingZoneId);
      if (!zone)
        throw new Error(`Không tìm thấy vùng giao hàng #${shippingZoneId}`);
    }
    return this.branchServiceAreaRepo.bulkUpsert(items, input.mode);
  }
}
