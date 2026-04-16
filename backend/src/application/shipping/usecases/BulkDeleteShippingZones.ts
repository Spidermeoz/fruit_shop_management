import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

export class BulkDeleteShippingZones {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(input: { ids: number[] }) {
    const ids = [
      ...new Set(
        (input.ids ?? [])
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    if (!ids.length) throw new Error("Danh sách vùng giao hàng không hợp lệ");
    return this.shippingZoneRepo.bulkDelete(ids);
  }
}
