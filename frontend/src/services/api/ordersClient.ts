import { ApiError, http } from "../http";
import type { CheckoutQuote, ClientOrder } from "../../types/orders";
import { mapClientOrder } from "../../utils/mapOrder";

export class CheckoutQuoteChangedError extends Error {
  code: string;
  payload: any;

  constructor(message: string, payload: any) {
    super(message);
    this.name = "CheckoutQuoteChangedError";
    this.code = "CHECKOUT_QUOTE_CHANGED";
    this.payload = payload;
  }
}

export interface ClientBranch {
  id: number;
  name: string;
  code?: string | null;
  status?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  addressLine1?: string | null;
  district?: string | null;
  province?: string | null;
}

export interface CheckoutQuotePayload {
  productVariantIds: number[];
  branchId?: number | null;
  fulfillmentType: "pickup" | "delivery";
  deliveryType?: "standard" | "same_day" | "scheduled";
  deliveryDate?: string | null;
  deliveryTimeSlotId?: number | null;
  address?: {
    fullName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    ward?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    notes?: string;
  } | null;
  promotionCode?: string | null;
}

export interface CheckoutPayload extends CheckoutQuotePayload {
  deliveryNote?: string | null;
  paymentMethod?: string;
  expectedQuoteMeta?: {
    fingerprint?: string | null;
    finalPrice?: number | null;
    shippingFee?: number | null;
    discountAmount?: number | null;
    shippingDiscountAmount?: number | null;
  } | null;
}

export async function getClientBranches(): Promise<ClientBranch[]> {
  const res = await http("GET", "/api/v1/client/orders/branches");

  if (!res?.success) {
    throw new Error(res?.message || "Không tải được danh sách chi nhánh");
  }

  return Array.isArray(res.data)
    ? res.data.map((b: any) => ({
        id: Number(b.id),
        name: b.name,
        code: b.code ?? null,
        status: b.status ?? null,
        supportsPickup: !!b.supportsPickup,
        supportsDelivery: !!b.supportsDelivery,
        addressLine1: b.addressLine1 ?? null,
        district: b.district ?? null,
        province: b.province ?? null,
      }))
    : [];
}

export async function getCheckoutQuote(
  payload: CheckoutQuotePayload,
): Promise<CheckoutQuote> {
  const res = await http<any>("POST", "/api/v1/client/orders/quote", payload);

  if (!res?.success) {
    throw new Error(res?.message || "Không lấy được báo giá đơn hàng");
  }

  return {
    subtotal: Number(res.data?.subtotal ?? 0),
    shippingFee: Number(res.data?.shippingFee ?? 0),
    discountAmount: Number(res.data?.discountAmount ?? 0),
    shippingDiscountAmount: Number(res.data?.shippingDiscountAmount ?? 0),
    finalPrice: Number(res.data?.finalPrice ?? 0),
    promotionCode: res.data?.promotionCode ?? null,
    appliedPromotions: Array.isArray(res.data?.appliedPromotions)
      ? res.data.appliedPromotions.map((item: any) => ({
          promotionId: Number(item.promotionId),
          promotionName: item.promotionName ?? "",
          promotionScope: item.promotionScope ?? "order",
          discountType: item.discountType ?? "fixed",
          discountValue: Number(item.discountValue ?? 0),
          promotionCodeId:
            item.promotionCodeId !== undefined && item.promotionCodeId !== null
              ? Number(item.promotionCodeId)
              : null,
          promotionCode: item.promotionCode ?? null,
          discountAmount: Number(item.discountAmount ?? 0),
          shippingDiscountAmount: Number(item.shippingDiscountAmount ?? 0),
          affectedProductIds: Array.isArray(item.affectedProductIds)
            ? item.affectedProductIds.map((x: any) => Number(x))
            : [],
          affectedVariantIds: Array.isArray(item.affectedVariantIds)
            ? item.affectedVariantIds.map((x: any) => Number(x))
            : [],
          affectedCategoryIds: Array.isArray(item.affectedCategoryIds)
            ? item.affectedCategoryIds.map((x: any) => Number(x))
            : [],
          affectedOriginIds: Array.isArray(item.affectedOriginIds)
            ? item.affectedOriginIds.map((x: any) => Number(x))
            : [],
        }))
      : [],
    promotionSnapshotJson: res.data?.promotionSnapshotJson ?? null,
    promotionMessages: Array.isArray(res.data?.promotionMessages)
      ? res.data.promotionMessages
      : [],
    shippingZone: res.data?.shippingZone
      ? {
          id: Number(res.data.shippingZone.id),
          code: res.data.shippingZone.code ?? null,
          name: res.data.shippingZone.name ?? null,
        }
      : null,
    availableSlots: Array.isArray(res.data?.availableSlots)
      ? res.data.availableSlots.map((slot: any) => ({
          id: Number(slot.id),
          code: slot.code ?? null,
          label: slot.label ?? null,
          startTime: slot.startTime ?? null,
          endTime: slot.endTime ?? null,
          cutoffMinutes:
            slot.cutoffMinutes !== undefined && slot.cutoffMinutes !== null
              ? Number(slot.cutoffMinutes)
              : null,
          isAvailable: !!slot.isAvailable,
          remainingCapacity:
            slot.remainingCapacity !== undefined &&
            slot.remainingCapacity !== null
              ? Number(slot.remainingCapacity)
              : null,
          reason: slot.reason ?? null,
        }))
      : [],
    selectedSlot: res.data?.selectedSlot
      ? {
          id: Number(res.data.selectedSlot.id),
          label: res.data.selectedSlot.label ?? null,
        }
      : null,
    selectedBranch: res.data?.selectedBranch
      ? {
          id: Number(res.data.selectedBranch.id),
          name: res.data.selectedBranch.name ?? "",
          code: res.data.selectedBranch.code ?? null,
          addressLine1: res.data.selectedBranch.addressLine1 ?? null,
          district: res.data.selectedBranch.district ?? null,
          province: res.data.selectedBranch.province ?? null,
          supportsPickup: !!res.data.selectedBranch.supportsPickup,
          supportsDelivery: !!res.data.selectedBranch.supportsDelivery,
        }
      : null,
    candidateBranches: Array.isArray(res.data?.candidateBranches)
      ? res.data.candidateBranches.map((branch: any) => ({
          id: Number(branch.id),
          name: branch.name ?? "",
          code: branch.code ?? null,
          addressLine1: branch.addressLine1 ?? null,
          district: branch.district ?? null,
          province: branch.province ?? null,
          supportsPickup: !!branch.supportsPickup,
          supportsDelivery: !!branch.supportsDelivery,
        }))
      : [],
    requiresBranchSelection: !!res.data?.requiresBranchSelection,
    quoteMeta: res.data?.quoteMeta?.fingerprint
      ? {
          fingerprint: String(res.data.quoteMeta.fingerprint),
          computedAt: String(res.data.quoteMeta.computedAt ?? ""),
          expiresAt: res.data.quoteMeta.expiresAt ?? null,
          consistencyVersion: Number(
            res.data.quoteMeta.consistencyVersion ?? 1,
          ),
        }
      : null,
  };
}

export async function checkoutOrder(payload: CheckoutPayload): Promise<any> {
  try {
    const res = await http<any>(
      "POST",
      "/api/v1/client/orders/checkout",
      payload,
    );

    if (!res?.success) {
      throw new Error(res?.message || "Đặt hàng thất bại");
    }

    return res.data;
  } catch (err: any) {
    if (err instanceof ApiError && err.code === "CHECKOUT_QUOTE_CHANGED") {
      throw new CheckoutQuoteChangedError(
        err.message || "Giá đơn hàng vừa được cập nhật",
        err.data ?? null,
      );
    }

    throw err instanceof Error ? err : new Error("Đặt hàng thất bại");
  }
}

export async function getMyOrders(
  page = 1,
  limit = 10,
): Promise<{
  rows: ClientOrder[];
  total: number;
  page: number;
  limit: number;
}> {
  const res = await http(
    "GET",
    `/api/v1/client/orders?page=${page}&limit=${limit}`,
  );

  if (!res?.success) {
    throw new Error(res?.message || "Không tải được danh sách đơn hàng");
  }

  return {
    rows: Array.isArray(res.data) ? res.data.map(mapClientOrder) : [],
    total: Number(res.meta?.total ?? 0),
    page: Number(res.meta?.page ?? page),
    limit: Number(res.meta?.limit ?? limit),
  };
}

export async function getMyOrderDetail(id: number): Promise<ClientOrder> {
  const res = await http("GET", `/api/v1/client/orders/${id}`);

  if (!res?.success) {
    throw new Error(res?.message || "Không tải được chi tiết đơn hàng");
  }

  return mapClientOrder(res.data);
}

export async function cancelMyOrder(id: number): Promise<ClientOrder> {
  const res = await http("POST", `/api/v1/client/orders/${id}/cancel`);

  if (!res?.success) {
    throw new Error(res?.message || "Hủy đơn hàng thất bại");
  }

  return mapClientOrder(res.data);
}
