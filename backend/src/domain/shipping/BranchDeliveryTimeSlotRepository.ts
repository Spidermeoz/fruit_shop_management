export interface BranchDeliveryTimeSlotEntity {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  branch?: {
    id: number;
    name?: string;
    code?: string;
  } | null;
  deliveryTimeSlot?: {
    id: number;
    code?: string;
    label?: string;
    startTime?: string;
    endTime?: string;
  } | null;
}

export interface ListBranchDeliveryTimeSlotsParams {
  page: number;
  limit: number;
  keyword?: string;
  status?: string;
  branchId?: number | null;
  deliveryTimeSlotId?: number | null;
}

export interface CreateBranchDeliveryTimeSlotPayload {
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: string;
}

export interface UpdateBranchDeliveryTimeSlotPayload {
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: string;
}

export interface BranchDeliveryTimeSlotRepository {
  list(params: ListBranchDeliveryTimeSlotsParams): Promise<{
    items: BranchDeliveryTimeSlotEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }>;

  findById(id: number): Promise<BranchDeliveryTimeSlotEntity | null>;

  findByBranchAndSlot(
    branchId: number,
    deliveryTimeSlotId: number,
  ): Promise<BranchDeliveryTimeSlotEntity | null>;

  create(
    payload: CreateBranchDeliveryTimeSlotPayload,
  ): Promise<BranchDeliveryTimeSlotEntity>;

  update(
    id: number,
    payload: UpdateBranchDeliveryTimeSlotPayload,
  ): Promise<BranchDeliveryTimeSlotEntity>;

  changeStatus(
    id: number,
    status: string,
  ): Promise<BranchDeliveryTimeSlotEntity>;

  softDelete(id: number): Promise<void>;
}
