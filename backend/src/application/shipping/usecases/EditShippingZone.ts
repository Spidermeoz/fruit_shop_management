import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

type UpdateShippingZonePatch = Partial<{
  code: string;
  name: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  baseFee: number | null;
  freeShipThreshold: number | null;
  priority: number | null;
  status: string | null;
}>;

const normalizeNullableText = (
  value: string | null | undefined,
): string | null | undefined => {
  if (value === undefined) return undefined;
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

export class EditShippingZone {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(id: number, patch: UpdateShippingZonePatch) {
    const zoneId = Number(id);

    if (!zoneId || zoneId <= 0) {
      throw new Error("Zone id không hợp lệ");
    }

    if (patch.code !== undefined) {
      const normalizedCode = String(patch.code ?? "")
        .trim()
        .toUpperCase();

      if (!normalizedCode) {
        throw new Error("Mã vùng giao hàng không được để trống");
      }

      const existed = await this.shippingZoneRepo.findByCode(normalizedCode);
      if (existed && existed.id !== zoneId) {
        throw new Error("Mã vùng giao hàng đã tồn tại");
      }

      patch.code = normalizedCode;
    }

    if (patch.name !== undefined) {
      const normalizedName = String(patch.name ?? "").trim();

      if (!normalizedName) {
        throw new Error("Tên vùng giao hàng không được để trống");
      }

      patch.name = normalizedName;
    }

    patch.province = normalizeNullableText(patch.province);
    patch.district = normalizeNullableText(patch.district);
    patch.ward = normalizeNullableText(patch.ward);

    const nextProvince = patch.province;
    const nextDistrict = patch.district;
    const nextWard = patch.ward;

    if (nextWard && !nextDistrict) {
      throw new Error("Nếu có phường/xã thì phải chọn quận/huyện");
    }

    if ((nextDistrict || nextWard) && !nextProvince) {
      throw new Error(
        "Nếu có quận/huyện hoặc phường/xã thì phải có tỉnh/thành phố",
      );
    }

    if (patch.baseFee !== undefined) {
      const baseFee = patch.baseFee === null ? 0 : Number(patch.baseFee);

      if (!Number.isFinite(baseFee) || baseFee < 0) {
        throw new Error("Phí giao hàng cơ bản không hợp lệ");
      }

      patch.baseFee = baseFee;
    }

    if (patch.freeShipThreshold !== undefined) {
      if (patch.freeShipThreshold === null) {
        patch.freeShipThreshold = null;
      } else {
        const freeShipThreshold = Number(patch.freeShipThreshold);

        if (!Number.isFinite(freeShipThreshold) || freeShipThreshold < 0) {
          throw new Error("Ngưỡng miễn phí vận chuyển không hợp lệ");
        }

        patch.freeShipThreshold = freeShipThreshold;
      }
    }

    if (patch.priority !== undefined) {
      const priority = Number(patch.priority);

      if (!Number.isInteger(priority)) {
        throw new Error("Độ ưu tiên phải là số nguyên");
      }

      patch.priority = priority;
    }

    if (patch.status !== undefined) {
      const status = String(patch.status ?? "")
        .trim()
        .toLowerCase();

      if (!["active", "inactive"].includes(status)) {
        throw new Error("Trạng thái vùng giao hàng không hợp lệ");
      }

      patch.status = status;
    }

    const updated = await this.shippingZoneRepo.update(zoneId, patch);
    return updated;
  }
}
