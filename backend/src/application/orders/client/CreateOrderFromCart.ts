import type { CreateNotification } from "../../notifications/usecases/CreateNotification";

const normalizeDateOnly = (value?: string | null): string | null => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (!v) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

const roundMoney = (value: unknown): number =>
  Math.max(0, Math.round(Number(value ?? 0) * 100) / 100);

const stableStringify = (value: any): string => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const buildQuoteFingerprint = (input: {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  finalPrice: number;
  fulfillmentType?: string | null;
  deliveryType?: string | null;
  deliveryDate?: string | null;
  selectedBranchId?: number | null;
  selectedSlotId?: number | null;
  shippingZoneId?: number | null;
  promotionCode?: string | null;
  productVariantIds?: number[];
}) => {
  return stableStringify({
    subtotal: roundMoney(input.subtotal),
    shippingFee: roundMoney(input.shippingFee),
    discountAmount: roundMoney(input.discountAmount),
    shippingDiscountAmount: roundMoney(input.shippingDiscountAmount),
    finalPrice: roundMoney(input.finalPrice),
    fulfillmentType: input.fulfillmentType ?? null,
    deliveryType: input.deliveryType ?? null,
    deliveryDate: input.deliveryDate ?? null,
    selectedBranchId: input.selectedBranchId ?? null,
    selectedSlotId: input.selectedSlotId ?? null,
    shippingZoneId: input.shippingZoneId ?? null,
    promotionCode: input.promotionCode ?? null,
    productVariantIds: Array.isArray(input.productVariantIds)
      ? [...input.productVariantIds].map(Number).sort((a, b) => a - b)
      : [],
  });
};

export class CreateOrderFromCart {
  constructor(
    private readonly orderRepo: any,
    private readonly cartRepo: any,
    private readonly productRepo: any,
    private readonly inventoryRepo: any,
    private readonly calculateShippingQuoteService: any,
    private readonly evaluatePromotionService: any,
    private readonly validatePromotionCodeService: any,
    private readonly promotionRepo: any,
    private readonly createNotification?: CreateNotification,
  ) {}

  async execute(userId: number, payload: any) {
    const {
      productVariantIds,
      address,
      branchId: rawBranchId,
      fulfillmentType: rawFulfillmentType,
      deliveryType: rawDeliveryType,
      deliveryDate: rawDeliveryDate,
      deliveryTimeSlotId: rawDeliveryTimeSlotId,
      deliveryNote: rawDeliveryNote,
      userInfo,
      paymentMethod,
      promotionCode,
      expectedQuoteMeta,
    } = payload ?? {};

    const requestedBranchId =
      rawBranchId !== undefined && rawBranchId !== null
        ? Number(rawBranchId)
        : null;

    const fulfillmentType = String(
      rawFulfillmentType || "delivery",
    ).toLowerCase();

    const deliveryType = String(rawDeliveryType || "scheduled").toLowerCase();

    const deliveryDate = normalizeDateOnly(rawDeliveryDate);

    const deliveryTimeSlotId =
      rawDeliveryTimeSlotId !== undefined && rawDeliveryTimeSlotId !== null
        ? Number(rawDeliveryTimeSlotId)
        : null;

    const deliveryNote =
      rawDeliveryNote !== undefined && rawDeliveryNote !== null
        ? String(rawDeliveryNote)
        : null;

    if (!Array.isArray(productVariantIds) || productVariantIds.length === 0) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    if (!["pickup", "delivery"].includes(fulfillmentType)) {
      throw new Error("Hình thức nhận hàng không hợp lệ");
    }

    if (!["standard", "same_day", "scheduled"].includes(deliveryType)) {
      throw new Error("Loại giao hàng không hợp lệ");
    }

    if (fulfillmentType === "delivery") {
      if (!address || typeof address !== "object") {
        throw new Error("Thiếu địa chỉ giao hàng");
      }

      if (!String(address.fullName ?? "").trim()) {
        throw new Error("Thiếu tên người nhận");
      }

      if (!String(address.phone ?? "").trim()) {
        throw new Error("Thiếu số điện thoại người nhận");
      }

      if (!String(address.addressLine1 ?? "").trim()) {
        throw new Error("Thiếu địa chỉ giao hàng");
      }

      if (!String(address.ward ?? "").trim()) {
        throw new Error("Thiếu phường/xã giao hàng");
      }

      if (!String(address.district ?? "").trim()) {
        throw new Error("Thiếu quận/huyện giao hàng");
      }

      if (!String(address.province ?? "").trim()) {
        throw new Error("Thiếu tỉnh/thành phố giao hàng");
      }
    }

    const quote = await this.calculateShippingQuoteService.execute({
      userId,
      productVariantIds,
      branchId: requestedBranchId,
      fulfillmentType,
      deliveryType,
      deliveryDate,
      deliveryTimeSlotId,
      address: address ?? null,
    });

    if (quote.requiresBranchSelection) {
      throw new Error("Vui lòng chọn chi nhánh phù hợp để giao hàng");
    }

    if (fulfillmentType === "delivery") {
      if (deliveryType === "scheduled" && !deliveryDate) {
        throw new Error("Bạn cần chọn ngày giao hàng");
      }

      if (deliveryType === "scheduled" && !deliveryTimeSlotId) {
        throw new Error("Bạn cần chọn khung giờ giao hàng");
      }

      if (
        deliveryType === "same_day" &&
        quote.serviceArea?.supportsSameDay === false
      ) {
        throw new Error("Chi nhánh đã chọn không hỗ trợ giao trong ngày");
      }
    }

    if (
      fulfillmentType === "delivery" &&
      deliveryTimeSlotId &&
      Number(quote.selectedSlot?.id ?? 0) !== Number(deliveryTimeSlotId)
    ) {
      throw new Error("Khung giờ giao hàng không hợp lệ");
    }

    const resolvedBranchId =
      quote.selectedBranch?.id !== undefined &&
      quote.selectedBranch?.id !== null
        ? Number(quote.selectedBranch.id)
        : requestedBranchId;

    if (!resolvedBranchId || resolvedBranchId <= 0) {
      throw new Error("Bạn chưa chọn chi nhánh");
    }

    const cartItems = await this.cartRepo.listSelectedItems(
      userId,
      productVariantIds,
    );

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    const promotionCartItems = cartItems.map((i: any) => ({
      productId: i.productId ?? null,
      categoryId: i.product?.categoryId ?? i.product?.productCategoryId ?? null,
      originId: i.product?.originId ?? null,
      productVariantId: i.productVariantId ?? null,
      quantity: Number(i.quantity ?? 0),
      unitPrice: Number(i.variant?.price ?? i.price ?? 0),
      lineSubtotal:
        Number(i.quantity ?? 0) * Number(i.variant?.price ?? i.price ?? 0),
      title: i.product?.title ?? i.title ?? null,
      variantTitle: i.variant?.title ?? i.variantTitle ?? null,
    }));

    const promotionResult = await this.evaluatePromotionService.execute({
      userId,
      branchId: resolvedBranchId,
      promotionCode: promotionCode ?? null,
      subtotal: Number(quote.subtotal ?? 0),
      shippingFee: Number(quote.shippingFee ?? 0),
      cartItems: promotionCartItems,
      allowAutoApply: true,
    });

    const currentDiscountAmount = Number(promotionResult.discountAmount ?? 0);
    const currentShippingDiscountAmount = Number(
      promotionResult.shippingDiscountAmount ?? 0,
    );
    const currentFinalPrice = Number(
      promotionResult.finalPrice ??
        Number(quote.subtotal ?? 0) + Number(quote.shippingFee ?? 0),
    );

    const currentQuoteMeta = {
      fingerprint: buildQuoteFingerprint({
        subtotal: Number(quote.subtotal ?? 0),
        shippingFee: Number(quote.shippingFee ?? 0),
        discountAmount: currentDiscountAmount,
        shippingDiscountAmount: currentShippingDiscountAmount,
        finalPrice: currentFinalPrice,
        fulfillmentType,
        deliveryType,
        deliveryDate,
        selectedBranchId: resolvedBranchId,
        selectedSlotId:
          fulfillmentType === "delivery"
            ? Number(quote.selectedSlot?.id ?? deliveryTimeSlotId ?? 0) || null
            : null,
        shippingZoneId:
          fulfillmentType === "delivery"
            ? Number(quote.shippingZone?.id ?? 0) || null
            : null,
        promotionCode: promotionResult.promotionCode ?? null,
        productVariantIds: Array.isArray(productVariantIds)
          ? productVariantIds.map(Number)
          : [],
      }),
      finalPrice: currentFinalPrice,
      shippingFee: Number(quote.shippingFee ?? 0),
      discountAmount: currentDiscountAmount,
      shippingDiscountAmount: currentShippingDiscountAmount,
    };

    const expectedFingerprint =
      expectedQuoteMeta?.fingerprint !== undefined &&
      expectedQuoteMeta?.fingerprint !== null
        ? String(expectedQuoteMeta.fingerprint)
        : null;

    const expectedFinalPrice =
      expectedQuoteMeta?.finalPrice !== undefined &&
      expectedQuoteMeta?.finalPrice !== null
        ? Number(expectedQuoteMeta.finalPrice)
        : null;

    const expectedShippingFee =
      expectedQuoteMeta?.shippingFee !== undefined &&
      expectedQuoteMeta?.shippingFee !== null
        ? Number(expectedQuoteMeta.shippingFee)
        : null;

    const expectedDiscountAmount =
      expectedQuoteMeta?.discountAmount !== undefined &&
      expectedQuoteMeta?.discountAmount !== null
        ? Number(expectedQuoteMeta.discountAmount)
        : null;

    const expectedShippingDiscountAmount =
      expectedQuoteMeta?.shippingDiscountAmount !== undefined &&
      expectedQuoteMeta?.shippingDiscountAmount !== null
        ? Number(expectedQuoteMeta.shippingDiscountAmount)
        : null;

    const hasQuoteDrift =
      !!expectedFingerprint &&
      (expectedFingerprint !== currentQuoteMeta.fingerprint ||
        (expectedFinalPrice !== null &&
          Math.abs(expectedFinalPrice - currentQuoteMeta.finalPrice) > 0.009) ||
        (expectedShippingFee !== null &&
          Math.abs(expectedShippingFee - currentQuoteMeta.shippingFee) >
            0.009) ||
        (expectedDiscountAmount !== null &&
          Math.abs(expectedDiscountAmount - currentQuoteMeta.discountAmount) >
            0.009) ||
        (expectedShippingDiscountAmount !== null &&
          Math.abs(
            expectedShippingDiscountAmount -
              currentQuoteMeta.shippingDiscountAmount,
          ) > 0.009));

    if (hasQuoteDrift) {
      const error: any = new Error(
        "Giá đơn hàng vừa được cập nhật do khuyến mãi, khung giờ, chi nhánh hoặc tồn kho thay đổi.",
      );

      error.code = "CHECKOUT_QUOTE_CHANGED";
      error.status = 409;
      error.data = {
        previousQuote: {
          fingerprint: expectedFingerprint,
          finalPrice: expectedFinalPrice,
          shippingFee: expectedShippingFee,
          discountAmount: expectedDiscountAmount,
          shippingDiscountAmount: expectedShippingDiscountAmount,
        },
        currentQuote: {
          fingerprint: currentQuoteMeta.fingerprint,
          subtotal: Number(quote.subtotal ?? 0),
          shippingFee: currentQuoteMeta.shippingFee,
          discountAmount: currentQuoteMeta.discountAmount,
          shippingDiscountAmount: currentQuoteMeta.shippingDiscountAmount,
          finalPrice: currentQuoteMeta.finalPrice,
          selectedBranch: quote.selectedBranch ?? null,
          selectedSlot: quote.selectedSlot ?? null,
          promotionCode: promotionResult.promotionCode ?? null,
          promotionMessages: Array.isArray(promotionResult.messages)
            ? promotionResult.messages
            : [],
        },
      };

      throw error;
    }

    const transaction = await this.orderRepo.startTransaction();

    try {
      for (const item of cartItems) {
        if (!item.productVariantId) {
          throw new Error("Cart item chưa gắn product variant");
        }

        const variant = await this.productRepo.findVariantById(
          item.productVariantId,
          transaction,
        );

        if (!variant) {
          throw new Error(
            `Variant không tồn tại (ID ${item.productVariantId})`,
          );
        }

        if (
          variant.status &&
          String(variant.status).toLowerCase() !== "active"
        ) {
          throw new Error(
            `Variant không khả dụng (${variant.title || variant.name || "variant"})`,
          );
        }

        const fallbackStock = Number(
          variant.availableStock ?? variant.stock ?? 0,
        );

        const availableStock =
          typeof this.inventoryRepo.getAvailableStock === "function"
            ? await this.inventoryRepo.getAvailableStock(
                resolvedBranchId,
                item.productVariantId,
                fallbackStock,
                transaction,
              )
            : Math.max(0, fallbackStock);

        if (availableStock < Number(item.quantity)) {
          throw new Error(
            `Không đủ tồn kho tại chi nhánh đã chọn (${
              variant.title || variant.name || "variant"
            })`,
          );
        }
      }

      const resolvedDeliveryDate =
        fulfillmentType === "delivery" ? (deliveryDate ?? null) : null;

      const resolvedDeliveryTimeSlotId =
        fulfillmentType === "delivery"
          ? Number(quote.selectedSlot?.id ?? deliveryTimeSlotId ?? 0) || null
          : null;

      if (fulfillmentType === "delivery" && deliveryType === "scheduled") {
        if (!resolvedDeliveryDate) {
          throw new Error("Bạn cần chọn ngày giao hàng");
        }
        if (!resolvedDeliveryTimeSlotId) {
          throw new Error("Bạn cần chọn khung giờ giao hàng");
        }
      }

      const order = await this.orderRepo.create(
        {
          userId,
          branchId: resolvedBranchId,
          fulfillmentType,
          deliveryType,
          deliveryDate: resolvedDeliveryDate,
          deliveryTimeSlotId: resolvedDeliveryTimeSlotId,
          deliveryTimeSlotLabel:
            fulfillmentType === "delivery"
              ? (quote.selectedSlot?.label ?? null)
              : null,
          shippingZoneId:
            fulfillmentType === "delivery"
              ? (quote.shippingZone?.id ?? null)
              : null,
          shippingZoneCode:
            fulfillmentType === "delivery"
              ? (quote.shippingZone?.code ?? null)
              : null,
          shippingZoneName:
            fulfillmentType === "delivery"
              ? (quote.shippingZone?.name ?? null)
              : null,
          deliveryNote: deliveryNote ?? null,
          items: cartItems.map((i: any) => ({
            productId: i.productId ?? null,
            productVariantId: i.productVariantId ?? null,
            quantity: Number(i.quantity ?? 0),
            price: Number(i.variant?.price ?? i.price ?? 0),
            title: i.product?.title ?? i.title ?? "(deleted)",
            variantTitle: i.variant?.title ?? i.variantTitle ?? null,
            variantSku: i.variant?.sku ?? i.variantSku ?? null,
            variantLabel: i.variant?.title ?? i.variantLabel ?? null,
            thumbnail: i.product?.thumbnail ?? i.thumbnail ?? null,
            optionSummary: Array.isArray(i.variant?.optionValues)
              ? i.variant.optionValues.map((x: any) => x.value).join(" / ")
              : (i.optionSummary ?? null),
          })),
          address:
            fulfillmentType === "pickup"
              ? {
                  fullName:
                    address?.fullName ??
                    userInfo?.name ??
                    userInfo?.fullName ??
                    null,
                  phone: address?.phone ?? userInfo?.phone ?? null,
                  email: address?.email ?? userInfo?.email ?? null,
                  addressLine1:
                    quote.selectedBranch?.addressLine1 ?? "Nhận tại chi nhánh",
                  addressLine2: "",
                  ward: "",
                  district: quote.selectedBranch?.district ?? "",
                  province: quote.selectedBranch?.province ?? "",
                  postalCode: "",
                  notes: deliveryNote ?? "",
                }
              : {
                  fullName: String(address?.fullName ?? "").trim(),
                  phone: String(address?.phone ?? "").trim(),
                  email: address?.email
                    ? String(address.email).trim().toLowerCase()
                    : null,
                  addressLine1: String(address?.addressLine1 ?? "").trim(),
                  addressLine2: address?.addressLine2
                    ? String(address.addressLine2).trim()
                    : "",
                  ward: String(address?.ward ?? "").trim(),
                  district: String(address?.district ?? "").trim(),
                  province: String(address?.province ?? "").trim(),
                  postalCode: address?.postalCode
                    ? String(address.postalCode).trim()
                    : "",
                  notes: deliveryNote ?? "",
                },
          shippingFee: Number(quote.shippingFee ?? 0),
          discountAmount: Number(promotionResult.discountAmount ?? 0),
          shippingDiscountAmount: Number(
            promotionResult.shippingDiscountAmount ?? 0,
          ),
          promotionCode: promotionResult.promotionCode ?? null,
          promotionSnapshot: promotionResult.promotionSnapshotJson ?? null,
          totalPrice: Number(quote.subtotal ?? 0),
          userInfo: {
            ...(userInfo ?? {}),
            paymentMethod: paymentMethod ?? null,
          },
        },
        transaction,
      );

      const appliedPromotion = Array.isArray(promotionResult.appliedPromotions)
        ? promotionResult.appliedPromotions[0]
        : null;

      if (appliedPromotion && appliedPromotion.promotionId) {
        await this.promotionRepo.createUsage(
          {
            promotionId: Number(appliedPromotion.promotionId),
            promotionCodeId: appliedPromotion.promotionCodeId ?? null,
            orderId: Number(order.props.id),
            userId,
            discountAmount: Number(appliedPromotion.discountAmount ?? 0),
            shippingDiscountAmount: Number(
              appliedPromotion.shippingDiscountAmount ?? 0,
            ),
            snapshotJson: promotionResult.promotionSnapshotJson ?? null,
          },
          transaction,
        );

        if (appliedPromotion.promotionCodeId) {
          await this.promotionRepo.incrementCodeUsage(
            Number(appliedPromotion.promotionCodeId),
            transaction,
          );
        }
      }

      for (const item of cartItems) {
        await this.inventoryRepo.decreaseStock(
          resolvedBranchId,
          Number(item.productVariantId),
          Number(item.quantity),
          {
            transaction,
            transactionType: "order_created",
            referenceType: "order",
            referenceId: Number(order.props.id),
            note: `Trừ kho khi tạo đơn ${order.props.code}`,
            createdById: userId,
          },
        );
      }

      await this.cartRepo.clearSelectedItems(
        userId,
        productVariantIds,
        transaction,
      );

      await transaction.commit();


if (this.createNotification) {
  await this.createNotification.execute({
    eventKey: "order_created",
    category: "order",
    severity: "info",
    title: `Đơn hàng mới #${order.props.code}`,
    message: `Có đơn hàng mới tại chi nhánh #${resolvedBranchId} với tổng thanh toán ${Number(order.props.finalPrice ?? 0).toLocaleString("vi-VN")}đ.`,
    entityType: "order",
    entityId: Number(order.props.id),
    actorUserId: userId,
    branchId: resolvedBranchId,
    targetUrl: `/admin/orders/edit/${Number(order.props.id)}`,
    metaJson: {
      orderCode: order.props.code,
      fulfillmentType: order.props.fulfillmentType,
      deliveryType: order.props.deliveryType ?? "standard",
      finalPrice: Number(order.props.finalPrice ?? 0),
      shippingFee: Number(order.props.shippingFee ?? 0),
      itemCount: Array.isArray(order.props.items)
        ? order.props.items.length
        : 0,
    },
    dedupeKey: `order_created:${Number(order.props.id)}`,
    includeSuperAdmins: true,
    recipientBranchIds: resolvedBranchId ? [resolvedBranchId] : [],
  });
}

      return {
        id: order.props.id,
        code: order.props.code,
        trackingToken: order.props.trackingToken,
        branchId: order.props.branchId,
        fulfillmentType: order.props.fulfillmentType,
        deliveryType: order.props.deliveryType ?? "standard",
        deliveryDate: order.props.deliveryDate ?? null,
        deliveryTimeSlotId: order.props.deliveryTimeSlotId ?? null,
        deliveryTimeSlotLabel: order.props.deliveryTimeSlotLabel ?? null,
        shippingZoneId: order.props.shippingZoneId ?? null,
        shippingZoneCode: order.props.shippingZoneCode ?? null,
        shippingZoneName: order.props.shippingZoneName ?? null,
        deliveryNote: order.props.deliveryNote ?? null,
        shippingFee: Number(order.props.shippingFee ?? 0),
        discountAmount: Number(order.props.discountAmount ?? 0),
        totalPrice: Number(order.props.totalPrice ?? 0),
        finalPrice: Number(order.props.finalPrice ?? 0),
        shippingDiscountAmount: Number(order.props.shippingDiscountAmount ?? 0),
        promotionCode: order.props.promotionCode ?? null,
        promotionSnapshot: order.props.promotionSnapshot ?? null,
        quoteMeta: {
          fingerprint: currentQuoteMeta.fingerprint,
          computedAt: new Date().toISOString(),
          expiresAt: null,
          consistencyVersion: 1,
        },
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
