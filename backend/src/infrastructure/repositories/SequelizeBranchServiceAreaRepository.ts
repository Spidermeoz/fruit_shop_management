import { Op, WhereOptions } from "sequelize";
import { BranchServiceArea } from "../../domain/shipping/BranchServiceArea";
import type {
  BranchServiceAreaRepository,
  BranchServiceAreaBulkWriteResult,
} from "../../domain/shipping/BranchServiceAreaRepository";
import type {
  BulkChangeBranchServiceAreaStatusInput,
  BulkUpsertBranchServiceAreaItem,
  CopyBranchServiceAreasFromBranchInput,
  CreateBranchServiceAreaInput,
  ListBranchServiceAreasFilter,
  UpdateBranchServiceAreaPatch,
} from "../../domain/shipping/branchServiceArea.types";

type Models = { BranchServiceArea: any; Branch?: any; ShippingZone?: any };
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
    const where: WhereOptions = { deleted: 0 };
    if (filter?.status && filter.status !== "all")
      (where as any).status = filter.status;
    if (filter?.branchId) (where as any).branch_id = Number(filter.branchId);
    if (filter?.shippingZoneId)
      (where as any).shipping_zone_id = Number(filter.shippingZoneId);
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
    if (this.models.Branch)
      include.push({
        model: this.models.Branch,
        as: "branch",
        required: false,
        where: { deleted: 0 },
      });
    if (this.models.ShippingZone)
      include.push({
        model: this.models.ShippingZone,
        as: "shippingZone",
        required: false,
        where: { deleted: 0 },
      });
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

  async findByIds(ids: number[]) {
    const uniqIds = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    if (!uniqIds.length) return [];
    const rows = await this.models.BranchServiceArea.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
    });
    return rows.map(this.mapRow);
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

  async findDeletedByBranchAndZone(branchId: number, shippingZoneId: number) {
    const row = await this.models.BranchServiceArea.findOne({
      where: {
        branch_id: Number(branchId),
        shipping_zone_id: Number(shippingZoneId),
        deleted: 1,
      },
      order: [["id", "DESC"]],
    });
    return row ? this.mapRow(row) : null;
  }

  async findByBranchIds(branchIds: number[]) {
    const uniqIds = [
      ...new Set(
        branchIds.map(Number).filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    if (!uniqIds.length) return [];
    const rows = await this.models.BranchServiceArea.findAll({
      where: { branch_id: { [Op.in]: uniqIds }, deleted: 0 },
    });
    return rows.map(this.mapRow);
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
    return this.mapRow(row);
  }

  async update(id: number, patch: UpdateBranchServiceAreaPatch) {
    const row = await this.models.BranchServiceArea.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    await row.update({
      branch_id:
        patch.branchId !== undefined ? Number(patch.branchId) : row.branch_id,
      shipping_zone_id:
        patch.shippingZoneId !== undefined
          ? Number(patch.shippingZoneId)
          : row.shipping_zone_id,
      delivery_fee_override:
        patch.deliveryFeeOverride !== undefined
          ? patch.deliveryFeeOverride
          : row.delivery_fee_override,
      min_order_value:
        patch.minOrderValue !== undefined
          ? patch.minOrderValue
          : row.min_order_value,
      max_order_value:
        patch.maxOrderValue !== undefined
          ? patch.maxOrderValue
          : row.max_order_value,
      supports_same_day:
        patch.supportsSameDay !== undefined
          ? patch.supportsSameDay
          : row.supports_same_day,
      status: patch.status !== undefined ? patch.status : row.status,
      updated_at: new Date(),
    });
    return this.mapRow(row);
  }

  async revive(id: number, patch: UpdateBranchServiceAreaPatch) {
    const row = await this.models.BranchServiceArea.findOne({
      where: { id, deleted: 1 },
    });
    if (!row)
      throw new Error(
        "Không tìm thấy cấu hình vùng phục vụ đã xóa để khôi phục",
      );
    await row.update({
      branch_id:
        patch.branchId !== undefined ? Number(patch.branchId) : row.branch_id,
      shipping_zone_id:
        patch.shippingZoneId !== undefined
          ? Number(patch.shippingZoneId)
          : row.shipping_zone_id,
      delivery_fee_override:
        patch.deliveryFeeOverride !== undefined
          ? patch.deliveryFeeOverride
          : row.delivery_fee_override,
      min_order_value:
        patch.minOrderValue !== undefined
          ? patch.minOrderValue
          : row.min_order_value,
      max_order_value:
        patch.maxOrderValue !== undefined
          ? patch.maxOrderValue
          : row.max_order_value,
      supports_same_day:
        patch.supportsSameDay !== undefined
          ? patch.supportsSameDay
          : row.supports_same_day,
      status: patch.status !== undefined ? patch.status : row.status,
      deleted: 0,
      deleted_at: null,
      updated_at: new Date(),
    });
    return this.mapRow(row);
  }

  async bulkUpsert(
    items: BulkUpsertBranchServiceAreaItem[],
    mode: CopyBranchServiceAreasFromBranchInput["mode"] = "skip_existing",
  ): Promise<BranchServiceAreaBulkWriteResult> {
    const result: BranchServiceAreaBulkWriteResult = {
      created: [],
      updated: [],
      skipped: [],
      conflicts: [],
    };
    for (const item of items) {
      const existing = await this.findByBranchAndZone(
        item.branchId,
        item.shippingZoneId,
      );
      if (existing) {
        if (mode === "skip_existing") {
          result.skipped.push({
            branchId: item.branchId,
            shippingZoneId: item.shippingZoneId,
            reason: "already_exists",
          });
          continue;
        }
        if (mode === "fail_on_conflict") {
          result.conflicts.push({
            branchId: item.branchId,
            shippingZoneId: item.shippingZoneId,
            reason: "already_exists",
          });
          continue;
        }
        result.updated.push(await this.update(existing.props.id!, item));
        continue;
      }
      const deleted = await this.findDeletedByBranchAndZone(
        item.branchId,
        item.shippingZoneId,
      );
      if (deleted) {
        result.updated.push(await this.revive(deleted.props.id!, item));
        continue;
      }
      result.created.push(await this.create(item));
    }
    return result;
  }

  async copyFromBranch(input: CopyBranchServiceAreasFromBranchInput) {
    const sourceRows = await this.findByBranchIds([input.sourceBranchId]);
    const items: BulkUpsertBranchServiceAreaItem[] = [];
    for (const targetBranchId of input.targetBranchIds) {
      for (const row of sourceRows) {
        items.push({
          branchId: targetBranchId,
          shippingZoneId: row.props.shippingZoneId,
          deliveryFeeOverride: row.props.deliveryFeeOverride ?? null,
          minOrderValue: row.props.minOrderValue ?? null,
          maxOrderValue: row.props.maxOrderValue ?? null,
          supportsSameDay: row.props.supportsSameDay,
          status: input.statusOverride ?? row.props.status,
        });
      }
    }
    return this.bulkUpsert(items, input.mode);
  }

  async updateStatus(id: number, status: "active" | "inactive") {
    const row = await this.models.BranchServiceArea.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    await row.update({ status, updated_at: new Date() });
    return this.mapRow(row);
  }

  async bulkUpdateStatus(input: BulkChangeBranchServiceAreaStatusInput) {
    const uniqIds: number[] = [
      ...new Set(
        input.ids.map(Number).filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];

    const found: any[] = await this.models.BranchServiceArea.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
    });

    const foundIds: Set<number> = new Set(
      found.map((row: any) => Number(row.id)),
    );

    for (const row of found) {
      await row.update({ status: input.status, updated_at: new Date() });
    }

    return {
      updatedIds: Array.from(foundIds),
      notFoundIds: uniqIds.filter((id) => !foundIds.has(id)),
    };
  }

  async softDelete(id: number) {
    const now = new Date();
    const row = await this.models.BranchServiceArea.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    await row.update({ deleted: 1, deleted_at: now, updated_at: now });
    return { id, deletedAt: now };
  }
}
