import { Branch } from "../../../domain/branches/Branch";
import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { CreateBranchInput } from "../../../domain/branches/types";

const normalizeNullableText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

export class CreateBranch {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(input: CreateBranchInput) {
    const name = String(input?.name ?? "").trim();
    const rawCode = String(input?.code ?? "").trim();

    if (!name) {
      throw new Error("Tên chi nhánh là bắt buộc");
    }

    if (!rawCode) {
      throw new Error("Mã chi nhánh là bắt buộc");
    }

    const code = rawCode.toUpperCase();

    const existed = await this.branchRepo.findByCode(code);
    if (existed) {
      throw new Error("Mã chi nhánh đã tồn tại");
    }

    const normalizedInput: CreateBranchInput = {
      ...input,
      name,
      code,
      phone: normalizeNullableText(input.phone),
      email: normalizeNullableText(input.email)?.toLowerCase() ?? null,
      addressLine1: normalizeNullableText(input.addressLine1),
      addressLine2: normalizeNullableText(input.addressLine2),
      ward: normalizeNullableText(input.ward),
      district: normalizeNullableText(input.district),
      province: normalizeNullableText(input.province),
      openTime: normalizeNullableText(input.openTime),
      closeTime: normalizeNullableText(input.closeTime),
      supportsPickup: input.supportsPickup ?? true,
      supportsDelivery: input.supportsDelivery ?? true,
      latitude:
        input.latitude !== undefined && input.latitude !== null
          ? Number(input.latitude)
          : null,
      longitude:
        input.longitude !== undefined && input.longitude !== null
          ? Number(input.longitude)
          : null,
      status: input.status ?? "active",
    };

    Branch.create(normalizedInput);

    const created = await this.branchRepo.create(normalizedInput);

    return created.props;
  }
}
