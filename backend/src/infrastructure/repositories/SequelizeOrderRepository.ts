import { Op } from "sequelize";
import crypto from "crypto";
import { Order } from "../../domain/orders/Order";
import type {
  OrderRepository,
  OrderListFilter,
} from "../../domain/orders/OrderRepository";

export class SequelizeOrderRepository implements OrderRepository {
  constructor(private models: any) {}

  // ========================================
  // MAP ROW → DOMAIN ORDER ENTITY
  // ========================================
  private mapRow(row: any): Order {
    return Order.create({
      id: Number(row.id),
      userId: Number(row.user_id),
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

      address: row.address
        ? {
            fullName: row.address.full_name,
            phone: row.address.phone,
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
            productId: item.product_id,
            productTitle: item.product_title,
            price: Number(item.price),
            quantity: Number(item.quantity),
          }))
        : [],

      createdAt: row.created_at,
    });
  }

  // ========================================
  // CREATE ORDER (SUPPORT EXTERNAL TRANSACTION)
  // ========================================
  async create(data: any, transaction?: any) {
    const t = transaction ?? (await this.models.Order.sequelize.transaction());

    try {
      // Create main order
      const order = await this.models.Order.create(
        {
          user_id: data.userId,
          code: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: "pending",
          payment_status: "unpaid",
          shipping_fee: data.shippingFee,
          discount_amount: data.discountAmount,
          total_price: data.totalPrice,
          final_price: data.totalPrice,
          tracking_token: crypto.randomUUID(),
          inventory_applied: 0,
          user_info: data.userInfo,
        },
        { transaction: t }
      );

      // Create items
      for (const item of data.items) {
        await this.models.OrderItem.create(
          {
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            product_title: item.title,
          },
          { transaction: t }
        );
      }

      // Create address
      if (data.address) {
        await this.models.OrderAddress.create(
          {
            order_id: order.id,
            full_name: data.address.fullName,
            phone: data.address.phone,
            address_line1: data.address.addressLine1,
            address_line2: data.address.addressLine2 ?? "",
            ward: data.address.ward ?? "",
            district: data.address.district ?? "",
            province: data.address.province ?? "",
            postal_code: data.address.postalCode ?? "",
            notes: data.address.notes ?? "",
          },
          { transaction: t }
        );
      }

      // Reload full order with relations
      const full = await this.models.Order.findByPk(order.id, {
        include: [
          { model: this.models.OrderItem, as: "items" },
          { model: this.models.OrderAddress, as: "address" },
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

  // ========================================
  // FIND BY ID
  // ========================================
  async findById(id: number) {
    const row = await this.models.Order.findOne({
      where: { id, deleted: 0 },
      include: [
        { model: this.models.OrderItem, as: "items" },
        { model: this.models.OrderAddress, as: "address" },
        { model: this.models.Payment, as: "payments" },
        { model: this.models.DeliveryStatusHistory, as: "deliveryHistory" },
      ],
    });

    return row ? this.mapRow(row) : null;
  }

  // ========================================
  // FIND USER ORDERS
  // ========================================
  async findByUser(userId: number, filter: OrderListFilter) {
    const { page = 1, limit = 10 } = filter;

    const offset = (page - 1) * limit;

    const { rows, count } = await this.models.Order.findAndCountAll({
      where: { user_id: userId, deleted: 0 },
      include: [
        { model: this.models.OrderItem, as: "items" },
        { model: this.models.OrderAddress, as: "address" },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { rows: rows.map((r: any) => this.mapRow(r)), count };
  }

  // ========================================
  // ADMIN LIST
  // ========================================
  async list(filter: OrderListFilter) {
    const { page = 1, limit = 10, status, userId, q } = filter;

    const where: any = { deleted: 0 };

    if (status) where.status = status;
    if (userId) where.user_id = userId;

    if (q)
      where[Op.or] = [
        { code: { [Op.like]: `%${q}%` } },
        { tracking_token: { [Op.like]: `%${q}%` } },
      ];

    const offset = (page - 1) * limit;

    const { rows, count } = await this.models.Order.findAndCountAll({
      where,
      include: [
        { model: this.models.OrderItem, as: "items" },
        { model: this.models.OrderAddress, as: "address" },
        { model: this.models.Payment, as: "payments" },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { rows: rows.map((r: any) => this.mapRow(r)), count };
  }

  // ========================================
  // UPDATE STATUS
  // ========================================
  async updateStatus(id: number, status: string) {
    await this.models.Order.update({ status }, { where: { id } });
  }

  // ========================================
  // DELIVERY HISTORY
  // ========================================
  async addDeliveryHistory(
    orderId: number,
    status: string,
    location?: string,
    note?: string
  ) {
    await this.models.DeliveryStatusHistory.create({
      order_id: orderId,
      status,
      location,
      note,
    });
  }

  // ========================================
  // ADD PAYMENT
  // ========================================
  async updatePaymentStatus(orderId: number, status: string) {
    await this.models.Order.update(
      { payment_status: status },
      { where: { id: orderId } }
    );
  }

  // sửa hàm addPayment (không đổi field)
  async addPayment(data: {
    orderId: number;
    provider: string;
    method: string;
    amount: number;
    status: string;
    transactionId?: string | null;
    rawPayload?: any;
  }) {
    await this.models.Payment.create({
      order_id: data.orderId,
      provider: data.provider,
      method: data.method,
      amount: data.amount,
      status: data.status,
      transaction_id: data.transactionId ?? null,
      raw_payload: data.rawPayload ?? null,
    });
  }

  // ========================================
  // START TRANSACTION
  // ========================================
  async startTransaction() {
    return await this.models.Order.sequelize.transaction();
  }
}
