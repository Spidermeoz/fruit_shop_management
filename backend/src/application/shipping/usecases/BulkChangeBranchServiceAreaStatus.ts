import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

export class BulkChangeBranchServiceAreaStatus {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
  ) {}

  async execute(input: { ids: number[]; status: "active" | "inactive" }) {
    const ids = [
      ...new Set(
        (input.ids ?? [])
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    const status = String(input.status ?? "")
      .trim()
      .toLowerCase();
    if (!ids.length) throw new Error("Danh sách coverage không hợp lệ");
    if (!["active", "inactive"].includes(status))
      throw new Error("Trạng thái coverage không hợp lệ");
    return this.branchServiceAreaRepo.bulkUpdateStatus({
      ids,
      status: status as "active" | "inactive",
    });
  }
}
