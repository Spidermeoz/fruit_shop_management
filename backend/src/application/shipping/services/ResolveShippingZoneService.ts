import type {
  ShippingZoneEntity,
  ShippingZoneRepository,
} from "../../../domain/shipping/ShippingZoneRepository";

type Input = {
  province?: string | null;
  district?: string | null;
  ward?: string | null;
};

export class ResolveShippingZoneService {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(input: Input): Promise<ShippingZoneEntity> {
    const province = String(input?.province ?? "").trim();
    const district = String(input?.district ?? "").trim();
    const ward = String(input?.ward ?? "").trim();

    if (!province) {
      throw new Error("Thiếu tỉnh/thành phố để xác định khu vực giao hàng");
    }

    const zone = await this.shippingZoneRepo.findBestMatch({
      province,
      district: district || null,
      ward: ward || null,
    });

    if (!zone) {
      throw new Error("Khu vực giao hàng hiện chưa được hỗ trợ");
    }

    if (String(zone.status).toLowerCase() !== "active") {
      throw new Error("Khu vực giao hàng hiện không khả dụng");
    }

    return zone;
  }
}
