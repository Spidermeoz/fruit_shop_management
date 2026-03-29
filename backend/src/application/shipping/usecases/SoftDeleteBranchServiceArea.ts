import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

export class SoftDeleteBranchServiceArea {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
  ) {}

  async execute(id: number) {
    const serviceAreaId = Number(id);

    if (!serviceAreaId || serviceAreaId <= 0) {
      throw new Error("Branch service area id không hợp lệ");
    }

    const existed = await this.branchServiceAreaRepo.findById(serviceAreaId);
    if (!existed) {
      throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    }

    const deleted = await this.branchServiceAreaRepo.softDelete(serviceAreaId);

    return {
      id: deleted.id,
      deletedAt: deleted.deletedAt,
    };
  }
}
