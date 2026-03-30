import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

type ListDeliveryTimeSlotsInput = {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
};

export class ListDeliveryTimeSlots {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: ListDeliveryTimeSlotsInput = {}) {
    const page = Number(input.page ?? 1);
    const limit = Number(input.limit ?? 10);
    const keyword = String(input.keyword ?? "").trim();
    const status = String(input.status ?? "").trim();

    return this.deliveryTimeSlotRepo.list({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      keyword,
      status,
    });
  }
}
