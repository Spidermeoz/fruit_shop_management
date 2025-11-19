import type { Order } from "./Order";
import type { OrderStatus, PaymentStatus } from "./types";

export interface OrderListFilter {
  page?: number;
  limit?: number;
  status?: string;
  userId?: number;
  q?: string;
}

export interface OrderRepository {
  updatePaymentStatus(orderId: number, arg1: string): unknown;
  create(data: {
    userId: number;
    items: {
      productId: number;
      quantity: number;
      price: number;
      title: string;
    }[];
    address: any;
    shippingFee: number;
    discountAmount: number;
    totalPrice: number;
    userInfo: any;
  }): Promise<Order>;

  findById(id: number): Promise<Order | null>;
  findByUser(
    id: number,
    filter: OrderListFilter
  ): Promise<{ rows: Order[]; count: number }>;

  updateStatus(id: number, status: OrderStatus): Promise<void>;

  addDeliveryHistory(
    orderId: number,
    status: string,
    location?: string,
    note?: string
  ): Promise<void>;

  addPayment(data: {
    orderId: number;
    provider: string;
    method: string;
    amount: number;
    status: PaymentStatus;
    transactionId?: string | null;
    rawPayload?: any;
  }): Promise<void>;

  findDistinctAddressesByUser(userId: number): Promise<
    {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string | null;
      ward?: string | null;
      district?: string | null;
      province?: string | null;
      postalCode?: string | null;
      notes?: string | null;
    }[]
  >;
}
