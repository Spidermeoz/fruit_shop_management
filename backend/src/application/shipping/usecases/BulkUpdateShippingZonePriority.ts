import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

export class BulkUpdateShippingZonePriority {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(input: { items: Array<{ id: number; priority: number }> }) {
    const items = (input.items ?? []).map((item) => ({
      id: Number(item.id),
      priority: Number(item.priority),
    }));
    if (!items.length)
      throw new Error("Danh sách cập nhật priority không hợp lệ");
    for (const item of items) {
      if (!Number.isInteger(item.id) || item.id <= 0)
        throw new Error("ID vùng giao hàng không hợp lệ");
      if (!Number.isInteger(item.priority) || item.priority < 0)
        throw new Error("Priority phải là số nguyên >= 0");
    }
    return this.shippingZoneRepo.bulkUpdatePriority(items);
  }
}
