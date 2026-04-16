import type {
  ShippingZoneRepository,
  UpdateShippingZonePatch,
} from "../../../domain/shipping/ShippingZoneRepository";

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

    const current = await this.shippingZoneRepo.findById(zoneId);
    if (!current) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    const normalizedPatch: UpdateShippingZonePatch = { ...patch };

    if (normalizedPatch.code !== undefined) {
      const normalizedCode = String(normalizedPatch.code ?? "")
        .trim()
        .toUpperCase();

      if (!normalizedCode) {
        throw new Error("Mã vùng giao hàng không được để trống");
      }

      const existed = await this.shippingZoneRepo.findByCode(normalizedCode);
      if (existed && existed.id !== zoneId) {
        throw new Error("Mã vùng giao hàng đã tồn tại");
      }

      normalizedPatch.code = normalizedCode;
    }

    if (normalizedPatch.name !== undefined) {
      const normalizedName = String(normalizedPatch.name ?? "").trim();

      if (!normalizedName) {
        throw new Error("Tên vùng giao hàng không được để trống");
      }

      normalizedPatch.name = normalizedName;
    }

    normalizedPatch.province = normalizeNullableText(normalizedPatch.province);
    normalizedPatch.district = normalizeNullableText(normalizedPatch.district);
    normalizedPatch.ward = normalizeNullableText(normalizedPatch.ward);

    const nextProvince =
      normalizedPatch.province !== undefined
        ? normalizedPatch.province
        : current.province;
    const nextDistrict =
      normalizedPatch.district !== undefined
        ? normalizedPatch.district
        : current.district;
    const nextWard =
      normalizedPatch.ward !== undefined ? normalizedPatch.ward : current.ward;

    if (nextWard && !nextDistrict) {
      throw new Error("Nếu có phường/xã thì phải chọn quận/huyện");
    }

    if ((nextDistrict || nextWard) && !nextProvince) {
      throw new Error(
        "Nếu có quận/huyện hoặc phường/xã thì phải có tỉnh/thành phố",
      );
    }

    if (normalizedPatch.baseFee !== undefined) {
      const baseFee =
        normalizedPatch.baseFee === null ? 0 : Number(normalizedPatch.baseFee);

      if (!Number.isFinite(baseFee) || baseFee < 0) {
        throw new Error("Phí giao hàng cơ bản không hợp lệ");
      }

      normalizedPatch.baseFee = baseFee;
    }

    if (normalizedPatch.freeShipThreshold !== undefined) {
      if (normalizedPatch.freeShipThreshold === null) {
        normalizedPatch.freeShipThreshold = null;
      } else {
        const freeShipThreshold = Number(normalizedPatch.freeShipThreshold);

        if (!Number.isFinite(freeShipThreshold) || freeShipThreshold < 0) {
          throw new Error("Ngưỡng miễn phí vận chuyển không hợp lệ");
        }

        normalizedPatch.freeShipThreshold = freeShipThreshold;
      }
    }

    if (normalizedPatch.priority !== undefined) {
      const priority = Number(normalizedPatch.priority);

      if (!Number.isInteger(priority) || priority < 0) {
        throw new Error("Độ ưu tiên phải là số nguyên >= 0");
      }

      normalizedPatch.priority = priority;
    }

    if (normalizedPatch.status !== undefined) {
      const status = String(normalizedPatch.status ?? "")
        .trim()
        .toLowerCase();

      if (!["active", "inactive"].includes(status)) {
        throw new Error("Trạng thái vùng giao hàng không hợp lệ");
      }

      normalizedPatch.status = status;
    }

    return this.shippingZoneRepo.update(zoneId, normalizedPatch);
  }
}
