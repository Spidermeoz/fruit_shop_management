import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";

type ListShippingZonesFilter = {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export class ListShippingZones {
  constructor(private readonly shippingZoneRepo: ShippingZoneRepository) {}

  async execute(filter: ListShippingZonesFilter = {}) {
    const safeLimit = Math.min(Math.max(Number(filter.limit ?? 10), 1), 100);
    const safeOffset = Math.max(Number(filter.offset ?? 0), 0);

    const result = await this.shippingZoneRepo.list({
      q: filter.q?.trim() || undefined,
      status: filter.status ?? "all",
      limit: safeLimit,
      offset: safeOffset,
    });

    return {
      rows: result.rows,
      count: result.count,
      limit: safeLimit,
      offset: safeOffset,
    };
  }
}
