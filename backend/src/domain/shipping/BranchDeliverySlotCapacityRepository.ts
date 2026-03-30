export type BranchDeliverySlotCapacityStatus = "active" | "inactive";

export interface BranchDeliverySlotCapacity {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: BranchDeliverySlotCapacityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ListBranchDeliverySlotCapacitiesQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  branchId?: number;
  deliveryTimeSlotId?: number;
  deliveryDate?: string;
}

export interface BranchDeliverySlotCapacityRepository {
  findAll(query: ListBranchDeliverySlotCapacitiesQuery): Promise<{
    items: BranchDeliverySlotCapacity[];
    total: number;
  }>;

  findById(id: number): Promise<BranchDeliverySlotCapacity | null>;

  findByUniqueKey(params: {
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
  }): Promise<BranchDeliverySlotCapacity | null>;

  create(
    data: Omit<BranchDeliverySlotCapacity, "id" | "createdAt" | "updatedAt">,
  ): Promise<BranchDeliverySlotCapacity>;

  update(
    id: number,
    data: Partial<BranchDeliverySlotCapacity>,
  ): Promise<BranchDeliverySlotCapacity>;

  changeStatus(
    id: number,
    status: BranchDeliverySlotCapacityStatus,
  ): Promise<void>;

  softDelete(id: number): Promise<void>;
}
