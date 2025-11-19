export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "partial"
  | "refunded"
  | "failed";

export interface OrderAddressProps {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}

export interface OrderItemProps {
  productId: number | null;
  productTitle: string;
  price: number;
  quantity: number;
}

export interface DeliveryHistoryProps {
  id: number;
  status: string;
  location?: string;
  note?: string;
  createdAt: Date;
}

export interface OrderProps {
  id?: number;
  userId: number;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  trackingToken: string;
  inventoryApplied: boolean;
  userInfo?: any | null;
  address?: OrderAddressProps | null;
  items: OrderItemProps[];
  deliveryHistory?: DeliveryHistoryProps[];
  createdAt?: Date;
}
