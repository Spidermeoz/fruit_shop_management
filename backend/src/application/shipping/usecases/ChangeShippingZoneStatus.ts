import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

export class ChangeShippingZoneStatus {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(id: number, status: string) {
    const zoneId = Number(id);

    if (!zoneId || zoneId <= 0) {
      throw new Error("Zone id không hợp lệ");
    }

    const normalizedStatus = String(status ?? "")
      .trim()
      .toLowerCase();

    if (!["active", "inactive"].includes(normalizedStatus)) {
      throw new Error("Trạng thái vùng giao hàng không hợp lệ");
    }

    const existed = await this.shippingZoneRepo.findById(zoneId);
    if (!existed) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    return this.shippingZoneRepo.changeStatus(zoneId, normalizedStatus);
  }
}
