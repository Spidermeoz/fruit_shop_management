import { Op } from "sequelize";
import type {
  BranchDeliveryTimeSlotEntity,
  BranchDeliveryTimeSlotRepository,
  CreateBranchDeliveryTimeSlotPayload,
  ListBranchDeliveryTimeSlotsParams,
  UpdateBranchDeliveryTimeSlotPayload,
} from "../../domain/shipping/BranchDeliveryTimeSlotRepository";

export class SequelizeBranchDeliveryTimeSlotRepository implements BranchDeliveryTimeSlotRepository {
  constructor(private readonly models: any) {}

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
          }
        : null,
    };
  }

  private buildInclude() {
    return [
      {
        model: this.models.Branch,
        as: "branch",
        required: false,
        where: {
          deleted: 0,
        },
      },
      {
        model: this.models.DeliveryTimeSlot,
        as: "deliveryTimeSlot",
        required: false,
        where: {
          deleted: 0,
        },
      },
    ];
  }

  async list(params: ListBranchDeliveryTimeSlotsParams): Promise<{
    items: BranchDeliveryTimeSlotEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const keyword = String(params.keyword ?? "").trim();
    const status = String(params.status ?? "").trim();
    const branchId =
      params.branchId !== undefined && params.branchId !== null
        ? Number(params.branchId)
        : null;
    const deliveryTimeSlotId =
      params.deliveryTimeSlotId !== undefined &&
      params.deliveryTimeSlotId !== null
        ? Number(params.deliveryTimeSlotId)
        : null;

    const where: any = {
      deleted: 0,
    };

    if (status) {
      where.status = status;
    }

    if (branchId && Number.isInteger(branchId) && branchId > 0) {
      where.branch_id = branchId;
    }

    if (
      deliveryTimeSlotId &&
      Number.isInteger(deliveryTimeSlotId) &&
      deliveryTimeSlotId > 0
    ) {
      where.delivery_time_slot_id = deliveryTimeSlotId;
    }

    const include = this.buildInclude();

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
        include,
        distinct: true,
        order: [
          [{ model: this.models.Branch, as: "branch" }, "id", "ASC"],
          [
            { model: this.models.DeliveryTimeSlot, as: "deliveryTimeSlot" },
            "sort_order",
            "ASC",
          ],
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

  async findById(id: number): Promise<BranchDeliveryTimeSlotEntity | null> {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        id,
        deleted: 0,
      },
      include: this.buildInclude(),
    });

    return row ? this.mapRow(row) : null;
  }

  async findByBranchAndSlot(
    branchId: number,
    deliveryTimeSlotId: number,
  ): Promise<BranchDeliveryTimeSlotEntity | null> {
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
  ): Promise<BranchDeliveryTimeSlotEntity | null> {
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

  async create(
    payload: CreateBranchDeliveryTimeSlotPayload,
  ): Promise<BranchDeliveryTimeSlotEntity> {
    try {
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
        where: {
          id: row.id,
          deleted: 0,
        },
        include: this.buildInclude(),
      });

      if (!created) {
        throw new Error(
          "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh sau khi tạo.",
        );
      }

      return this.mapRow(created);
    } catch (error: any) {
      if (
        error?.name === "SequelizeUniqueConstraintError" ||
        error?.original?.code === "ER_DUP_ENTRY"
      ) {
        throw new Error("Khung giờ này đã được gán cho chi nhánh.");
      }
      throw error;
    }
  }

  async update(
    id: number,
    payload: UpdateBranchDeliveryTimeSlotPayload,
  ): Promise<BranchDeliveryTimeSlotEntity> {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    if (!row) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

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
      where: {
        id: row.id,
        deleted: 0,
      },
      include: this.buildInclude(),
    });

    if (!updated) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh sau khi cập nhật.",
      );
    }

    return this.mapRow(updated);
  }

  async revive(
    id: number,
    payload: UpdateBranchDeliveryTimeSlotPayload,
  ): Promise<BranchDeliveryTimeSlotEntity> {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        id,
        deleted: 1,
      },
    });

    if (!row) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh đã xóa để khôi phục.",
      );
    }

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
      where: {
        id: row.id,
        deleted: 0,
      },
      include: this.buildInclude(),
    });

    if (!revived) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh sau khi khôi phục.",
      );
    }

    return this.mapRow(revived);
  }

  async changeStatus(
    id: number,
    status: string,
  ): Promise<BranchDeliveryTimeSlotEntity> {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    if (!row) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    await row.update({
      status,
      updated_at: new Date(),
    });

    const updated = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        id: row.id,
        deleted: 0,
      },
      include: this.buildInclude(),
    });

    return this.mapRow(updated || row);
  }

  async softDelete(id: number): Promise<void> {
    const row = await this.models.BranchDeliveryTimeSlot.findOne({
      where: {
        id,
        deleted: 0,
      },
    });

    if (!row) {
      throw new Error(
        "Không tìm thấy cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    }

    await row.update({
      deleted: 1,
      deleted_at: new Date(),
      updated_at: new Date(),
    });
  }
}
