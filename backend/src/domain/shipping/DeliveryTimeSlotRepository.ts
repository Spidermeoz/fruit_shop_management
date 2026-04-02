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

export interface ListDeliveryTimeSlotsParams {
  page: number;
  limit: number;
  keyword?: string;
  status?: string;
}

export interface CreateDeliveryTimeSlotPayload {
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  maxOrders?: number | null;
  sortOrder: number;
  status: string;
}

export interface UpdateDeliveryTimeSlotPayload {
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  maxOrders?: number | null;
  sortOrder: number;
  status: string;
}

export interface DeliveryTimeSlotRepository {
  list(params: ListDeliveryTimeSlotsParams): Promise<{
    items: DeliveryTimeSlotEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }>;

  findById(id: number): Promise<DeliveryTimeSlotEntity | null>;

  findByCode(code: string): Promise<DeliveryTimeSlotEntity | null>;

  findDeletedByCode(code: string): Promise<DeliveryTimeSlotEntity | null>;

  create(
    payload: CreateDeliveryTimeSlotPayload,
  ): Promise<DeliveryTimeSlotEntity>;

  update(
    id: number,
    payload: UpdateDeliveryTimeSlotPayload,
  ): Promise<DeliveryTimeSlotEntity>;

  revive(
    id: number,
    payload: UpdateDeliveryTimeSlotPayload,
  ): Promise<DeliveryTimeSlotEntity>;

  changeStatus(id: number, status: string): Promise<DeliveryTimeSlotEntity>;

  softDelete(id: number): Promise<void>;

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
