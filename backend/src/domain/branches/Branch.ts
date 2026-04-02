// src/domain/branches/Branch.ts
export type BranchStatus = "active" | "inactive";

export interface BranchProps {
  id?: number;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  status?: BranchStatus;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const normalizeNullableText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const normalizeCode = (value?: string | null): string => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

const normalizeEmail = (value?: string | null): string | null => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized || null;
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export class Branch {
  private _props: BranchProps;

  private constructor(props: BranchProps) {
    this._props = Branch.validate(props);
  }

  static create(props: BranchProps) {
    return new Branch(props);
  }

  get props(): Readonly<BranchProps> {
    return this._props;
  }

  static validate(p: BranchProps): BranchProps {
    const name = String(p.name ?? "").trim();
    const code = normalizeCode(p.code);
    const phone = normalizeNullableText(p.phone);
    const email = normalizeEmail(p.email);
    const addressLine1 = normalizeNullableText(p.addressLine1);
    const addressLine2 = normalizeNullableText(p.addressLine2);
    const ward = normalizeNullableText(p.ward);
    const district = normalizeNullableText(p.district);
    const province = normalizeNullableText(p.province);
    const openTime = normalizeNullableText(p.openTime);
    const closeTime = normalizeNullableText(p.closeTime);

    const supportsPickup = p.supportsPickup ?? true;
    const supportsDelivery = p.supportsDelivery ?? true;

    const status = String(p.status ?? "active")
      .trim()
      .toLowerCase() as BranchStatus;

    if (!name) throw new Error("Tên chi nhánh là bắt buộc");
    if (!code) throw new Error("Mã chi nhánh là bắt buộc");

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái chi nhánh không hợp lệ");
    }

    if (email && !isValidEmail(email)) {
      throw new Error("Email chi nhánh không hợp lệ");
    }

    if (
      p.latitude !== undefined &&
      p.latitude !== null &&
      !Number.isFinite(Number(p.latitude))
    ) {
      throw new Error("Vĩ độ không hợp lệ");
    }

    if (
      p.longitude !== undefined &&
      p.longitude !== null &&
      !Number.isFinite(Number(p.longitude))
    ) {
      throw new Error("Kinh độ không hợp lệ");
    }

    if (supportsDelivery) {
      if (!addressLine1) {
        throw new Error("Chi nhánh giao hàng phải có địa chỉ");
      }
      if (!district) {
        throw new Error("Chi nhánh giao hàng phải có quận/huyện");
      }
      if (!province) {
        throw new Error("Chi nhánh giao hàng phải có tỉnh/thành phố");
      }
    }

    return {
      ...p,
      name,
      code,
      phone,
      email,
      addressLine1,
      addressLine2,
      ward,
      district,
      province,
      latitude:
        p.latitude !== undefined && p.latitude !== null
          ? Number(p.latitude)
          : null,
      longitude:
        p.longitude !== undefined && p.longitude !== null
          ? Number(p.longitude)
          : null,
      openTime,
      closeTime,
      supportsPickup,
      supportsDelivery,
      status,
      deleted: p.deleted ?? false,
      deletedAt: p.deletedAt ?? null,
    };
  }

  rename(name: string) {
    this._props = Branch.validate({ ...this._props, name });
  }

  changeStatus(status: BranchStatus) {
    this._props = Branch.validate({ ...this._props, status });
  }
}
