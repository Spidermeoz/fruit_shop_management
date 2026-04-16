import { Op } from "sequelize";
import type {
  BranchCapacityPlannerRow,
  BranchDeliverySlotCapacity,
  BranchDeliverySlotCapacityBulkWriteResult,
  BranchDeliverySlotCapacityRepository,
  BranchDeliverySlotCapacityStatus,
  BulkUpsertBranchDeliverySlotCapacityItem,
  BulkWriteMode,
  CopyBranchDeliverySlotCapacitiesFromDateInput,
  GenerateBranchDeliverySlotCapacitiesFromDefaultsInput,
  ListBranchDeliverySlotCapacitiesQuery,
} from "../../domain/shipping/BranchDeliverySlotCapacityRepository";

export class SequelizeBranchDeliverySlotCapacityRepository implements BranchDeliverySlotCapacityRepository {
  constructor(private readonly models: any) {}

  private mapRow(row: any): BranchDeliverySlotCapacity {
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
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  async findAll(query: ListBranchDeliverySlotCapacitiesQuery) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const keyword = String(query.keyword ?? "").trim();
    const where: any = { deleted: 0 };
    if (query.status) where.status = String(query.status).trim();
    if (query.branchId) where.branch_id = Number(query.branchId);
    if (query.deliveryTimeSlotId)
      where.delivery_time_slot_id = Number(query.deliveryTimeSlotId);
    if (query.deliveryDate)
      where.delivery_date = String(query.deliveryDate).trim();
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
    if (keyword) {
      where[Op.or] = [
        { delivery_date: { [Op.like]: `%${keyword}%` } },
        { "$branch.name$": { [Op.like]: `%${keyword}%` } },
        { "$branch.code$": { [Op.like]: `%${keyword}%` } },
        { "$deliveryTimeSlot.label$": { [Op.like]: `%${keyword}%` } },
        { "$deliveryTimeSlot.code$": { [Op.like]: `%${keyword}%` } },
      ];
    }
    const { rows, count } =
      await this.models.BranchDeliverySlotCapacity.findAndCountAll({
        where,
        include,
        distinct: true,
        order: [
          ["delivery_date", "DESC"],
          ["branch_id", "ASC"],
          ["delivery_time_slot_id", "ASC"],
          ["id", "DESC"],
        ],
        offset: (page - 1) * limit,
        limit,
      });
    return {
      items: rows.map((row: any) => this.mapRow(row)),
      total: Number(count),
    };
  }

  async findById(id: number) {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: { id, deleted: 0 },
    });
    return row ? this.mapRow(row) : null;
  }

  async findByIds(ids: number[]) {
    const uniqIds = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    if (!uniqIds.length) return [];
    const rows = await this.models.BranchDeliverySlotCapacity.findAll({
      where: { id: { [Op.in]: uniqIds }, deleted: 0 },
    });
    return rows.map((row: any) => this.mapRow(row));
  }

  async findByDate(date: string, branchIds?: number[]) {
    const where: any = { delivery_date: date, deleted: 0 };
    if (branchIds?.length)
      where.branch_id = { [Op.in]: [...new Set(branchIds.map(Number))] };
    const rows = await this.models.BranchDeliverySlotCapacity.findAll({
      where,
      order: [
        ["branch_id", "ASC"],
        ["delivery_time_slot_id", "ASC"],
      ],
    });
    return rows.map((row: any) => this.mapRow(row));
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    branchIds?: number[],
  ) {
    const where: any = {
      delivery_date: { [Op.between]: [startDate, endDate] },
      deleted: 0,
    };
    if (branchIds?.length)
      where.branch_id = { [Op.in]: [...new Set(branchIds.map(Number))] };
    const rows = await this.models.BranchDeliverySlotCapacity.findAll({
      where,
      order: [
        ["delivery_date", "ASC"],
        ["branch_id", "ASC"],
        ["delivery_time_slot_id", "ASC"],
      ],
    });
    return rows.map((row: any) => this.mapRow(row));
  }

  async findByUniqueKey(params: {
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
  }) {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: {
        branch_id: params.branchId,
        delivery_date: params.deliveryDate,
        delivery_time_slot_id: params.deliveryTimeSlotId,
        deleted: 0,
      },
    });
    return row ? this.mapRow(row) : null;
  }

  async findDeletedByUniqueKey(params: {
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
  }) {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: {
        branch_id: params.branchId,
        delivery_date: params.deliveryDate,
        delivery_time_slot_id: params.deliveryTimeSlotId,
        deleted: 1,
      },
      order: [["id", "DESC"]],
    });
    return row ? this.mapRow(row) : null;
  }

  async create(
    data: Omit<BranchDeliverySlotCapacity, "id" | "createdAt" | "updatedAt">,
  ) {
    const row = await this.models.BranchDeliverySlotCapacity.create({
      branch_id: data.branchId,
      delivery_date: data.deliveryDate,
      delivery_time_slot_id: data.deliveryTimeSlotId,
      max_orders: data.maxOrders ?? null,
      reserved_orders: data.reservedOrders ?? 0,
      status: data.status,
      deleted: 0,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.mapRow(row);
  }

  async update(id: number, data: Partial<BranchDeliverySlotCapacity>) {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Branch delivery slot capacity not found");
    await row.update({
      branch_id: data.branchId !== undefined ? data.branchId : row.branch_id,
      delivery_date:
        data.deliveryDate !== undefined ? data.deliveryDate : row.delivery_date,
      delivery_time_slot_id:
        data.deliveryTimeSlotId !== undefined
          ? data.deliveryTimeSlotId
          : row.delivery_time_slot_id,
      max_orders:
        data.maxOrders !== undefined ? data.maxOrders : row.max_orders,
      reserved_orders:
        data.reservedOrders !== undefined
          ? data.reservedOrders
          : row.reserved_orders,
      status: data.status !== undefined ? data.status : row.status,
      updated_at: new Date(),
    });
    return this.mapRow(row);
  }

  async revive(id: number, data: Partial<BranchDeliverySlotCapacity>) {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: { id, deleted: 1 },
    });
    if (!row)
      throw new Error("Branch delivery slot capacity deleted record not found");
    await row.update({
      branch_id: data.branchId !== undefined ? data.branchId : row.branch_id,
      delivery_date:
        data.deliveryDate !== undefined ? data.deliveryDate : row.delivery_date,
      delivery_time_slot_id:
        data.deliveryTimeSlotId !== undefined
          ? data.deliveryTimeSlotId
          : row.delivery_time_slot_id,
      max_orders:
        data.maxOrders !== undefined ? data.maxOrders : row.max_orders,
      reserved_orders:
        data.reservedOrders !== undefined
          ? data.reservedOrders
          : row.reserved_orders,
      status: data.status !== undefined ? data.status : row.status,
      deleted: 0,
      deleted_at: null,
      updated_at: new Date(),
    });
    return this.mapRow(row);
  }

  async bulkUpsert(
    items: BulkUpsertBranchDeliverySlotCapacityItem[],
    mode: BulkWriteMode = "skip_existing",
  ): Promise<BranchDeliverySlotCapacityBulkWriteResult> {
    const result: BranchDeliverySlotCapacityBulkWriteResult = {
      created: [],
      updated: [],
      skipped: [],
      conflicts: [],
    };
    for (const item of items) {
      const payload = {
        branchId: item.branchId,
        deliveryDate: item.deliveryDate,
        deliveryTimeSlotId: item.deliveryTimeSlotId,
        maxOrders: item.maxOrders ?? null,
        reservedOrders: item.reservedOrders ?? 0,
        status: item.status ?? "active",
      } as Omit<BranchDeliverySlotCapacity, "id" | "createdAt" | "updatedAt">;
      const existing = await this.findByUniqueKey(payload);
      if (existing) {
        if (mode === "skip_existing") {
          result.skipped.push({ ...payload, reason: "already_exists" });
          continue;
        }
        if (mode === "fail_on_conflict") {
          result.conflicts.push({ ...payload, reason: "already_exists" });
          continue;
        }
        result.updated.push(await this.update(existing.id, payload));
        continue;
      }
      const deleted = await this.findDeletedByUniqueKey(payload);
      if (deleted) {
        result.updated.push(await this.revive(deleted.id, payload));
        continue;
      }
      result.created.push(await this.create(payload));
    }
    return result;
  }

  async copyFromDate(input: CopyBranchDeliverySlotCapacitiesFromDateInput) {
    const sourceRows = await this.findByDate(input.sourceDate, input.branchIds);
    const items = sourceRows.map((row: any) => ({
      branchId: row.branchId,
      deliveryDate: input.targetDate,
      deliveryTimeSlotId: row.deliveryTimeSlotId,
      maxOrders: row.maxOrders ?? null,
      reservedOrders: 0,
      status: input.statusOverride ?? row.status,
    }));
    return this.bulkUpsert(items, input.mode);
  }

  async generateFromDefaults(
    input: GenerateBranchDeliverySlotCapacitiesFromDefaultsInput,
  ) {
    const branchWhere: any = { deleted: 0 };
    if (input.branchIds?.length)
      branchWhere.id = { [Op.in]: [...new Set(input.branchIds.map(Number))] };
    const branches = this.models.Branch
      ? await this.models.Branch.findAll({ where: branchWhere })
      : [];
    const branchIds = branches.map((row: any) => Number(row.id));
    const branchSlots = this.models.BranchDeliveryTimeSlot
      ? await this.models.BranchDeliveryTimeSlot.findAll({
          where: {
            branch_id: { [Op.in]: branchIds },
            deleted: 0,
            status: "active",
          },
        })
      : [];
    const slotIds = [
      ...new Set(
        branchSlots.map((row: any) => Number(row.delivery_time_slot_id)),
      ),
    ];
    const slots = this.models.DeliveryTimeSlot
      ? await this.models.DeliveryTimeSlot.findAll({
          where: { id: { [Op.in]: slotIds }, deleted: 0 },
        })
      : [];
    const slotMap = new Map<number, any>(
      slots.map((row: any) => [Number(row.id), row]),
    );

    const items: BulkUpsertBranchDeliverySlotCapacityItem[] = branchSlots.map(
      (row: any) => {
        const slot = slotMap.get(Number(row.delivery_time_slot_id));
        const branchOverride =
          row.max_orders_override !== null &&
          row.max_orders_override !== undefined
            ? Number(row.max_orders_override)
            : null;
        const slotMax =
          slot && slot.max_orders !== null && slot.max_orders !== undefined
            ? Number(slot.max_orders)
            : null;
        return {
          branchId: Number(row.branch_id),
          deliveryDate: input.deliveryDate,
          deliveryTimeSlotId: Number(row.delivery_time_slot_id),
          maxOrders: branchOverride !== null ? branchOverride : slotMax,
          reservedOrders: 0,
          status: input.status ?? row.status ?? "active",
        };
      },
    );

    return this.bulkUpsert(items, input.mode);
  }

  async getPlanner(
    deliveryDate: string,
    branchIds?: number[],
  ): Promise<BranchCapacityPlannerRow[]> {
    const capacities = await this.findByDate(deliveryDate, branchIds);
    const branchWhere: any = { deleted: 0 };
    if (branchIds?.length)
      branchWhere.id = { [Op.in]: [...new Set(branchIds.map(Number))] };
    const branches = this.models.Branch
      ? await this.models.Branch.findAll({ where: branchWhere })
      : [];
    const actualBranchIds = branchIds?.length
      ? [...new Set(branchIds.map(Number))]
      : branches.map((x: any) => Number(x.id));
    const branchSlots = this.models.BranchDeliveryTimeSlot
      ? await this.models.BranchDeliveryTimeSlot.findAll({
          where: { branch_id: { [Op.in]: actualBranchIds }, deleted: 0 },
        })
      : [];
    const slotIds = [
      ...new Set(
        branchSlots.map((row: any) => Number(row.delivery_time_slot_id)),
      ),
    ];
    const slots = this.models.DeliveryTimeSlot
      ? await this.models.DeliveryTimeSlot.findAll({
          where: { id: { [Op.in]: slotIds }, deleted: 0 },
        })
      : [];
    const slotMap = new Map<number, any>(
      slots.map((row: any) => [Number(row.id), row]),
    );
    const capMap = new Map<string, BranchDeliverySlotCapacity>(
      capacities.map((row: any) => [
        `${row.branchId}:${row.deliveryTimeSlotId}`,
        row,
      ]),
    );
    return branchSlots.map((row: any) => {
      const key = `${Number(row.branch_id)}:${Number(row.delivery_time_slot_id)}`;
      const cap = capMap.get(key);
      const slot = slotMap.get(Number(row.delivery_time_slot_id));
      return {
        branchId: Number(row.branch_id),
        deliveryTimeSlotId: Number(row.delivery_time_slot_id),
        deliveryDate,
        maxOrders: cap?.maxOrders ?? null,
        reservedOrders: cap?.reservedOrders ?? 0,
        status: (cap?.status ??
          row.status ??
          "active") as BranchDeliverySlotCapacityStatus,
        branchSlotMaxOrdersOverride:
          row.max_orders_override != null
            ? Number(row.max_orders_override)
            : null,
        slotMaxOrders:
          slot && slot.max_orders != null ? Number(slot.max_orders) : null,
      };
    });
  }

  async changeStatus(id: number, status: BranchDeliverySlotCapacityStatus) {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Branch delivery slot capacity not found");
    await row.update({ status, updated_at: new Date() });
  }

  async bulkChangeStatus(
    ids: number[],
    status: BranchDeliverySlotCapacityStatus,
  ) {
    const uniqIds: number[] = [
      ...new Set(ids.map(Number).filter((x) => Number.isInteger(x) && x > 0)),
    ];
    const found: any[] = await this.models.BranchDeliverySlotCapacity.findAll({
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
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: { id, deleted: 0 },
    });
    if (!row) throw new Error("Branch delivery slot capacity not found");
    await row.update({
      deleted: 1,
      deleted_at: new Date(),
      updated_at: new Date(),
    });
  }
}
