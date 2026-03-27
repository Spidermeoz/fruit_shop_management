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
    const code = String(p.code ?? "")
      .trim()
      .toUpperCase();

    if (!name) throw new Error("Branch.name is required");
    if (!code) throw new Error("Branch.code is required");

    return {
      ...p,
      name,
      code,
      phone: p.phone ?? null,
      email: p.email ? String(p.email).trim().toLowerCase() : null,
      addressLine1: p.addressLine1 ?? null,
      addressLine2: p.addressLine2 ?? null,
      ward: p.ward ?? null,
      district: p.district ?? null,
      province: p.province ?? null,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      openTime: p.openTime ?? null,
      closeTime: p.closeTime ?? null,
      supportsPickup: p.supportsPickup ?? true,
      supportsDelivery: p.supportsDelivery ?? true,
      status: p.status ?? "active",
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
