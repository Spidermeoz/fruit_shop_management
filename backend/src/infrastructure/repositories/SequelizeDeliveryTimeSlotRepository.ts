import type {
  BranchDeliverySlotCapacityEntity,
  BranchDeliveryTimeSlotEntity,
  DeliveryTimeSlotEntity,
  DeliveryTimeSlotRepository,
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

  async listActiveByBranch(branchId: number): Promise<
    Array<{
      slot: DeliveryTimeSlotEntity;
      branchSlot?: BranchDeliveryTimeSlotEntity | null;
    }>
  > {
    const rows = await this.models.BranchDeliveryTimeSlot.findAll({
      where: {
        branch_id: branchId,
        status: "active",
        deleted: 0,
      },
      include: [
        {
          model: this.models.DeliveryTimeSlot,
          as: "deliveryTimeSlot",
          where: {
            status: "active",
            deleted: 0,
          },
        },
      ],
      order: [
        [
          { model: this.models.DeliveryTimeSlot, as: "deliveryTimeSlot" },
          "sort_order",
          "ASC",
        ],
        [
          { model: this.models.DeliveryTimeSlot, as: "deliveryTimeSlot" },
          "id",
          "ASC",
        ],
      ],
    });

    return rows.map((row: any) => ({
      slot: this.mapSlot(row.deliveryTimeSlot),
      branchSlot: this.mapBranchSlot(row),
    }));
  }

  async findCapacity(
    branchId: number,
    deliveryDate: string,
    deliveryTimeSlotId: number,
  ): Promise<BranchDeliverySlotCapacityEntity | null> {
    const row = await this.models.BranchDeliverySlotCapacity.findOne({
      where: {
        branch_id: branchId,
        delivery_date: deliveryDate,
        delivery_time_slot_id: deliveryTimeSlotId,
        status: "active",
      },
    });

    return row ? this.mapCapacity(row) : null;
  }
}
