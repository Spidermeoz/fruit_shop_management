import { Op, fn, col, where as sequelizeWhere } from "sequelize";
import type {
  BranchServiceAreaEntity,
  BulkChangeShippingZoneStatusResult,
  BulkDeleteShippingZonesResult,
  BulkUpdateShippingZonePriorityItem,
  BulkUpdateShippingZonePriorityResult,
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
  if (value === null) return { [field]: null };
  return sequelizeWhere(fn("LOWER", col(field)), value);
};

const normalizeOptionalMoney = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Phí giao hàng không hợp lệ");
  }
  return parsed;
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
      baseFee: Number(row.base_fee),
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

  async list(params: ListShippingZonesParams) {
    const q = String(params.q ?? "").trim();
    const status = String(params.status ?? "all")
      .trim()
      .toLowerCase();
    const limit = Math.max(Number(params.limit ?? 10), 1);
    const offset = Math.max(Number(params.offset ?? 0), 0);

    const where: any = { deleted: 0 };
    if (status && status !== "all") where.status = status;
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

    return { rows: rows.map((row: any) => this.mapZone(row)), count };
  }

  async findById(id: number) {
    const row = await this.models.ShippingZone.findOne({
      where: { id, deleted: 0 },
    });
    return row ? this.mapZone(row) : null;
  }

  async findByCode(code: string) {
    const normalizedCode = String(code ?? "")
      .trim()
      .toUpperCase();
    if (!normalizedCode) return null;
    const row = await this.models.ShippingZone.findOne({
      where: { code: normalizedCode, deleted: 0 },
    });
    return row ? this.mapZone(row) : null;
  }

  async findDeletedByCode(code: string) {
    const normalizedCode = String(code ?? "")
      .trim()
      .toUpperCase();
    if (!normalizedCode) return null;
    const row = await this.models.ShippingZone.findOne({
      where: { code: normalizedCode, deleted: 1 },
      order: [["id", "DESC"]],
    });
    return row ? this.mapZone(row) : null;
  }

  async create(input: CreateShippingZoneInput) {
    const baseFee = normalizeOptionalMoney(input.baseFee);
    if (baseFee === null) {
      throw new Error("Bạn cần cấu hình phí giao hàng cơ bản cho khu vực này");
    }

    const row = await this.models.ShippingZone.create({
      code: String(input.code).trim().toUpperCase(),
      name: input.name,
      province: input.province ?? null,
      district: input.district ?? null,
      ward: input.ward ?? null,
      base_fee: baseFee,
      free_ship_threshold:
        input.freeShipThreshold !== undefined ? input.freeShipThreshold : null,
      priority: Number(input.priority ?? 0),
      status: input.status ?? "active",
      deleted: 0,
      deleted_at: null,
    });
    return this.mapZone(row);
  }

  async update(id: number, patch: UpdateShippingZonePatch) {
    const row = await this.models.ShippingZone.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Vùng giao hàng không tồn tại");

    const payload: any = {};
    if (patch.code !== undefined)
      payload.code = String(patch.code).trim().toUpperCase();
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.province !== undefined) payload.province = patch.province ?? null;
    if (patch.district !== undefined) payload.district = patch.district ?? null;
    if (patch.ward !== undefined) payload.ward = patch.ward ?? null;
    if (patch.baseFee !== undefined) {
      const baseFee = normalizeOptionalMoney(patch.baseFee);
      if (baseFee === null) {
        throw new Error("Phí giao hàng cơ bản không được để trống");
      }
      payload.base_fee = baseFee;
    }
    if (patch.freeShipThreshold !== undefined)
      payload.free_ship_threshold = patch.freeShipThreshold;
    if (patch.priority !== undefined) payload.priority = patch.priority ?? 0;
    if (patch.status !== undefined) payload.status = patch.status ?? row.status;

    await row.update(payload);
    return this.mapZone(row);
  }

  async revive(id: number, patch: UpdateShippingZonePatch) {
    const row = await this.models.ShippingZone.findOne({
      where: { id, deleted: 1 },
    });
    if (!row)
      throw new Error("Không tìm thấy vùng giao hàng đã xóa để khôi phục");

    const payload: any = { deleted: 0, deleted_at: null };
    if (patch.code !== undefined)
      payload.code = String(patch.code).trim().toUpperCase();
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.province !== undefined) payload.province = patch.province ?? null;
    if (patch.district !== undefined) payload.district = patch.district ?? null;
    if (patch.ward !== undefined) payload.ward = patch.ward ?? null;
    if (patch.baseFee !== undefined) {
      const baseFee = normalizeOptionalMoney(patch.baseFee);
      if (baseFee === null) {
        throw new Error("Phí giao hàng cơ bản không được để trống");
      }
      payload.base_fee = baseFee;
    }
    if (patch.freeShipThreshold !== undefined)
      payload.free_ship_threshold = patch.freeShipThreshold;
    if (patch.priority !== undefined) payload.priority = patch.priority ?? 0;
    if (patch.status !== undefined) payload.status = patch.status ?? row.status;

    await row.update(payload);
    return this.mapZone(row);
  }

  async changeStatus(id: number, status: string) {
    const row = await this.models.ShippingZone.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Vùng giao hàng không tồn tại");
    await row.update({ status });
    return this.mapZone(row);
  }

  async bulkChangeStatus(
    ids: number[],
    status: string,
  ): Promise<BulkChangeShippingZoneStatusResult> {
    const uniqIds: number[] = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    const found: any[] = await this.models.ShippingZone.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
    });

    const foundIds: Set<number> = new Set(found.map((x: any) => Number(x.id)));

    for (const row of found) {
      await row.update({ status });
    }

    return {
      updatedIds: Array.from(foundIds),
      notFoundIds: uniqIds.filter((id) => !foundIds.has(id)),
    };
  }

  async bulkDelete(ids: number[]): Promise<BulkDeleteShippingZonesResult> {
    const uniqIds: number[] = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    const found: any[] = await this.models.ShippingZone.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
    });

    const foundIds: Set<number> = new Set(found.map((x: any) => Number(x.id)));

    const now = new Date();

    for (const row of found) {
      await row.update({ deleted: 1, deleted_at: now });
    }

    return {
      deletedIds: Array.from(foundIds),
      notFoundIds: uniqIds.filter((id) => !foundIds.has(id)),
    };
  }

  async bulkUpdatePriority(
    items: BulkUpdateShippingZonePriorityItem[],
  ): Promise<BulkUpdateShippingZonePriorityResult> {
    const updatedIds: number[] = [];
    const notFoundIds: number[] = [];
    for (const item of items) {
      const row = await this.models.ShippingZone.findOne({
        where: { id: Number(item.id), deleted: 0 },
      });
      if (!row) {
        notFoundIds.push(Number(item.id));
        continue;
      }
      await row.update({ priority: Number(item.priority) });
      updatedIds.push(Number(item.id));
    }
    return { updatedIds, notFoundIds };
  }

  async softDelete(id: number) {
    const row = await this.models.ShippingZone.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Vùng giao hàng không tồn tại");
    await row.update({ deleted: 1, deleted_at: new Date() });
    return true;
  }

  async findBestMatch(input: ShippingZoneMatchInput) {
    const province = normalizeMatchText(input.province);
    const district = normalizeMatchText(input.district);
    const ward = normalizeMatchText(input.ward);
    if (!province) return null;

    const baseConditions: any[] = [
      { status: "active" },
      { deleted: 0 },
      ciEquals("province", province),
    ];
    const queries = [
      {
        [Op.and]: [
          ...baseConditions,
          ciEquals("district", district || null),
          ciEquals("ward", ward || null),
        ],
      },
      district
        ? {
            [Op.and]: [
              ...baseConditions,
              ciEquals("district", district),
              { ward: null },
            ],
          }
        : null,
      { [Op.and]: [...baseConditions, { district: null }, { ward: null }] },
    ].filter(Boolean);

    for (const zoneWhere of queries) {
      const row = await this.models.ShippingZone.findOne({
        where: zoneWhere,
        order: [
          ["priority", "ASC"],
          ["id", "ASC"],
        ],
      });
      if (row) return this.mapZone(row);
    }
    return null;
  }

  async findMatchChain(
    input: ShippingZoneMatchInput,
  ): Promise<ShippingZoneEntity[]> {
    const province = normalizeMatchText(input.province);
    const district = normalizeMatchText(input.district);
    const ward = normalizeMatchText(input.ward);
    if (!province) return [];
    const where: any = {
      deleted: 0,
      status: "active",
      [Op.and]: [ciEquals("province", province)],
    };
    const rows = await this.models.ShippingZone.findAll({
      where,
      order: [
        ["priority", "ASC"],
        ["id", "ASC"],
      ],
    });
    return rows
      .map((row: any) => this.mapZone(row))
      .filter((zone: ShippingZoneEntity) => {
        if (ward && zone.ward && normalizeMatchText(zone.ward) === ward)
          return true;
        if (
          !zone.ward &&
          district &&
          zone.district &&
          normalizeMatchText(zone.district) === district
        )
          return true;
        if (!zone.ward && !zone.district) return true;
        return false;
      });
  }

  async findBranchServiceArea(branchId: number, shippingZoneId: number) {
    const row = await this.models.BranchServiceArea.findOne({
      where: {
        branch_id: branchId,
        shipping_zone_id: shippingZoneId,
        deleted: 0,
        status: "active",
      },
    });
    return row ? this.mapServiceArea(row) : null;
  }
}
