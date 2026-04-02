import { Op, fn, col, where as sequelizeWhere } from "sequelize";
import type {
  BranchServiceAreaEntity,
  CreateShippingZoneInput,
  ListShippingZonesParams,
  ShippingZoneEntity,
  ShippingZoneMatchInput,
  ShippingZoneRepository,
  UpdateShippingZonePatch,
} from "../../domain/shipping/ShippingZoneRepository";

const normalizeMatchText = (value?: string | null): string | null => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized ? normalized : null;
};

const ciEquals = (field: string, value: string | null) => {
  if (value === null) {
    return { [field]: null };
  }

  return sequelizeWhere(fn("LOWER", col(field)), value);
};

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

  async list(
    params: ListShippingZonesParams,
  ): Promise<{ rows: ShippingZoneEntity[]; count: number }> {
    const q = String(params.q ?? "").trim();
    const status = String(params.status ?? "all")
      .trim()
      .toLowerCase();
    const limit = Math.max(Number(params.limit ?? 10), 1);
    const offset = Math.max(Number(params.offset ?? 0), 0);

    const where: any = {
      deleted: 0,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (q) {
      where[Op.or] = [
        { code: { [Op.like]: `%${q}%` } },
        { name: { [Op.like]: `%${q}%` } },
        { province: { [Op.like]: `%${q}%` } },
        { district: { [Op.like]: `%${q}%` } },
        { ward: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows, count } = await this.models.ShippingZone.findAndCountAll({
      where,
      order: [
        ["priority", "ASC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });

    return {
      rows: rows.map((row: any) => this.mapZone(row)),
      count,
    };
  }

  async findById(id: number): Promise<ShippingZoneEntity | null> {
    const row = await this.models.ShippingZone.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    return row ? this.mapZone(row) : null;
  }

  async findByCode(code: string): Promise<ShippingZoneEntity | null> {
    const normalizedCode = String(code ?? "")
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      return null;
    }

    const row = await this.models.ShippingZone.findOne({
      where: {
        code: normalizedCode,
        deleted: 0,
      },
    });

    return row ? this.mapZone(row) : null;
  }

  async create(input: CreateShippingZoneInput): Promise<ShippingZoneEntity> {
    const row = await this.models.ShippingZone.create({
      code: input.code,
      name: input.name,
      province: input.province ?? null,
      district: input.district ?? null,
      ward: input.ward ?? null,
      base_fee: Number(input.baseFee ?? 0),
      free_ship_threshold:
        input.freeShipThreshold !== undefined ? input.freeShipThreshold : null,
      priority: Number(input.priority ?? 0),
      status: input.status ?? "active",
      deleted: 0,
      deleted_at: null,
    });

    return this.mapZone(row);
  }

  async update(
    id: number,
    patch: UpdateShippingZonePatch,
  ): Promise<ShippingZoneEntity> {
    const row = await this.models.ShippingZone.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    if (!row) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    const payload: any = {};

    if (patch.code !== undefined) payload.code = patch.code;
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.province !== undefined) payload.province = patch.province;
    if (patch.district !== undefined) payload.district = patch.district;
    if (patch.ward !== undefined) payload.ward = patch.ward;
    if (patch.baseFee !== undefined) payload.base_fee = patch.baseFee;
    if (patch.freeShipThreshold !== undefined) {
      payload.free_ship_threshold = patch.freeShipThreshold;
    }
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.status !== undefined) payload.status = patch.status;

    await row.update(payload);

    return this.mapZone(row);
  }

  async changeStatus(id: number, status: string): Promise<ShippingZoneEntity> {
    const row = await this.models.ShippingZone.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    if (!row) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    await row.update({
      status,
    });

    return this.mapZone(row);
  }

  async softDelete(id: number): Promise<boolean> {
    const row = await this.models.ShippingZone.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    if (!row) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    await row.update({
      deleted: 1,
      deleted_at: new Date(),
    });

    return true;
  }

  async findBestMatch(
    input: ShippingZoneMatchInput,
  ): Promise<ShippingZoneEntity | null> {
    const province = normalizeMatchText(input.province);
    const district = normalizeMatchText(input.district);
    const ward = normalizeMatchText(input.ward);

    if (!province) {
      return null;
    }

    const baseConditions: any[] = [
      { status: "active" },
      { deleted: 0 },
      ciEquals("province", province),
    ];

    const exactWardWhere: any = {
      [Op.and]: [
        ...baseConditions,
        ciEquals("district", district || null),
        ciEquals("ward", ward || null),
      ],
    };

    const districtWhere: any = {
      [Op.and]: [
        ...baseConditions,
        ciEquals("district", district || null),
        { ward: null },
      ],
    };

    const provinceWhere: any = {
      [Op.and]: [...baseConditions, { district: null }, { ward: null }],
    };

    const queries = [
      exactWardWhere,
      district ? districtWhere : null,
      provinceWhere,
    ].filter(Boolean);

    for (const zoneWhere of queries) {
      const row = await this.models.ShippingZone.findOne({
        where: zoneWhere,
        order: [
          ["priority", "ASC"],
          ["id", "ASC"],
        ],
      });

      if (row) {
        return this.mapZone(row);
      }
    }

    const fallbackConditions: any[] = [
      { status: "active" },
      { deleted: 0 },
      ciEquals("province", province),
    ];

    if (district) {
      fallbackConditions.push({
        [Op.or]: [ciEquals("district", district), { district: null }],
      });
    } else {
      fallbackConditions.push({ district: null });
    }

    const fallback = await this.models.ShippingZone.findOne({
      where: {
        [Op.and]: fallbackConditions,
      },
      order: [
        ["priority", "ASC"],
        ["id", "ASC"],
      ],
    });

    return fallback ? this.mapZone(fallback) : null;
  }

  async findMatchChain(
    input: ShippingZoneMatchInput,
  ): Promise<ShippingZoneEntity[]> {
    const province = normalizeMatchText(input.province);
    const district = normalizeMatchText(input.district);
    const ward = normalizeMatchText(input.ward);

    if (!province) {
      return [];
    }

    const baseConditions: any[] = [
      { status: "active" },
      { deleted: 0 },
      ciEquals("province", province),
    ];

    const exactWardWhere: any =
      district && ward
        ? {
            [Op.and]: [
              ...baseConditions,
              ciEquals("district", district),
              ciEquals("ward", ward),
            ],
          }
        : null;

    const districtWhere: any = district
      ? {
          [Op.and]: [
            ...baseConditions,
            ciEquals("district", district),
            { ward: null },
          ],
        }
      : null;

    const provinceWhere: any = {
      [Op.and]: [...baseConditions, { district: null }, { ward: null }],
    };

    const queries = [exactWardWhere, districtWhere, provinceWhere].filter(
      Boolean,
    ) as any[];

    const found: ShippingZoneEntity[] = [];
    const seenIds = new Set<number>();

    for (const zoneWhere of queries) {
      const row = await this.models.ShippingZone.findOne({
        where: zoneWhere,
        order: [
          ["priority", "ASC"],
          ["id", "ASC"],
        ],
      });

      if (!row) continue;

      const mapped = this.mapZone(row);
      if (seenIds.has(mapped.id)) continue;

      seenIds.add(mapped.id);
      found.push(mapped);
    }

    return found;
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
