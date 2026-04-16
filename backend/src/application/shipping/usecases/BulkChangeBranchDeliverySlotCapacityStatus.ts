import type { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class BulkChangeBranchDeliverySlotCapacityStatus {
  constructor(
    private readonly capacityRepo: BranchDeliverySlotCapacityRepository,
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
    if (!ids.length) throw new Error("Danh sách capacity không hợp lệ");
    if (!["active", "inactive"].includes(status))
      throw new Error("Trạng thái capacity không hợp lệ");
    return this.capacityRepo.bulkChangeStatus(
      ids,
      status as "active" | "inactive",
    );
  }
}
