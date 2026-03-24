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
  email?: string | null;
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
  productVariantId: number | null;
  productTitle: string;
  variantTitle?: string | null;
  variantSku?: string | null;

  // optional snapshot fields for richer variant display
  variantLabel?: string | null;
  optionSummary?: string | null;

  price: number;
  quantity: number;
  thumbnail?: string | null;
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
