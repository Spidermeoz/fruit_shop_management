import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { CreateBranchInput } from "../../../domain/branches/types";

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

    const created = await this.branchRepo.create({
      ...input,
      name,
      code,
      email: input.email ? String(input.email).trim().toLowerCase() : null,
    });

    return created.props;
  }
}
