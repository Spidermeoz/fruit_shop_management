import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

type CreateShippingZoneInput = {
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee?: number | null;
  freeShipThreshold?: number | null;
  priority?: number | null;
  status?: string | null;
};

const normalizeNullableText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

export class CreateShippingZone {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(input: CreateShippingZoneInput) {
    const name = String(input?.name ?? "").trim();
    const rawCode = String(input?.code ?? "").trim();

    if (!name) {
      throw new Error("Tên vùng giao hàng là bắt buộc");
    }

    if (!rawCode) {
      throw new Error("Mã vùng giao hàng là bắt buộc");
    }

    const code = rawCode.toUpperCase();

    const province = normalizeNullableText(input.province);
    const district = normalizeNullableText(input.district);
    const ward = normalizeNullableText(input.ward);

    if (ward && !district) {
      throw new Error("Nếu có phường/xã thì phải chọn quận/huyện");
    }

    if ((district || ward) && !province) {
      throw new Error(
        "Nếu có quận/huyện hoặc phường/xã thì phải có tỉnh/thành phố",
      );
    }

    const baseFee = Number(input.baseFee ?? 0);
    if (!Number.isFinite(baseFee) || baseFee < 0) {
      throw new Error("Phí giao hàng cơ bản không hợp lệ");
    }

    let freeShipThreshold: number | null = null;
    if (
      input.freeShipThreshold !== undefined &&
      input.freeShipThreshold !== null
    ) {
      freeShipThreshold = Number(input.freeShipThreshold);
      if (!Number.isFinite(freeShipThreshold) || freeShipThreshold < 0) {
        throw new Error("Ngưỡng miễn phí vận chuyển không hợp lệ");
      }
    }

    const priority = Number(input.priority ?? 0);
    if (!Number.isInteger(priority) || priority < 0) {
      throw new Error("Độ ưu tiên phải là số nguyên >= 0");
    }

    const status = String(input.status ?? "active")
      .trim()
      .toLowerCase();
    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái vùng giao hàng không hợp lệ");
    }

    const existed = await this.shippingZoneRepo.findByCode(code);
    if (existed) {
      throw new Error("Mã vùng giao hàng đã tồn tại");
    }

    const created = await this.shippingZoneRepo.create({
      code,
      name,
      province,
      district,
      ward,
      baseFee,
      freeShipThreshold,
      priority,
      status,
    });

    return created;
  }
}
