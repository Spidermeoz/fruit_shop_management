import { Op } from "sequelize";
import crypto from "crypto";
import { Order } from "../../domain/orders/Order";
import type {
  OrderRepository,
  OrderListFilter,
} from "../../domain/orders/OrderRepository";

export class SequelizeOrderRepository implements OrderRepository {
  constructor(private models: any) {}

  private mapRow(row: any): Order {
    return Order.create({
      id: Number(row.id),
      userId: Number(row.user_id),
      deliveryHistory: row.deliveryHistory
        ? row.deliveryHistory.map((h: any) => ({
            id: Number(h.id),
            status: h.status,
            location: h.location,
            note: h.note,
            createdAt: h.created_at ?? h.createdAt,
          }))
        : [],
      code: row.code,
      status: row.status,
      paymentStatus: row.payment_status,
      shippingFee: Number(row.shipping_fee),
      discountAmount: Number(row.discount_amount),
      totalPrice: Number(row.total_price),
      finalPrice: Number(row.final_price),
      trackingToken: row.tracking_token,
      inventoryApplied: !!row.inventory_applied,
      userInfo: row.user_info,
      branchId: Number(row.branch_id),
      fulfillmentType: row.fulfillment_type,
      branch: row.branch
        ? {
            id: Number(row.branch.id),
            name: row.branch.name,
            code: row.branch.code ?? null,
          }
        : null,
      address: row.address
        ? {
            fullName: row.address.full_name,
            phone: row.address.phone,
            email: row.address.email,
            addressLine1: row.address.address_line1,
            addressLine2: row.address.address_line2,
            ward: row.address.ward,
            district: row.address.district,
            province: row.address.province,
            postalCode: row.address.postal_code,
            notes: row.address.notes,
          }
        : null,
      items: row.items
        ? row.items.map((item: any) => ({
            id: Number(item.id),
            productId: item.product_id,
            slug: item.product?.slug ?? null,
            productVariantId: item.product_variant_id ?? null,
            productTitle: item.product_title,
            variantTitle: item.variant_title ?? null,
            variantSku: item.variant_sku ?? null,
            price: Number(item.price),
            quantity: Number(item.quantity),
            thumbnail: item.product?.thumbnail || null,
          }))
        : [],
      createdAt: row.created_at,
    });
  }

  async create(data: any, transaction?: any) {
    const t = transaction ?? (await this.models.Order.sequelize.transaction());

    try {
      const order = await this.models.Order.create(
        {
          user_id: data.userId,
          code: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: "pending",
          payment_status: "unpaid",
          shipping_fee: data.shippingFee,
          discount_amount: data.discountAmount,
          branch_id: data.branchId,
          fulfillment_type: data.fulfillmentType,
          final_price: data.finalPrice,
          total_price: data.totalPrice,
          tracking_token: crypto.randomUUID(),
          inventory_applied: 0,
          user_info: data.userInfo,
        },
        { transaction: t },
      );

      for (const item of data.items) {
        await this.models.OrderItem.create(
          {
            order_id: order.id,
            product_id: item.productId,
            product_variant_id: item.productVariantId,
            quantity: item.quantity,
            price: item.price,
            product_title: item.title,
            variant_title: item.variantTitle ?? null,
            variant_sku: item.variantSku ?? null,
          },
          { transaction: t },
        );
      }

      if (data.address) {
        await this.models.OrderAddress.create(
          {
            order_id: order.id,
            full_name: data.address.fullName,
            phone: data.address.phone,
            email: data.address.email ?? null,
            address_line1: data.address.addressLine1,
            address_line2: data.address.addressLine2 ?? "",
            ward: data.address.ward ?? "",
            district: data.address.district ?? "",
            province: data.address.province ?? "",
            postal_code: data.address.postalCode ?? "",
            notes: data.address.notes ?? "",
          },
          { transaction: t },
        );
      }

      await this.models.DeliveryStatusHistory.create(
        {
          order_id: order.id,
          status: "pending",
          note: "Order created",
        },
        { transaction: t },
      );

      const full = await this.models.Order.findByPk(order.id, {
        include: [
          {
            model: this.models.OrderItem,
            as: "items",
            include: [
              {
                model: this.models.Product,
                as: "product",
                attributes: ["thumbnail", "slug"],
              },
            ],
          },
          { model: this.models.OrderAddress, as: "address" },
          { model: this.models.DeliveryStatusHistory, as: "deliveryHistory" },
          {
            model: this.models.Branch,
            as: "branch",
            attributes: ["id", "name", "code"],
          },
        ],
        transaction: t,
      });

      if (!transaction) await t.commit();

      return this.mapRow(full);
    } catch (err) {
      if (!transaction) await t.rollback();
      throw err;
    }
  }

  async findById(id: number, transaction?: any) {
    const row = await this.models.Order.findOne({
      where: { id, deleted: 0 },
      include: [
        {
          model: this.models.OrderItem,
          as: "items",
          include: [
            {
              model: this.models.Product,
              as: "product",
              attributes: ["thumbnail", "slug"],
            },
          ],
        },
        { model: this.models.OrderAddress, as: "address" },
        { model: this.models.Payment, as: "payments" },
        { model: this.models.DeliveryStatusHistory, as: "deliveryHistory" },
        {
          model: this.models.Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      transaction,
    });

    return row ? this.mapRow(row) : null;
  }

  async findByUser(userId: number, filter: OrderListFilter) {
    const { page = 1, limit = 10 } = filter;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.models.Order.findAndCountAll({
      where: { user_id: userId, deleted: 0 },
      include: [
        {
          model: this.models.OrderItem,
          as: "items",
          include: [
            {
              model: this.models.Product,
              as: "product",
              attributes: ["thumbnail", "slug"],
            },
          ],
        },
        { model: this.models.OrderAddress, as: "address" },
        { model: this.models.DeliveryStatusHistory, as: "deliveryHistory" },
        {
          model: this.models.Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { rows: rows.map((r: any) => this.mapRow(r)), count };
  }

  async list(filter: OrderListFilter) {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      q,
      branchId,
      allowedBranchIds,
      fulfillmentType,
    } = filter as any;

    const where: any = { deleted: 0 };

    if (status) where.status = status;
    if (userId) where.user_id = userId;
    if (branchId) where.branch_id = branchId;
    if (fulfillmentType) where.fulfillment_type = fulfillmentType;

    if (Array.isArray(allowedBranchIds) && allowedBranchIds.length > 0) {
      where.branch_id = {
        ...(where.branch_id && typeof where.branch_id === "object"
          ? where.branch_id
          : {}),
        [Op.in]: allowedBranchIds,
      };
      if (branchId) {
        where.branch_id = {
          [Op.in]: allowedBranchIds.filter((x: number) => x === branchId),
        };
      }
    }

    if (q) {
      where[Op.or] = [
        { code: { [Op.like]: `%${q}%` } },
        { tracking_token: { [Op.like]: `%${q}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await this.models.Order.findAndCountAll({
      where,
      include: [
        { model: this.models.OrderItem, as: "items" },
        { model: this.models.OrderAddress, as: "address" },
        { model: this.models.Payment, as: "payments" },
        {
          model: this.models.Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { rows: rows.map((r: any) => this.mapRow(r)), count };
  }

  async findDistinctAddressesByUser(userId: number) {
    const rows = await this.models.OrderAddress.findAll({
      raw: true,
      include: [
        {
          model: this.models.Order,
          as: "order",
          where: { user_id: userId, deleted: 0 },
        },
      ],
    });

    const unique = new Map<string, any>();

    for (const r of rows) {
      const key = [
        r.full_name,
        r.phone,
        r.email,
        r.address_line1,
        r.ward,
        r.district,
        r.province,
      ].join("|");

      if (!unique.has(key)) {
        unique.set(key, {
          fullName: r.full_name,
          phone: r.phone,
          email: r.email,
          addressLine1: r.address_line1,
          addressLine2: r.address_line2,
          ward: r.ward,
          district: r.district,
          province: r.province,
          postalCode: r.postal_code,
          notes: r.notes,
        });
      }
    }

    return Array.from(unique.values());
  }

  async updateStatus(
    id: number,
    status: string,
    transaction?: any,
    note?: string,
    location?: string,
  ) {
    await this.models.Order.update(
      { status },
      {
        where: { id, deleted: 0 },
        transaction,
      },
    );

    await this.models.DeliveryStatusHistory.create(
      {
        order_id: id,
        status,
        location: location ?? null,
        note: note ?? `Status changed to ${status}`,
      },
      { transaction },
    );
  }

  async addDeliveryHistory(
    orderId: number,
    status: string,
    location?: string,
    note?: string,
    transaction?: any,
  ) {
    await this.models.DeliveryStatusHistory.create(
      {
        order_id: orderId,
        status,
        location,
        note,
      },
      { transaction },
    );
  }

  async updatePaymentStatus(
    orderId: number,
    status: string,
    transaction?: any,
  ) {
    await this.models.Order.update(
      { payment_status: status },
      { where: { id: orderId }, transaction },
    );
  }

  async addPayment(
    data: {
      orderId: number;
      provider: string;
      method: string;
      amount: number;
      status: string;
      transactionId?: string | null;
      rawPayload?: any;
    },
    transaction?: any,
  ) {
    await this.models.Payment.create(
      {
        order_id: data.orderId,
        provider: data.provider,
        method: data.method,
        amount: data.amount,
        status: data.status,
        transaction_id: data.transactionId ?? null,
        raw_payload: data.rawPayload ?? null,
      },
      { transaction },
    );
  }

  async startTransaction() {
    return this.models.Order.sequelize.transaction();
  }
}
