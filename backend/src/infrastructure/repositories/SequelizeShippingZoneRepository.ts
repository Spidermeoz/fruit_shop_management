import { Op } from "sequelize";
import type {
  BranchServiceAreaEntity,
  ShippingZoneEntity,
  ShippingZoneMatchInput,
  ShippingZoneRepository,
} from "../../domain/shipping/ShippingZoneRepository";

export class SequelizeShippingZoneRepository implements ShippingZoneRepository {
  constructor(private readonly models: any) {}

  private mapZone(row: any): ShippingZoneEntity {
    return {
      id: Number(row.id),
      code: row.code,
      name: row.name,
      province: row.province ?? null,
      district: row.district ?? null,
      ward: row.ward ?? null,
      baseFee: Number(row.base_fee ?? 0),
      freeShipThreshold:
        row.free_ship_threshold !== null &&
        row.free_ship_threshold !== undefined
          ? Number(row.free_ship_threshold)
          : null,
      priority: Number(row.priority ?? 0),
      status: row.status,
    };
  }

  private mapServiceArea(row: any): BranchServiceAreaEntity {
    return {
      id: Number(row.id),
      branchId: Number(row.branch_id),
      shippingZoneId: Number(row.shipping_zone_id),
      deliveryFeeOverride:
        row.delivery_fee_override !== null &&
        row.delivery_fee_override !== undefined
          ? Number(row.delivery_fee_override)
          : null,
      minOrderValue:
        row.min_order_value !== null && row.min_order_value !== undefined
          ? Number(row.min_order_value)
          : null,
      maxOrderValue:
        row.max_order_value !== null && row.max_order_value !== undefined
          ? Number(row.max_order_value)
          : null,
      supportsSameDay: !!row.supports_same_day,
      status: row.status,
    };
  }

  async findBestMatch(
    input: ShippingZoneMatchInput,
  ): Promise<ShippingZoneEntity | null> {
    const province = String(input.province ?? "").trim();
    const district = String(input.district ?? "").trim();
    const ward = String(input.ward ?? "").trim();

    if (!province) {
      return null;
    }

    const whereBase: any = {
      status: "active",
      deleted: 0,
      province,
    };

    const exactWardWhere: any = {
      ...whereBase,
      district: district || null,
      ward: ward || null,
    };

    const districtWhere: any = {
      ...whereBase,
      district: district || null,
      ward: null,
    };

    const provinceWhere: any = {
      ...whereBase,
      district: null,
      ward: null,
    };

    const queries = [
      exactWardWhere,
      district ? districtWhere : null,
      provinceWhere,
    ].filter(Boolean);

    for (const where of queries) {
      const row = await this.models.ShippingZone.findOne({
        where,
        order: [
          ["priority", "ASC"],
          ["id", "ASC"],
        ],
      });

      if (row) {
        return this.mapZone(row);
      }
    }

    const fallback = await this.models.ShippingZone.findOne({
      where: {
        status: "active",
        deleted: 0,
        province,
        district: {
          [Op.or]: [district || null, null],
        },
      },
      order: [
        ["priority", "ASC"],
        ["id", "ASC"],
      ],
    });

    return fallback ? this.mapZone(fallback) : null;
  }

  async findBranchServiceArea(
    branchId: number,
    shippingZoneId: number,
  ): Promise<BranchServiceAreaEntity | null> {
    const row = await this.models.BranchServiceArea.findOne({
      where: {
        branch_id: branchId,
        shipping_zone_id: shippingZoneId,
        status: "active",
        deleted: 0,
      },
    });

    return row ? this.mapServiceArea(row) : null;
  }
}
