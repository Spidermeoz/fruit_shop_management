export type BulkWriteMode = "skip_existing" | "overwrite" | "fail_on_conflict";

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
    maxOrders?: number | null;
    sortOrder?: number;
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

export interface BulkUpsertBranchDeliveryTimeSlotItem {
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status?: string;
}

export interface CopyBranchDeliveryTimeSlotsFromBranchInput {
  sourceBranchId: number;
  targetBranchIds: number[];
  mode?: BulkWriteMode;
  statusOverride?: string;
}

export interface BranchDeliveryTimeSlotBulkWriteResult {
  created: BranchDeliveryTimeSlotEntity[];
  updated: BranchDeliveryTimeSlotEntity[];
  skipped: Array<{
    branchId: number;
    deliveryTimeSlotId: number;
    reason: string;
  }>;
  conflicts: Array<{
    branchId: number;
    deliveryTimeSlotId: number;
    reason: string;
  }>;
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

  findByIds(ids: number[]): Promise<BranchDeliveryTimeSlotEntity[]>;

  findByBranchIds(branchIds: number[]): Promise<BranchDeliveryTimeSlotEntity[]>;

  findByBranchAndSlot(
    branchId: number,
    deliveryTimeSlotId: number,
  ): Promise<BranchDeliveryTimeSlotEntity | null>;

  findDeletedByBranchAndSlot(
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

  revive(
    id: number,
    payload: UpdateBranchDeliveryTimeSlotPayload,
  ): Promise<BranchDeliveryTimeSlotEntity>;

  bulkUpsert(
    items: BulkUpsertBranchDeliveryTimeSlotItem[],
    mode?: BulkWriteMode,
  ): Promise<BranchDeliveryTimeSlotBulkWriteResult>;

  copyFromBranch(
    input: CopyBranchDeliveryTimeSlotsFromBranchInput,
  ): Promise<BranchDeliveryTimeSlotBulkWriteResult>;

  changeStatus(
    id: number,
    status: string,
  ): Promise<BranchDeliveryTimeSlotEntity>;

  bulkChangeStatus(
    ids: number[],
    status: string,
  ): Promise<{ updatedIds: number[]; notFoundIds: number[] }>;

  softDelete(id: number): Promise<void>;
}
