import type { Order } from "./Order";
import type { OrderStatus, PaymentStatus } from "./types";

export interface OrderListFilter {
  page?: number;
  limit?: number;
  status?: string;
  userId?: number;
  q?: string;
}

export interface OrderCreateItemInput {
  productId: number | null;
  productVariantId: number | null;
  quantity: number;
  price: number;
  title: string;
  variantTitle?: string | null;
  variantSku?: string | null;

  // optional richer snapshot fields
  variantLabel?: string | null;
  optionSummary?: string | null;
  thumbnail?: string | null;
}

export interface OrderRepository {
  updatePaymentStatus(
    orderId: number,
    status: string,
    transaction?: any,
  ): Promise<void>;

  create(
    data: {
      userId: number;
      items: OrderCreateItemInput[];
      address: any;
      shippingFee: number;
      discountAmount: number;
      totalPrice: number;
      finalPrice: number;
      userInfo: any;
    },
    transaction?: any,
  ): Promise<Order>;

  findById(id: number, transaction?: any): Promise<Order | null>;

  findByUser(
    id: number,
    filter: OrderListFilter,
  ): Promise<{ rows: Order[]; count: number }>;

  updateStatus(
    id: number,
    status: OrderStatus,
    transaction?: any,
    note?: string,
    location?: string,
  ): Promise<void>;

  addDeliveryHistory(
    orderId: number,
    status: string,
    location?: string,
    note?: string,
    transaction?: any,
  ): Promise<void>;

  addPayment(
    data: {
      orderId: number;
      provider: string;
      method: string;
      amount: number;
      status: PaymentStatus;
      transactionId?: string | null;
      rawPayload?: any;
    },
    transaction?: any,
  ): Promise<void>;

  startTransaction(): Promise<any>;

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
