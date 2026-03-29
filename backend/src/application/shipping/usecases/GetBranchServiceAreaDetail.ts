import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

export class GetBranchServiceAreaDetail {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
  ) {}

  async execute(id: number) {
    const serviceAreaId = Number(id);

    if (!serviceAreaId || serviceAreaId <= 0) {
      throw new Error("Branch service area id không hợp lệ");
    }

    const serviceArea = await this.branchServiceAreaRepo.findById(
      serviceAreaId,
      true,
    );

    if (!serviceArea) {
      throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    }

    return serviceArea.props;
  }
}
