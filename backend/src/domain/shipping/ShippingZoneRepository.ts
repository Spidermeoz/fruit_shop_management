export type ShippingZoneBulkWriteMode =
  | "skip_existing"
  | "overwrite"
  | "fail_on_conflict";

export interface ShippingZoneMatchInput {
  province?: string | null;
  district?: string | null;
  ward?: string | null;
}

export interface ShippingZoneEntity {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee: number;
  freeShipThreshold?: number | null;
  priority: number;
  status: string;
}

export interface BranchServiceAreaEntity {
  id: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay: boolean;
  status: string;
}

export interface ListShippingZonesParams {
  q?: string;
  status?: string;
  limit: number;
  offset: number;
}

export interface CreateShippingZoneInput {
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee?: number;
  freeShipThreshold?: number | null;
  priority?: number;
  status?: string;
}

export type UpdateShippingZonePatch = Partial<{
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee?: number | null;
  freeShipThreshold?: number | null;
  priority?: number | null;
  status?: string | null;
}>;

export interface BulkChangeShippingZoneStatusResult {
  updatedIds: number[];
  notFoundIds: number[];
}

export interface BulkDeleteShippingZonesResult {
  deletedIds: number[];
  notFoundIds: number[];
}

export interface BulkUpdateShippingZonePriorityItem {
  id: number;
  priority: number;
}

export interface BulkUpdateShippingZonePriorityResult {
  updatedIds: number[];
  notFoundIds: number[];
}

export interface ShippingZoneRepository {
  findBestMatch(
    input: ShippingZoneMatchInput,
  ): Promise<ShippingZoneEntity | null>;

  findMatchChain(input: ShippingZoneMatchInput): Promise<ShippingZoneEntity[]>;

  findBranchServiceArea(
    branchId: number,
    shippingZoneId: number,
  ): Promise<BranchServiceAreaEntity | null>;

  list(params: ListShippingZonesParams): Promise<{
    rows: ShippingZoneEntity[];
    count: number;
  }>;

  findById(id: number): Promise<ShippingZoneEntity | null>;

  findByCode(code: string): Promise<ShippingZoneEntity | null>;

  findDeletedByCode(code: string): Promise<ShippingZoneEntity | null>;

  create(input: CreateShippingZoneInput): Promise<ShippingZoneEntity>;

  update(
    id: number,
    patch: UpdateShippingZonePatch,
  ): Promise<ShippingZoneEntity>;

  revive(
    id: number,
    patch: UpdateShippingZonePatch,
  ): Promise<ShippingZoneEntity>;

  changeStatus(id: number, status: string): Promise<ShippingZoneEntity>;

  bulkChangeStatus(
    ids: number[],
    status: string,
  ): Promise<BulkChangeShippingZoneStatusResult>;

  bulkDelete(ids: number[]): Promise<BulkDeleteShippingZonesResult>;

  bulkUpdatePriority(
    items: BulkUpdateShippingZonePriorityItem[],
  ): Promise<BulkUpdateShippingZonePriorityResult>;

  softDelete(id: number): Promise<boolean>;
}
