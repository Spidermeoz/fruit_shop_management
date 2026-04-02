import type {
  ShippingZoneEntity,
  ShippingZoneRepository,
} from "../../../domain/shipping/ShippingZoneRepository";

type Input = {
  province?: string | null;
  district?: string | null;
  ward?: string | null;
};

const normalizeNullableText = (value?: string | null): string | null => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized ? normalized : null;
};

export class ResolveShippingZoneService {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(input: Input): Promise<ShippingZoneEntity> {
    const province = normalizeNullableText(input?.province);
    const district = normalizeNullableText(input?.district);
    const ward = normalizeNullableText(input?.ward);

    if (!province) {
      throw new Error("Thiếu tỉnh/thành phố để xác định khu vực giao hàng");
    }

    if (ward && !district) {
      throw new Error("Nếu có phường/xã thì phải có quận/huyện");
    }

    const zone = await this.shippingZoneRepo.findBestMatch({
      province,
      district,
      ward,
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
