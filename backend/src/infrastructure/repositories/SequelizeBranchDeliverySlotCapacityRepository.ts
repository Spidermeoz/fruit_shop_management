import { Op } from "sequelize";
import type {
  BranchDeliverySlotCapacity,
  BranchDeliverySlotCapacityRepository,
  BranchDeliverySlotCapacityStatus,
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

  async findAll(query: ListBranchDeliverySlotCapacitiesQuery): Promise<{
    items: BranchDeliverySlotCapacity[];
    total: number;
  }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const keyword = String(query.keyword ?? "").trim();
    const status = String(query.status ?? "").trim();
    const branchId = query.branchId ? Number(query.branchId) : undefined;
    const deliveryTimeSlotId = query.deliveryTimeSlotId
      ? Number(query.deliveryTimeSlotId)
      : undefined;
    const deliveryDate = String(query.deliveryDate ?? "").trim();

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branch_id = branchId;
    }

    if (deliveryTimeSlotId) {
      where.delivery_time_slot_id = deliveryTimeSlotId;
    }

    if (deliveryDate) {
      where.delivery_date = deliveryDate;
    }

    const include: any[] = [];

    if (this.models.Branch) {
      include.push({
        model: this.models.Branch,
        as: "branch",
        required: false,
      });
    }

    if (this.models.DeliveryTimeSlot) {
      include.push({
        model: this.models.DeliveryTimeSlot,
        as: "deliveryTimeSlot",
        required: false,
      });
    }

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

  async findById(id: number): Promise<BranchDeliverySlotCapacity | null> {
    const row = await this.models.BranchDeliverySlotCapacity.findByPk(id);
    return row ? this.mapRow(row) : null;
  }

  async findByUniqueKey(params: {
    branchId: number;
    deliveryDate: string;
    deliveryTimeSlotId: number;
  }): Promise<BranchDeliverySlotCapacity | null> {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: {
        branch_id: params.branchId,
        delivery_date: params.deliveryDate,
        delivery_time_slot_id: params.deliveryTimeSlotId,
      },
    });

    return row ? this.mapRow(row) : null;
  }

  async create(
    data: Omit<BranchDeliverySlotCapacity, "id" | "createdAt" | "updatedAt">,
  ): Promise<BranchDeliverySlotCapacity> {
    const row = await this.models.BranchDeliverySlotCapacity.create({
      branch_id: data.branchId,
      delivery_date: data.deliveryDate,
      delivery_time_slot_id: data.deliveryTimeSlotId,
      max_orders: data.maxOrders ?? null,
      reserved_orders: data.reservedOrders ?? 0,
      status: data.status,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.mapRow(row);
  }

  async update(
    id: number,
    data: Partial<BranchDeliverySlotCapacity>,
  ): Promise<BranchDeliverySlotCapacity> {
    const row = await this.models.BranchDeliverySlotCapacity.findByPk(id);

    if (!row) {
      throw new Error("Branch delivery slot capacity not found");
    }

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

  async changeStatus(
    id: number,
    status: BranchDeliverySlotCapacityStatus,
  ): Promise<void> {
    const row = await this.models.BranchDeliverySlotCapacity.findByPk(id);

    if (!row) {
      throw new Error("Branch delivery slot capacity not found");
    }

    await row.update({
      status,
      updated_at: new Date(),
    });
  }

  async softDelete(id: number): Promise<void> {
    const row = await this.models.BranchDeliverySlotCapacity.findByPk(id);

    if (!row) {
      throw new Error("Branch delivery slot capacity not found");
    }

    await row.destroy();
  }
}
