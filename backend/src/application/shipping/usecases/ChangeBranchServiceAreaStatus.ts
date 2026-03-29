import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

export class ChangeBranchServiceAreaStatus {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
  ) {}

  async execute(id: number, status: string) {
    const serviceAreaId = Number(id);

    if (!serviceAreaId || serviceAreaId <= 0) {
      throw new Error("Branch service area id không hợp lệ");
    }

    const normalizedStatus = String(status ?? "")
      .trim()
      .toLowerCase();

    if (!["active", "inactive"].includes(normalizedStatus)) {
      throw new Error("Trạng thái cấu hình vùng phục vụ không hợp lệ");
    }

    const existed = await this.branchServiceAreaRepo.findById(serviceAreaId);
    if (!existed) {
      throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    }

    const updated = await this.branchServiceAreaRepo.updateStatus(
      serviceAreaId,
      normalizedStatus as "active" | "inactive",
    );

    return updated.props;
  }
}
