import type { BranchDeliveryTimeSlotRepository } from "../../../domain/shipping/BranchDeliveryTimeSlotRepository";

type ListBranchDeliveryTimeSlotsInput = {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  branchId?: number | string;
  deliveryTimeSlotId?: number | string;
};

export class ListBranchDeliveryTimeSlots {
  constructor(
    private readonly branchDeliveryTimeSlotRepo: BranchDeliveryTimeSlotRepository,
  ) {}

  async execute(input: ListBranchDeliveryTimeSlotsInput = {}) {
    const page = Number(input.page ?? 1);
    const limit = Number(input.limit ?? 10);
    const keyword = String(input.keyword ?? "").trim();
    const status = String(input.status ?? "").trim();

    const branchIdRaw =
      input.branchId !== undefined && input.branchId !== null
        ? Number(input.branchId)
        : null;

    const deliveryTimeSlotIdRaw =
      input.deliveryTimeSlotId !== undefined &&
      input.deliveryTimeSlotId !== null
        ? Number(input.deliveryTimeSlotId)
        : null;

    return this.branchDeliveryTimeSlotRepo.list({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      keyword,
      status,
      branchId:
        branchIdRaw !== null && Number.isInteger(branchIdRaw) && branchIdRaw > 0
          ? branchIdRaw
          : null,
      deliveryTimeSlotId:
        deliveryTimeSlotIdRaw !== null &&
        Number.isInteger(deliveryTimeSlotIdRaw) &&
        deliveryTimeSlotIdRaw > 0
          ? deliveryTimeSlotIdRaw
          : null,
    });
  }
}
