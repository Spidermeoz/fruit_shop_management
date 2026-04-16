import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

export class BulkChangeShippingZoneStatus {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(input: { ids: number[]; status: string }) {
    const ids = [
      ...new Set(
        (input.ids ?? [])
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    const status = String(input.status ?? "")
      .trim()
      .toLowerCase();
    if (!ids.length) throw new Error("Danh sách vùng giao hàng không hợp lệ");
    if (!["active", "inactive"].includes(status))
      throw new Error("Trạng thái vùng giao hàng không hợp lệ");
    return this.shippingZoneRepo.bulkChangeStatus(ids, status);
  }
}
