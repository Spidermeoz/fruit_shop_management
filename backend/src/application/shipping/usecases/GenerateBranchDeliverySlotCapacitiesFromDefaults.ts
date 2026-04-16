import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class GenerateBranchDeliverySlotCapacitiesFromDefaults {
  constructor(
    private readonly capacityRepo: BranchDeliverySlotCapacityRepository,
    private readonly branchRepo: BranchRepository,
  ) {}

  async execute(input: {
    deliveryDate: string;
    branchIds?: number[];
    mode?: "skip_existing" | "overwrite" | "fail_on_conflict";
    status?: "active" | "inactive";
  }) {
    if (!input.deliveryDate) throw new Error("Ngày giao không hợp lệ");
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
    return this.capacityRepo.generateFromDefaults({ ...input, branchIds });
  }
}
