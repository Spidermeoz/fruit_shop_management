import type { CartRepository } from "../../../domain/carts/CartRepository";
import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";
import { ResolveShippingZoneService } from "./ResolveShippingZoneService";
import { GetAvailableDeliverySlotsService } from "./GetAvailableDeliverySlotsService";

type AddressInput = {
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressLine1?: string | null;
} | null;

type Input = {
  userId: number;
  productVariantIds: number[];
  branchId?: number | null;
  fulfillmentType?: "pickup" | "delivery" | string | null;
  deliveryType?: "standard" | "same_day" | "scheduled" | string | null;
  deliveryDate?: string | null;
  deliveryTimeSlotId?: number | null;
  address?: AddressInput;
};

type CandidateBranch = {
  id: number;
  name: string;
  code?: string | null;
  addressLine1?: string | null;
  district?: string | null;
  province?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
};

type NormalizedInput = {
  userId: number;
  productVariantIds: number[];
  requestedBranchId: number | null;
  fulfillmentType: "pickup" | "delivery";
  deliveryType: "standard" | "same_day" | "scheduled";
  deliveryDate: string | null;
  deliveryTimeSlotId: number | null;
  address: AddressInput;
};

type MatchedBranchPair = {
  branch: any;
  serviceArea: any;
  matchedZone: any;
};

type DeliveryContext = {
  zone: any;
  matchedZones: any[];
  matchedBranchPairs: MatchedBranchPair[];
  candidateBranches: CandidateBranch[];
  selectedPair?: MatchedBranchPair;
};

const normalizeNullableText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const normalizeDateOnly = (value?: string | null): string | null => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (!v) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

const toCandidateBranch = (branch: any): CandidateBranch => ({
  id: Number(branch.props.id),
  name: branch.props.name,
  code: branch.props.code ?? null,
  addressLine1: branch.props.addressLine1 ?? null,
  district: branch.props.district ?? null,
  province: branch.props.province ?? null,
  supportsPickup: !!branch.props.supportsPickup,
  supportsDelivery: !!branch.props.supportsDelivery,
});

const toSelectedBranchSummary = (branch: any) => ({
  id: Number(branch.props.id),
  name: branch.props.name,
  code: branch.props.code ?? null,
  addressLine1: branch.props.addressLine1 ?? null,
  district: branch.props.district ?? null,
  province: branch.props.province ?? null,
  supportsPickup: !!branch.props.supportsPickup,
  supportsDelivery: !!branch.props.supportsDelivery,
});

const toShippingZoneSummary = (zone: any) => ({
  id: Number(zone.id),
  code: zone.code ?? null,
  name: zone.name ?? null,
});

const toSelectedSlotSummary = (slot: any) =>
  slot
    ? {
        id: Number(slot.id),
        label: slot.label ?? null,
        startTime: slot.startTime ?? null,
        endTime: slot.endTime ?? null,
      }
    : null;

const computeShippingFee = (input: {
  subtotal: number;
  deliveryFeeOverride?: number | null;
  baseFee?: number | null;
  freeShipThreshold?: number | null;
}) => {
  const hasOverride =
    input.deliveryFeeOverride !== null &&
    input.deliveryFeeOverride !== undefined;

  const hasBaseFee = input.baseFee !== null && input.baseFee !== undefined;

  if (!hasOverride && !hasBaseFee) {
    throw new Error("Thiếu cấu hình phí giao hàng cho khu vực này");
  }

  const shippingFeeRaw = hasOverride
    ? Number(input.deliveryFeeOverride)
    : Number(input.baseFee);

  if (!Number.isFinite(shippingFeeRaw)) {
    throw new Error("Phí giao hàng không hợp lệ");
  }

  const freeShipThreshold =
    input.freeShipThreshold !== null && input.freeShipThreshold !== undefined
      ? Number(input.freeShipThreshold)
      : null;

  if (freeShipThreshold !== null && !Number.isFinite(freeShipThreshold)) {
    throw new Error("Ngưỡng miễn phí giao hàng không hợp lệ");
  }

  const shippingFee =
    freeShipThreshold !== null && input.subtotal >= freeShipThreshold
      ? 0
      : Math.max(0, shippingFeeRaw);

  return {
    shippingFeeRaw,
    freeShipThreshold,
    shippingFee,
  };
};

const rankMatchedPairs = (pairs: MatchedBranchPair[]) => {
  return [...pairs].sort((a, b) => {
    const aOverride =
      a.serviceArea.deliveryFeeOverride !== null &&
      a.serviceArea.deliveryFeeOverride !== undefined
        ? Number(a.serviceArea.deliveryFeeOverride)
        : Number.POSITIVE_INFINITY;
    const bOverride =
      b.serviceArea.deliveryFeeOverride !== null &&
      b.serviceArea.deliveryFeeOverride !== undefined
        ? Number(b.serviceArea.deliveryFeeOverride)
        : Number.POSITIVE_INFINITY;

    if (aOverride !== bOverride) return aOverride - bOverride;

    const aBranchId = Number(a.branch.props.id ?? 0);
    const bBranchId = Number(b.branch.props.id ?? 0);
    if (aBranchId !== bBranchId) return aBranchId - bBranchId;

    return String(a.branch.props.code ?? "").localeCompare(
      String(b.branch.props.code ?? ""),
    );
  });
};

export class CalculateShippingQuoteService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly branchRepo: BranchRepository,
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly resolveShippingZoneService: ResolveShippingZoneService,
    private readonly getAvailableDeliverySlotsService: GetAvailableDeliverySlotsService,
  ) {}

  private normalizeInput(input: Input): NormalizedInput {
    const userId = Number(input.userId);
    const requestedBranchId =
      input.branchId !== undefined && input.branchId !== null
        ? Number(input.branchId)
        : null;
    const fulfillmentType = String(
      input.fulfillmentType ?? "delivery",
    ).toLowerCase() as "pickup" | "delivery";
    const deliveryType = String(
      input.deliveryType ?? "scheduled",
    ).toLowerCase() as "standard" | "same_day" | "scheduled";
    const deliveryDate = normalizeDateOnly(input.deliveryDate);
    const deliveryTimeSlotId =
      input.deliveryTimeSlotId !== undefined &&
      input.deliveryTimeSlotId !== null
        ? Number(input.deliveryTimeSlotId)
        : null;

    return {
      userId,
      productVariantIds: Array.isArray(input.productVariantIds)
        ? input.productVariantIds.map(Number)
        : [],
      requestedBranchId,
      fulfillmentType,
      deliveryType,
      deliveryDate,
      deliveryTimeSlotId,
      address: input.address ?? null,
    };
  }

  private async loadCheckoutCart(input: NormalizedInput) {
    if (
      !Array.isArray(input.productVariantIds) ||
      input.productVariantIds.length === 0
    ) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }
    const cartItems = await this.cartRepo.listSelectedItems(
      input.userId,
      input.productVariantIds,
    );
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = Number(item.variant?.price ?? item.price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      return sum + price * quantity;
    }, 0);
    return { cartItems, subtotal };
  }

  private async buildPickupQuote(input: NormalizedInput, subtotal: number) {
    if (!input.requestedBranchId) {
      throw new Error("Bạn cần chọn chi nhánh nhận hàng");
    }
    const selectedBranch = await this.branchRepo.findById(
      input.requestedBranchId,
    );
    if (!selectedBranch) {
      throw new Error("Không tìm thấy chi nhánh nhận hàng");
    }
    if (!selectedBranch.props.supportsPickup) {
      throw new Error("Chi nhánh không hỗ trợ nhận tại cửa hàng");
    }
    return {
      fulfillmentType: "pickup",
      deliveryType: "pickup",
      subtotal,
      shippingFee: 0,
      shippingFeeRaw: 0,
      freeShipThreshold: null,
      shippingZone: null,
      matchedZones: [],
      selectedBranch: toSelectedBranchSummary(selectedBranch),
      candidateBranches: [toCandidateBranch(selectedBranch)],
      requiresBranchSelection: false,
      availableSlots: [],
      selectedSlot: null,
      serviceArea: null,
    };
  }

  private validateServiceAreaRules(
    input: NormalizedInput,
    subtotal: number,
    pair: MatchedBranchPair,
  ) {
    const minOrderValue =
      pair.serviceArea.minOrderValue !== null &&
      pair.serviceArea.minOrderValue !== undefined
        ? Number(pair.serviceArea.minOrderValue)
        : null;

    const maxOrderValue =
      pair.serviceArea.maxOrderValue !== null &&
      pair.serviceArea.maxOrderValue !== undefined
        ? Number(pair.serviceArea.maxOrderValue)
        : null;

    if (
      minOrderValue !== null &&
      Number.isFinite(minOrderValue) &&
      subtotal < minOrderValue
    ) {
      throw new Error(
        `Đơn hàng chưa đạt giá trị tối thiểu để giao ở khu vực này (${minOrderValue.toLocaleString("vi-VN")}đ)`,
      );
    }

    if (
      maxOrderValue !== null &&
      Number.isFinite(maxOrderValue) &&
      subtotal > maxOrderValue
    ) {
      throw new Error(
        `Đơn hàng vượt quá giá trị tối đa để giao ở khu vực này (${maxOrderValue.toLocaleString("vi-VN")}đ)`,
      );
    }

    if (
      input.deliveryType === "same_day" &&
      !pair.serviceArea.supportsSameDay
    ) {
      throw new Error(
        "Chi nhánh đã chọn không hỗ trợ giao trong ngày cho khu vực này",
      );
    }
  }

  private async buildDeliveryContext(
    input: NormalizedInput,
  ): Promise<DeliveryContext> {
    const province = normalizeNullableText(input.address?.province);
    const district = normalizeNullableText(input.address?.district);
    const ward = normalizeNullableText(input.address?.ward);
    if (!province) {
      throw new Error("Bạn cần cung cấp tỉnh/thành để tính phí giao hàng");
    }

    const zone = await this.resolveShippingZoneService.execute({
      province,
      district,
      ward,
    });
    const matchedZones = await this.resolveShippingZoneService.resolveChain({
      province,
      district,
      ward,
    });

    const candidateBranchRows = await this.branchRepo.list({
      status: "active",
      includeDeleted: false,
      limit: 1000,
      offset: 0,
      sort: { column: "id", dir: "ASC" },
    } as any);

    const matchedBranchPairs: MatchedBranchPair[] = [];
    for (const branch of candidateBranchRows.rows) {
      if (!branch.props.supportsDelivery) continue;
      const serviceArea = await this.shippingZoneRepo.findBranchServiceArea(
        Number(branch.props.id),
        Number(zone.id),
      );
      if (!serviceArea) continue;
      matchedBranchPairs.push({ branch, serviceArea, matchedZone: zone });
    }

    const rankedPairs = rankMatchedPairs(matchedBranchPairs);
    const candidateBranches = rankedPairs.map((pair) =>
      toCandidateBranch(pair.branch),
    );

    let selectedPair: MatchedBranchPair | undefined;
    if (input.requestedBranchId) {
      selectedPair = rankedPairs.find(
        (pair) => Number(pair.branch.props.id) === input.requestedBranchId,
      );
      if (!selectedPair) {
        throw new Error(
          "Chi nhánh đã chọn không phục vụ khu vực giao hàng này",
        );
      }
    } else {
      selectedPair = rankedPairs[0];
    }

    if (!selectedPair) {
      throw new Error(
        "Hiện chưa có chi nhánh nào phục vụ khu vực giao hàng này",
      );
    }

    return {
      zone,
      matchedZones,
      matchedBranchPairs: rankedPairs,
      candidateBranches,
      selectedPair,
    };
  }

  async execute(rawInput: Input) {
    const input = this.normalizeInput(rawInput);
    const { subtotal } = await this.loadCheckoutCart(input);

    if (input.fulfillmentType === "pickup") {
      return this.buildPickupQuote(input, subtotal);
    }

    const deliveryContext = await this.buildDeliveryContext(input);
    const selectedPair = deliveryContext.selectedPair!;

    this.validateServiceAreaRules(input, subtotal, selectedPair);

    const feeContext = computeShippingFee({
      subtotal,
      deliveryFeeOverride: selectedPair.serviceArea.deliveryFeeOverride,
      baseFee: deliveryContext.zone.baseFee,
      freeShipThreshold: deliveryContext.zone.freeShipThreshold,
    });

    const selectedBranch = toSelectedBranchSummary(selectedPair.branch);
    const matchedZone = toShippingZoneSummary(deliveryContext.zone);
    const matchedZones = deliveryContext.matchedZones.map(
      toShippingZoneSummary,
    );

    const availableSlots = input.deliveryDate
      ? await this.getAvailableDeliverySlotsService.execute({
          branchId: selectedBranch.id,
          deliveryDate: input.deliveryDate,
        })
      : [];

    const selectedSlot = input.deliveryTimeSlotId
      ? toSelectedSlotSummary(
          availableSlots.find(
            (slot) => Number(slot.id) === Number(input.deliveryTimeSlotId),
          ),
        )
      : null;

    const requiresBranchSelection =
      !input.requestedBranchId && deliveryContext.matchedBranchPairs.length > 1;

    return {
      fulfillmentType: "delivery",
      deliveryType: input.deliveryType,
      subtotal,
      shippingFee: feeContext.shippingFee,
      shippingFeeRaw: feeContext.shippingFeeRaw,
      freeShipThreshold: feeContext.freeShipThreshold,
      shippingZone: matchedZone,
      matchedZones,
      selectedBranch,
      candidateBranches: deliveryContext.candidateBranches,
      requiresBranchSelection,
      availableSlots,
      selectedSlot,
      serviceArea: {
        id: Number(selectedPair.serviceArea.id),
        supportsSameDay: !!selectedPair.serviceArea.supportsSameDay,
        minOrderValue: selectedPair.serviceArea.minOrderValue ?? null,
        maxOrderValue: selectedPair.serviceArea.maxOrderValue ?? null,
        deliveryFeeOverride:
          selectedPair.serviceArea.deliveryFeeOverride ?? null,
      },
    };
  }
}
