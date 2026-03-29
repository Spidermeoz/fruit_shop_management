export interface DeliveryTimeSlotEntity {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  maxOrders?: number | null;
  sortOrder: number;
  status: string;
}

export interface BranchDeliveryTimeSlotEntity {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: string;
}

export interface BranchDeliverySlotCapacityEntity {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: string;
}

export interface DeliveryTimeSlotRepository {
  listActiveByBranch(branchId: number): Promise<
    Array<{
      slot: DeliveryTimeSlotEntity;
      branchSlot?: BranchDeliveryTimeSlotEntity | null;
    }>
  >;

  findCapacity(
    branchId: number,
    deliveryDate: string,
    deliveryTimeSlotId: number,
  ): Promise<BranchDeliverySlotCapacityEntity | null>;
}
