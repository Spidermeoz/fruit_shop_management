import { Op } from "sequelize";
import type {
  BranchDeliveryTimeSlotBulkWriteResult,
  BranchDeliveryTimeSlotEntity,
  BranchDeliveryTimeSlotRepository,
  BulkUpsertBranchDeliveryTimeSlotItem,
  CopyBranchDeliveryTimeSlotsFromBranchInput,
  CreateBranchDeliveryTimeSlotPayload,
  ListBranchDeliveryTimeSlotsParams,
  UpdateBranchDeliveryTimeSlotPayload,
} from "../../domain/shipping/BranchDeliveryTimeSlotRepository";

export class SequelizeBranchDeliveryTimeSlotRepository implements BranchDeliveryTimeSlotRepository {
  constructor(private readonly models: any) {}

  private buildInclude() {
    const include: any[] = [];
    if (this.models.Branch)
      include.push({
        model: this.models.Branch,
        as: "branch",
        required: false,
        where: { deleted: 0 },
      });
    if (this.models.DeliveryTimeSlot)
      include.push({
        model: this.models.DeliveryTimeSlot,
        as: "deliveryTimeSlot",
        required: false,
        where: { deleted: 0 },
      });
    return include;
  }

  private mapRow(row: any): BranchDeliveryTimeSlotEntity {
    return {
      id: Number(row.id),
      branchId: Number(row.branch_id),
      deliveryTimeSlotId: Number(row.delivery_time_slot_id),
      maxOrdersOverride:
        row.max_orders_override !== null &&
        row.max_orders_override !== undefined
          ? Number(row.max_orders_override)
          : null,
      status: row.status,
      createdAt: row.created_at
        ? new Date(row.created_at).toISOString()
        : undefined,
      updatedAt: row.updated_at
        ? new Date(row.updated_at).toISOString()
        : undefined,
      branch: row.branch
        ? {
            id: Number(row.branch.id),
            name: row.branch.name,
            code: row.branch.code,
          }
        : null,
      deliveryTimeSlot: row.deliveryTimeSlot
        ? {
            id: Number(row.deliveryTimeSlot.id),
            code: row.deliveryTimeSlot.code,
            label: row.deliveryTimeSlot.label,
            startTime: row.deliveryTimeSlot.start_time,
            endTime: row.deliveryTimeSlot.end_time,
            maxOrders:
              row.deliveryTimeSlot.max_orders != null
                ? Number(row.deliveryTimeSlot.max_orders)
                : null,
            sortOrder:
              row.deliveryTimeSlot.sort_order != null
                ? Number(row.deliveryTimeSlot.sort_order)
                : undefined,
          }
        : null,
    };
  }

  async list(params: ListBranchDeliveryTimeSlotsParams) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const keyword = String(params.keyword ?? "").trim();
    const status = String(params.status ?? "").trim();
    const where: any = { deleted: 0 };
    if (status) where.status = status;
    if (params.branchId) where.branch_id = Number(params.branchId);
    if (params.deliveryTimeSlotId)
      where.delivery_time_slot_id = Number(params.deliveryTimeSlotId);
    if (keyword) {
      where[Op.or] = [
        { "$branch.name$": { [Op.like]: `%${keyword}%` } },
        { "$branch.code$": { [Op.like]: `%${keyword}%` } },
        { "$deliveryTimeSlot.code$": { [Op.like]: `%${keyword}%` } },
        { "$deliveryTimeSlot.label$": { [Op.like]: `%${keyword}%` } },
      ];
    }
    const { count, rows } =
      await this.models.BranchDeliveryTimeSlot.findAndCountAll({
        where,
        include: this.buildInclude(),
        distinct: true,
        order: [
          ["branch_id", "ASC"],
          ["delivery_time_slot_id", "ASC"],
          ["id", "ASC"],
        ],
        offset: (page - 1) * limit,
        limit,
      });
    return {
      items: rows.map((row: any) => this.mapRow(row)),
      pagination: {
        page,
        limit,
        totalItems: Number(count),
        totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
      },
    };
  }

  async findById(id: number) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
      include: this.buildInclude(),
    });
    return row ? this.mapRow(row) : null;
  }

  async findByIds(ids: number[]) {
    const uniqIds = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    if (!uniqIds.length) return [];
    const rows = await this.models.BranchDeliveryTimeSlot.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
      include: this.buildInclude(),
    });
    return rows.map((row: any) => this.mapRow(row));
  }

  async findByBranchIds(branchIds: number[]) {
    const uniqIds = [
      ...new Set(
        branchIds.map(Number).filter((x) => Number.isInteger(x) && x > 0),
      ),
    ];
    if (!uniqIds.length) return [];
    const rows = await this.models.BranchDeliveryTimeSlot.findAll({
      where: { branch_id: { [Op.in]: uniqIds }, deleted: 0 },
      include: this.buildInclude(),
    });
    return rows.map((row: any) => this.mapRow(row));
  }

  async findByBranchAndSlot(branchId: number, deliveryTimeSlotId: number) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        branch_id: branchId,
        delivery_time_slot_id: deliveryTimeSlotId,
        deleted: 0,
      },
      include: this.buildInclude(),
    });
    return row ? this.mapRow(row) : null;
  }

  async findDeletedByBranchAndSlot(
    branchId: number,
    deliveryTimeSlotId: number,
  ) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        branch_id: branchId,
        delivery_time_slot_id: deliveryTimeSlotId,
        deleted: 1,
      },
      include: this.buildInclude(),
      order: [["id", "DESC"]],
    });
    return row ? this.mapRow(row) : null;
  }

  async create(payload: CreateBranchDeliveryTimeSlotPayload) {
    const row = await this.models.BranchDeliveryTimeSlot.create({
      branch_id: payload.branchId,
      delivery_time_slot_id: payload.deliveryTimeSlotId,
      max_orders_override:
        payload.maxOrdersOverride !== undefined
          ? payload.maxOrdersOverride
          : null,
      status: payload.status,
      deleted: 0,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const created = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id: row.id, deleted: 0 },
      include: this.buildInclude(),
    });
    return this.mapRow(created || row);
  }

  async update(id: number, payload: UpdateBranchDeliveryTimeSlotPayload) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    if (!row)
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    await row.update({
      branch_id: payload.branchId,
      delivery_time_slot_id: payload.deliveryTimeSlotId,
      max_orders_override:
        payload.maxOrdersOverride !== undefined
          ? payload.maxOrdersOverride
          : null,
      status: payload.status,
      updated_at: new Date(),
    });
    const updated = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
      include: this.buildInclude(),
    });
    return this.mapRow(updated || row);
  }

  async revive(id: number, payload: UpdateBranchDeliveryTimeSlotPayload) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 1 },
    });
    if (!row)
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh đã xóa để khôi phục.",
      );
    await row.update({
      branch_id: payload.branchId,
      delivery_time_slot_id: payload.deliveryTimeSlotId,
      max_orders_override:
        payload.maxOrdersOverride !== undefined
          ? payload.maxOrdersOverride
          : null,
      status: payload.status,
      deleted: 0,
      deleted_at: null,
      updated_at: new Date(),
    });
    const revived = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
      include: this.buildInclude(),
    });
    return this.mapRow(revived || row);
  }

  async bulkUpsert(
    items: BulkUpsertBranchDeliveryTimeSlotItem[],
    mode: CopyBranchDeliveryTimeSlotsFromBranchInput["mode"] = "skip_existing",
  ): Promise<BranchDeliveryTimeSlotBulkWriteResult> {
    const result: BranchDeliveryTimeSlotBulkWriteResult = {
      created: [],
      updated: [],
      skipped: [],
      conflicts: [],
    };
    for (const item of items) {
      const status = item.status ?? "active";
      const existing = await this.findByBranchAndSlot(
        item.branchId,
        item.deliveryTimeSlotId,
      );
      if (existing) {
        if (mode === "skip_existing") {
          result.skipped.push({
            branchId: item.branchId,
            deliveryTimeSlotId: item.deliveryTimeSlotId,
            reason: "already_exists",
          });
          continue;
        }
        if (mode === "fail_on_conflict") {
          result.conflicts.push({
            branchId: item.branchId,
            deliveryTimeSlotId: item.deliveryTimeSlotId,
            reason: "already_exists",
          });
          continue;
        }
        result.updated.push(
          await this.update(existing.id, { ...item, status }),
        );
        continue;
      }
      const deleted = await this.findDeletedByBranchAndSlot(
        item.branchId,
        item.deliveryTimeSlotId,
      );
      if (deleted) {
        result.updated.push(await this.revive(deleted.id, { ...item, status }));
        continue;
      }
      result.created.push(await this.create({ ...item, status }));
    }
    return result;
  }

  async copyFromBranch(input: CopyBranchDeliveryTimeSlotsFromBranchInput) {
    const sourceRows = await this.findByBranchIds([input.sourceBranchId]);
    const items: BulkUpsertBranchDeliveryTimeSlotItem[] = [];
    for (const targetBranchId of input.targetBranchIds) {
      for (const row of sourceRows) {
        items.push({
          branchId: targetBranchId,
          deliveryTimeSlotId: row.deliveryTimeSlotId,
          maxOrdersOverride: row.maxOrdersOverride ?? null,
          status: input.statusOverride ?? row.status,
        });
      }
    }
    return this.bulkUpsert(items, input.mode);
  }

  async changeStatus(id: number, status: string) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    if (!row)
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    await row.update({ status, updated_at: new Date() });
    const updated = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
      include: this.buildInclude(),
    });
    return this.mapRow(updated || row);
  }

  async bulkChangeStatus(ids: number[], status: string) {
    const uniqIds: number[] = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    const found: any[] = await this.models.BranchDeliveryTimeSlot.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
    });

    const foundIds: Set<number> = new Set(
      found.map((row: any) => Number(row.id)),
    );

    for (const row of found) {
      await row.update({ status, updated_at: new Date() });
    }

    return {
      updatedIds: Array.from(foundIds),
      notFoundIds: uniqIds.filter((id) => !foundIds.has(id)),
    };
  }

  async softDelete(id: number) {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    if (!row)
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    await row.update({
      deleted: 1,
      deleted_at: new Date(),
      updated_at: new Date(),
    });
  }
}
