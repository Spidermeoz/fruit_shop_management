import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

export class GetShippingZoneDetail {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(id: number) {
    const zoneId = Number(id);

    if (!zoneId || zoneId <= 0) {
      throw new Error("Zone id không hợp lệ");
    }

    return this.shippingZoneRepo.findById(zoneId);
  }
}
