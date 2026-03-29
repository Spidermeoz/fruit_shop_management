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

export interface ShippingZoneRepository {
  findBestMatch(
    input: ShippingZoneMatchInput,
  ): Promise<ShippingZoneEntity | null>;

  findBranchServiceArea(
    branchId: number,
    shippingZoneId: number,
  ): Promise<BranchServiceAreaEntity | null>;
}
