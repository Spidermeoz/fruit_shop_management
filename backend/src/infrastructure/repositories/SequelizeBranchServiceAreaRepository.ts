import { Op, WhereOptions } from "sequelize";
import { BranchServiceArea } from "../../domain/shipping/BranchServiceArea";
import type { BranchServiceAreaRepository } from "../../domain/shipping/BranchServiceAreaRepository";
import type {
  CreateBranchServiceAreaInput,
  ListBranchServiceAreasFilter,
  UpdateBranchServiceAreaPatch,
} from "../../domain/shipping/branchServiceArea.types";

type Models = {
  BranchServiceArea: any;
  Branch?: any;
  ShippingZone?: any;
};

const toBool = (v: any) => v === true || v === 1 || v === "1";

export class SequelizeBranchServiceAreaRepository implements BranchServiceAreaRepository {
  constructor(private readonly models: Models) {}

  private mapRow = (r: any): BranchServiceArea =>
    BranchServiceArea.create({
      id: Number(r.id),
      branchId: Number(r.branch_id),
      shippingZoneId: Number(r.shipping_zone_id),
      deliveryFeeOverride:
        r.delivery_fee_override != null
          ? Number(r.delivery_fee_override)
          : null,
      minOrderValue:
        r.min_order_value != null ? Number(r.min_order_value) : null,
      maxOrderValue:
        r.max_order_value != null ? Number(r.max_order_value) : null,
      supportsSameDay: toBool(r.supports_same_day),
      status: r.status,
      deleted: toBool(r.deleted),
      deletedAt: r.deleted_at ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });

  async list(filter: ListBranchServiceAreasFilter) {
    const where: WhereOptions = {};

    if (
      !(
        filter?.status === "all" &&
        filter?.branchId == null &&
        filter?.shippingZoneId == null
      )
    ) {
      (where as any).deleted = 0;
    }

    if (filter?.status && filter.status !== "all") {
      (where as any).status = filter.status;
    }

    if (filter?.branchId) {
      (where as any).branch_id = Number(filter.branchId);
    }

    if (filter?.shippingZoneId) {
      (where as any).shipping_zone_id = Number(filter.shippingZoneId);
    }

    if (filter?.q?.trim()) {
      const q = filter.q.trim();

      if (this.models.Branch && this.models.ShippingZone) {
        (where as any)[Op.or] = [
          { "$branch.name$": { [Op.like]: `%${q}%` } },
          { "$branch.code$": { [Op.like]: `%${q}%` } },
          { "$shippingZone.name$": { [Op.like]: `%${q}%` } },
          { "$shippingZone.code$": { [Op.like]: `%${q}%` } },
        ];
      }
    }

    const include: any[] = [];
    if (this.models.Branch) {
      include.push({
        model: this.models.Branch,
        as: "branch",
        required: false,
      });
    }

    if (this.models.ShippingZone) {
      include.push({
        model: this.models.ShippingZone,
        as: "shippingZone",
        required: false,
      });
    }

    const { rows, count } = await this.models.BranchServiceArea.findAndCountAll(
      {
        where,
        include,
        distinct: true,
        order: [["id", "DESC"]],
        limit: filter?.limit ?? 10,
        offset: filter?.offset ?? 0,
      },
    );

    return { rows: rows.map(this.mapRow), count };
  }

  async findById(id: number, includeDeleted = false) {
    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const row = await this.models.BranchServiceArea.findOne({ where });
    return row ? this.mapRow(row) : null;
  }

  async findByBranchAndZone(branchId: number, shippingZoneId: number) {
    const row = await this.models.BranchServiceArea.findOne({
      where: {
        branch_id: Number(branchId),
        shipping_zone_id: Number(shippingZoneId),
        deleted: 0,
      },
    });

    return row ? this.mapRow(row) : null;
  }

  async create(input: CreateBranchServiceAreaInput) {
    const row = await this.models.BranchServiceArea.create({
      branch_id: Number(input.branchId),
      shipping_zone_id: Number(input.shippingZoneId),
      delivery_fee_override:
        input.deliveryFeeOverride !== undefined
          ? input.deliveryFeeOverride
          : null,
      min_order_value:
        input.minOrderValue !== undefined ? input.minOrderValue : null,
      max_order_value:
        input.maxOrderValue !== undefined ? input.maxOrderValue : null,
      supports_same_day: input.supportsSameDay ?? true,
      status: input.status ?? "active",
      deleted: 0,
      deleted_at: null,
    });

    const found = await this.models.BranchServiceArea.findByPk(row.id);
    if (!found) {
      throw new Error("Branch service area not found after create");
    }

    return this.mapRow(found);
  }

  async update(id: number, patch: UpdateBranchServiceAreaPatch) {
    const values: any = {};

    if (patch.branchId !== undefined) values.branch_id = Number(patch.branchId);
    if (patch.shippingZoneId !== undefined) {
      values.shipping_zone_id = Number(patch.shippingZoneId);
    }
    if (patch.deliveryFeeOverride !== undefined) {
      values.delivery_fee_override = patch.deliveryFeeOverride ?? null;
    }
    if (patch.minOrderValue !== undefined) {
      values.min_order_value = patch.minOrderValue ?? null;
    }
    if (patch.maxOrderValue !== undefined) {
      values.max_order_value = patch.maxOrderValue ?? null;
    }
    if (patch.supportsSameDay !== undefined) {
      values.supports_same_day = patch.supportsSameDay;
    }
    if (patch.status !== undefined) {
      values.status = patch.status;
    }

    await this.models.BranchServiceArea.update(values, {
      where: { id, deleted: 0 },
    });

    const found = await this.models.BranchServiceArea.findByPk(id);
    if (!found) {
      throw new Error("Branch service area not found after update");
    }

    return this.mapRow(found);
  }

  async updateStatus(id: number, status: "active" | "inactive") {
    await this.models.BranchServiceArea.update(
      { status },
      { where: { id, deleted: 0 } },
    );

    const found = await this.models.BranchServiceArea.findByPk(id);
    if (!found) {
      throw new Error("Branch service area not found after updateStatus");
    }

    return this.mapRow(found);
  }

  async softDelete(id: number) {
    const now = new Date();

    await this.models.BranchServiceArea.update(
      { deleted: 1, deleted_at: now },
      { where: { id, deleted: 0 } },
    );

    return { id, deletedAt: now };
  }
}
