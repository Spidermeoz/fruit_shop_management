import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class CopyBranchDeliverySlotCapacitiesFromDate {
  constructor(
    private readonly capacityRepo: BranchDeliverySlotCapacityRepository,
    private readonly branchRepo: BranchRepository,
  ) {}

  async execute(input: {
    sourceDate: string;
    targetDate: string;
    branchIds?: number[];
    mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
    statusOverride?: "active" | "inactive";
  }) {
    if (!input.sourceDate) throw new Error("Ngày nguồn không hợp lệ");
    if (!input.targetDate) throw new Error("Ngày đích không hợp lệ");
    const branchIds = input.branchIds?.length
      ? [
          ...new Set(
            input.branchIds
              .map(Number)
              .filter((x) => Number.isInteger(x) && x > 0),
          ),
        ]
      : undefined;
    if (branchIds?.length) {
      for (const branchId of branchIds) {
        const branch = await this.branchRepo.findById(branchId);
        if (!branch) throw new Error(`Không tìm thấy chi nhánh #${branchId}`);
      }
    }
    return this.capacityRepo.copyFromDate({ ...input, branchIds });
  }
}
