import {
  BranchDeliverySlotCapacityRepository,
  ListBranchDeliverySlotCapacitiesQuery,
} from "../../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class ListBranchDeliverySlotCapacities {
  constructor(private readonly repo: BranchDeliverySlotCapacityRepository) {}

  async execute(query: ListBranchDeliverySlotCapacitiesQuery) {
    return this.repo.findAll(query);
  }
}
