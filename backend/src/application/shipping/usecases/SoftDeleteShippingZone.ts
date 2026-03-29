import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

export class SoftDeleteShippingZone {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(id: number) {
    const zoneId = Number(id);

    if (!zoneId || zoneId <= 0) {
      throw new Error("Zone id không hợp lệ");
    }

    const existed = await this.shippingZoneRepo.findById(zoneId);
    if (!existed) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    const deleted = await this.shippingZoneRepo.softDelete(zoneId);

    return {
      success: deleted,
    };
  }
}
