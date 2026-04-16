import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { BranchDeliverySlotCapacityRepository } from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";
import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";
import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";

export class GetBranchShippingSetupChecklist {
  constructor(
    private readonly branchRepo: BranchRepository,
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
    private readonly capacityRepo: BranchDeliverySlotCapacityRepository,
  ) {}

  async execute(input: { branchIds?: number[]; deliveryDate?: string }) {
    const deliveryDate = input.deliveryDate?.trim() || null;
    const rows = await this.branchRepo.list({
      limit: 1000,
      offset: 0,
      includeDeleted: false,
    } as any);
    const branches = rows.rows.filter((branch: any) => {
      if (!input.branchIds?.length) return true;
      return input.branchIds
        .map(Number)
        .includes(Number(branch.props?.id ?? branch.id));
    });

    const branchIds = branches.map((branch: any) =>
      Number(branch.props?.id ?? branch.id),
    );
    const coverageRows =
      await this.branchServiceAreaRepo.findByBranchIds(branchIds);
    const slotRows =
      await this.branchDeliveryTimeSlotRepo.findByBranchIds(branchIds);
    const capacityRows = deliveryDate
      ? await this.capacityRepo.findByDate(deliveryDate, branchIds)
      : [];

    const coverageMap = new Map<number, number>();
    for (const row of coverageRows) {
      const branchId = Number(row.props.branchId);
      coverageMap.set(branchId, (coverageMap.get(branchId) ?? 0) + 1);
    }
    const slotMap = new Map<number, number>();
    for (const row of slotRows) {
      slotMap.set(
        Number(row.branchId),
        (slotMap.get(Number(row.branchId)) ?? 0) + 1,
      );
    }
    const capacityMap = new Map<number, number>();
    for (const row of capacityRows) {
      capacityMap.set(
        Number(row.branchId),
        (capacityMap.get(Number(row.branchId)) ?? 0) + 1,
      );
    }

    return {
      deliveryDate,
      branches: branches.map((branch: any) => {
        const props = branch.props ?? branch;
        const branchId = Number(props.id);
        const coverageCount = coverageMap.get(branchId) ?? 0;
        const slotCount = slotMap.get(branchId) ?? 0;
        const capacityCount = capacityMap.get(branchId) ?? 0;
        return {
          branchId,
          branchName: props.name,
          branchCode: props.code,
          coverageCount,
          slotCount,
          capacityCount,
          needsCoverage: coverageCount === 0,
          needsBranchSlots: slotCount === 0,
          needsCapacities:
            !!deliveryDate && slotCount > 0 && capacityCount === 0,
          isReady:
            coverageCount > 0 &&
            slotCount > 0 &&
            (!deliveryDate || capacityCount > 0),
        };
      }),
    };
  }
}
