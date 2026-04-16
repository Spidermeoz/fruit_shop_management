export type BranchDeliverySlotCapacityStatus = "active" | "inactive";
export type BulkWriteMode = "skip_existing" | "overwrite" | "fail_on_conflict";

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

export interface BulkUpsertBranchDeliverySlotCapacityItem {
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders?: number;
  status?: BranchDeliverySlotCapacityStatus;
}

export interface CopyBranchDeliverySlotCapacitiesFromDateInput {
  sourceDate: string;
  targetDate: string;
  branchIds?: number[];
  mode?: BulkWriteMode;
  statusOverride?: BranchDeliverySlotCapacityStatus;
}

export interface GenerateBranchDeliverySlotCapacitiesFromDefaultsInput {
  deliveryDate: string;
  branchIds?: number[];
  mode?: BulkWriteMode;
  status?: BranchDeliverySlotCapacityStatus;
}

export interface BranchDeliverySlotCapacityBulkWriteResult {
  created: BranchDeliverySlotCapacity[];
  updated: BranchDeliverySlotCapacity[];
  skipped: Array<{
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
    reason: string;
  }>;
  conflicts: Array<{
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
    reason: string;
  }>;
}

export interface BranchCapacityPlannerRow {
  branchId: number;
  deliveryTimeSlotId: number;
  deliveryDate: string;
  maxOrders?: number | null;
  reservedOrders: number;
  status: BranchDeliverySlotCapacityStatus;
  branchSlotMaxOrdersOverride?: number | null;
  slotMaxOrders?: number | null;
}

export interface BranchDeliverySlotCapacityRepository {
  findAll(query: ListBranchDeliverySlotCapacitiesQuery): Promise<{
    items: BranchDeliverySlotCapacity[];
    total: number;
  }>;

  findById(id: number): Promise<BranchDeliverySlotCapacity | null>;

  findByIds(ids: number[]): Promise<BranchDeliverySlotCapacity[]>;

  findByDate(
    date: string,
    branchIds?: number[],
  ): Promise<BranchDeliverySlotCapacity[]>;

  findByDateRange(
    startDate: string,
    endDate: string,
    branchIds?: number[],
  ): Promise<BranchDeliverySlotCapacity[]>;

  findByUniqueKey(params: {
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
  }): Promise<BranchDeliverySlotCapacity | null>;

  findDeletedByUniqueKey(params: {
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

  revive(
    id: number,
    data: Partial<BranchDeliverySlotCapacity>,
  ): Promise<BranchDeliverySlotCapacity>;

  bulkUpsert(
    items: BulkUpsertBranchDeliverySlotCapacityItem[],
    mode?: BulkWriteMode,
  ): Promise<BranchDeliverySlotCapacityBulkWriteResult>;

  copyFromDate(
    input: CopyBranchDeliverySlotCapacitiesFromDateInput,
  ): Promise<BranchDeliverySlotCapacityBulkWriteResult>;

  generateFromDefaults(
    input: GenerateBranchDeliverySlotCapacitiesFromDefaultsInput,
  ): Promise<BranchDeliverySlotCapacityBulkWriteResult>;

  getPlanner(
    deliveryDate: string,
    branchIds?: number[],
  ): Promise<BranchCapacityPlannerRow[]>;

  changeStatus(
    id: number,
    status: BranchDeliverySlotCapacityStatus,
  ): Promise<void>;

  bulkChangeStatus(
    ids: number[],
    status: BranchDeliverySlotCapacityStatus,
  ): Promise<{ updatedIds: number[]; notFoundIds: number[] }>;

  softDelete(id: number): Promise<void>;
}
