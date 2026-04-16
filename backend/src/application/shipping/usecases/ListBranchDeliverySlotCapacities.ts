import {
  BranchDeliverySlotCapacityRepository,
  ListBranchDeliverySlotCapacitiesQuery,
} from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class ListBranchDeliverySlotCapacities {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(query: ListBranchDeliverySlotCapacitiesQuery) {
    const result = await this.repo.findAll(query);
    return {
      items: result.items,
      total: result.total,
    };
  }
}
