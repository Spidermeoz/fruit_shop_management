import { Op } from "sequelize";
import type {
  BranchDeliverySlotCapacityEntity,
  BranchDeliveryTimeSlotEntity,
  CreateDeliveryTimeSlotPayload,
  DeliveryTimeSlotEntity,
  DeliveryTimeSlotRepository,
  ListDeliveryTimeSlotsParams,
  UpdateDeliveryTimeSlotPayload,
} from "../../domain/shipping/DeliveryTimeSlotRepository";

export class SequelizeDeliveryTimeSlotRepository implements DeliveryTimeSlotRepository {
  constructor(private readonly models: any) {}

  private mapSlot(row: any): DeliveryTimeSlotEntity {
    return {
      id: Number(row.id),
      code: row.code,
      label: row.label,
      startTime: row.start_time,
      endTime: row.end_time,
      cutoffMinutes: Number(row.cutoff_minutes ?? 0),
      maxOrders:
        row.max_orders !== null && row.max_orders !== undefined
          ? Number(row.max_orders)
          : null,
      sortOrder: Number(row.sort_order ?? 0),
      status: row.status,
    };
  }

  private mapBranchSlot(row: any): BranchDeliveryTimeSlotEntity {
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
    };
  }

  private mapCapacity(row: any): BranchDeliverySlotCapacityEntity {
    return {
      id: Number(row.id),
      branchId: Number(row.branch_id),
      deliveryDate: row.delivery_date,
      deliveryTimeSlotId: Number(row.delivery_time_slot_id),
      maxOrders:
        row.max_orders !== null && row.max_orders !== undefined
          ? Number(row.max_orders)
          : null,
      reservedOrders: Number(row.reserved_orders ?? 0),
      status: row.status,
    };
  }

  async list(params: ListDeliveryTimeSlotsParams) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const keyword = String(params.keyword ?? "").trim();
    const status = String(params.status ?? "").trim();
    const where: any = { deleted: 0 };
    if (keyword) {
      where[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { label: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status) where.status = status;
    const { count, rows } = await this.models.DeliveryTimeSlot.findAndCountAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
      offset: (page - 1) * limit,
      limit,
    });
    return {
      items: rows.map((row: any) => this.mapSlot(row)),
      pagination: {
        page,
        limit,
        totalItems: Number(count),
        totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
      },
    };
  }

  async listByIds(ids: number[]) {
    const uniqIds = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    if (!uniqIds.length) return [];
    const rows = await this.models.DeliveryTimeSlot.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
    });
    return rows.map((row: any) => this.mapSlot(row));
  }

  async findById(id: number) {
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    return row ? this.mapSlot(row) : null;
  }

  async findByCode(code: string) {
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: {
        code: String(code ?? "")
          .trim()
          .toUpperCase(),
        deleted: 0,
      },
    });
    return row ? this.mapSlot(row) : null;
  }

  async findDeletedByCode(code: string) {
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: {
        code: String(code ?? "")
          .trim()
          .toUpperCase(),
        deleted: 1,
      },
      order: [["id", "DESC"]],
    });
    return row ? this.mapSlot(row) : null;
  }

  async create(payload: CreateDeliveryTimeSlotPayload) {
    const row = await this.models.DeliveryTimeSlot.create({
      code: String(payload.code).trim().toUpperCase(),
      label: payload.label,
      start_time: payload.startTime,
      end_time: payload.endTime,
      cutoff_minutes: payload.cutoffMinutes,
      max_orders: payload.maxOrders !== undefined ? payload.maxOrders : null,
      sort_order: payload.sortOrder,
      status: payload.status,
      deleted: 0,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.mapSlot(row);
  }

  async update(id: number, payload: UpdateDeliveryTimeSlotPayload) {
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Không tìm thấy khung giờ giao hàng.");
    await row.update({
      code: String(payload.code).trim().toUpperCase(),
      label: payload.label,
      start_time: payload.startTime,
      end_time: payload.endTime,
      cutoff_minutes: payload.cutoffMinutes,
      max_orders: payload.maxOrders !== undefined ? payload.maxOrders : null,
      sort_order: payload.sortOrder,
      status: payload.status,
      updated_at: new Date(),
    });
    return this.mapSlot(row);
  }

  async revive(id: number, payload: UpdateDeliveryTimeSlotPayload) {
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: { id, deleted: 1 },
    });
    if (!row)
      throw new Error(
        "Không tìm thấy khung giờ giao hàng đã xóa để khôi phục.",
      );
    await row.update({
      code: String(payload.code).trim().toUpperCase(),
      label: payload.label,
      start_time: payload.startTime,
      end_time: payload.endTime,
      cutoff_minutes: payload.cutoffMinutes,
      max_orders: payload.maxOrders !== undefined ? payload.maxOrders : null,
      sort_order: payload.sortOrder,
      status: payload.status,
      deleted: 0,
      deleted_at: null,
      updated_at: new Date(),
    });
    return this.mapSlot(row);
  }

  async changeStatus(id: number, status: string) {
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Không tìm thấy khung giờ giao hàng.");
    await row.update({ status, updated_at: new Date() });
    return this.mapSlot(row);
  }

  async bulkChangeStatus(ids: number[], status: string) {
    const uniqIds: number[] = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    const found: any[] = await this.models.DeliveryTimeSlot.findAll({
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
    const row = await this.models.DeliveryTimeSlot.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Không tìm thấy khung giờ giao hàng.");
    await row.update({
      deleted: 1,
      deleted_at: new Date(),
      updated_at: new Date(),
    });
  }

  async listActiveByBranch(branchId: number) {
    const branchSlots = this.models.BranchDeliveryTimeSlot
      ? await this.models.BranchDeliveryTimeSlot.findAll({
          where: { branch_id: branchId, status: "active", deleted: 0 },
          order: [["id", "ASC"]],
        })
      : [];

    const slotIds = branchSlots.map((row: any) =>
      Number(row.delivery_time_slot_id),
    );
    if (!slotIds.length) return [];
    const slots = await this.models.DeliveryTimeSlot.findAll({
      where: { id: { [Op.in]: slotIds }, status: "active", deleted: 0 },
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
    });
    const branchSlotMap = new Map<number, any>(
      branchSlots.map((row: any) => [Number(row.delivery_time_slot_id), row]),
    );
    return slots.map((slot: any) => ({
      slot: this.mapSlot(slot),
      branchSlot: branchSlotMap.has(Number(slot.id))
        ? this.mapBranchSlot(branchSlotMap.get(Number(slot.id)))
        : null,
    }));
  }

  async findCapacity(
    branchId: number,
    deliveryDate: string,
    deliveryTimeSlotId: number,
  ) {
    if (!this.models.BranchDeliverySlotCapacity) return null;
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: {
        branch_id: branchId,
        delivery_date: deliveryDate,
        delivery_time_slot_id: deliveryTimeSlotId,
        deleted: 0,
      },
    });
    return row ? this.mapCapacity(row) : null;
  }
}
