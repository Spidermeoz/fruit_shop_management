import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";

export class BulkChangeBranchDeliveryTimeSlotStatus {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
  ) {}

  async execute(input: { ids: number[]; status: string }) {
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
    if (!ids.length) throw new Error("Danh sách branch slot không hợp lệ");
    if (!["active", "inactive"].includes(status))
      throw new Error("Trạng thái branch slot không hợp lệ");
    return this.branchDeliveryTimeSlotRepo.bulkChangeStatus(ids, status);
  }
}
