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

const startOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const toDateAtLocalTime = (dateOnly: string, timeValue: string) => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const [hour, minute, second] = String(timeValue || "00:00:00")
    .split(":")
    .map((x) => Number(x || 0));

  return new Date(year, month - 1, day, hour, minute, second || 0, 0);
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
  const shippingFeeRaw =
    input.deliveryFeeOverride !== null &&
    input.deliveryFeeOverride !== undefined
      ? Number(input.deliveryFeeOverride)
      : Number(input.baseFee ?? 0);

  const freeShipThreshold =
    input.freeShipThreshold !== null && input.freeShipThreshold !== undefined
      ? Number(input.freeShipThreshold)
      : null;

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

    if (!["pickup", "delivery"].includes(input.fulfillmentType)) {
      throw new Error("Hình thức nhận hàng không hợp lệ");
    }

    if (!["standard", "same_day", "scheduled"].includes(input.deliveryType)) {
      throw new Error("Loại giao hàng không hợp lệ");
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

    if (subtotal < 0) {
      throw new Error("Tạm tính đơn hàng không hợp lệ");
    }

    return { cartItems, subtotal };
  }

  private async buildPickupQuote(input: NormalizedInput, subtotal: number) {
    if (!input.requestedBranchId || input.requestedBranchId <= 0) {
      throw new Error("Bạn chưa chọn chi nhánh nhận hàng");
    }

    const branch = await this.branchRepo.findById(input.requestedBranchId);
    if (!branch || branch.props.deleted) {
      throw new Error("Chi nhánh không tồn tại");
    }

    if (String(branch.props.status).toLowerCase() !== "active") {
      throw new Error("Chi nhánh hiện không hoạt động");
    }

    if (!branch.props.supportsPickup) {
      throw new Error("Chi nhánh này không hỗ trợ nhận tại cửa hàng");
    }

    return {
      subtotal,
      shippingFee: 0,
      discountAmount: 0,
      finalPrice: subtotal,
      shippingZone: null,
      availableSlots: [],
      selectedSlot: null,
      selectedBranch: toSelectedBranchSummary(branch),
      candidateBranches: [],
      requiresBranchSelection: false,
    };
  }

  private validateDeliveryRequest(input: NormalizedInput) {
    if (!input.address?.province?.trim()) {
      throw new Error("Thiếu tỉnh/thành phố để tính phí giao hàng");
    }

    if (!input.address?.district?.trim()) {
      throw new Error("Thiếu quận/huyện để tính phí giao hàng");
    }

    if (!input.address?.ward?.trim()) {
      throw new Error("Thiếu phường/xã để tính phí giao hàng");
    }

    if (!input.address?.addressLine1?.trim()) {
      throw new Error("Thiếu địa chỉ giao hàng");
    }

    if (!input.deliveryDate) {
      throw new Error("Bạn chưa chọn ngày giao hàng");
    }

    const today = startOfToday();
    const selectedDeliveryDate = new Date(`${input.deliveryDate}T00:00:00`);

    if (Number.isNaN(selectedDeliveryDate.getTime())) {
      throw new Error("Ngày giao hàng không hợp lệ");
    }

    if (selectedDeliveryDate < today) {
      throw new Error("Không thể chọn ngày giao hàng trong quá khứ");
    }
  }

  private async resolveDeliveryContext(
    input: NormalizedInput,
    subtotal: number,
  ): Promise<DeliveryContext> {
    const normalizedProvince = normalizeNullableText(input.address?.province);
    const normalizedDistrict = normalizeNullableText(input.address?.district);
    const normalizedWard = normalizeNullableText(input.address?.ward);

    const zone = await this.resolveShippingZoneService.execute({
      province: normalizedProvince,
      district: normalizedDistrict,
      ward: normalizedWard,
    });

    const matchedZones = await this.shippingZoneRepo.findMatchChain({
      province: normalizedProvince,
      district: normalizedDistrict,
      ward: normalizedWard,
    });

    if (!matchedZones.length) {
      throw new Error("Khu vực giao hàng hiện chưa được hỗ trợ");
    }

    const branchList = await this.branchRepo.list({
      status: "active",
      includeDeleted: false,
      limit: 500,
      offset: 0,
      sort: { column: "id", dir: "ASC" },
    });

    const deliveryCapableBranches = (branchList?.rows ?? []).filter(
      (branch: any) =>
        !branch.props.deleted &&
        String(branch.props.status).toLowerCase() === "active" &&
        !!branch.props.supportsDelivery &&
        !!String(branch.props.addressLine1 ?? "").trim() &&
        !!String(branch.props.district ?? "").trim() &&
        !!String(branch.props.province ?? "").trim(),
    );

    const matchedBranchPairs: MatchedBranchPair[] = [];

    for (const branch of deliveryCapableBranches) {
      let matchedZoneForBranch: any = null;
      let serviceArea: any = null;

      for (const candidateZone of matchedZones) {
        const candidateServiceArea =
          await this.shippingZoneRepo.findBranchServiceArea(
            Number(branch.props.id),
            candidateZone.id,
          );

        if (!candidateServiceArea) continue;
        if (String(candidateServiceArea.status).toLowerCase() !== "active") {
          continue;
        }

        matchedZoneForBranch = candidateZone;
        serviceArea = candidateServiceArea;
        break;
      }

      if (!serviceArea || !matchedZoneForBranch) continue;

      if (
        serviceArea.deliveryFeeOverride !== null &&
        serviceArea.deliveryFeeOverride !== undefined &&
        Number(serviceArea.deliveryFeeOverride) < 0
      ) {
        continue;
      }

      if (
        serviceArea.minOrderValue !== null &&
        serviceArea.maxOrderValue !== null &&
        Number(serviceArea.minOrderValue) > Number(serviceArea.maxOrderValue)
      ) {
        continue;
      }

      if (
        serviceArea.minOrderValue !== null &&
        serviceArea.minOrderValue !== undefined &&
        subtotal < Number(serviceArea.minOrderValue)
      ) {
        continue;
      }

      if (
        serviceArea.maxOrderValue !== null &&
        serviceArea.maxOrderValue !== undefined &&
        subtotal > Number(serviceArea.maxOrderValue)
      ) {
        continue;
      }

      if (input.deliveryType === "same_day" && !serviceArea.supportsSameDay) {
        continue;
      }

      matchedBranchPairs.push({
        branch,
        serviceArea,
        matchedZone: matchedZoneForBranch,
      });
    }

    if (matchedBranchPairs.length === 0) {
      throw new Error("Hiện chưa có chi nhánh nào hỗ trợ giao tới khu vực này");
    }

    const candidateBranches: CandidateBranch[] = matchedBranchPairs.map(
      ({ branch }) => toCandidateBranch(branch),
    );

    let selectedPair: MatchedBranchPair | undefined;

    if (input.requestedBranchId && input.requestedBranchId > 0) {
      selectedPair = matchedBranchPairs.find(
        ({ branch }) => Number(branch.props.id) === input.requestedBranchId,
      );

      if (!selectedPair) {
        throw new Error(
          "Chi nhánh đã chọn hiện không hỗ trợ giao tới khu vực này",
        );
      }
    } else if (matchedBranchPairs.length === 1) {
      selectedPair = matchedBranchPairs[0];
    }

    return {
      zone,
      matchedZones,
      matchedBranchPairs,
      candidateBranches,
      selectedPair,
    };
  }

  private async buildDeliveryQuote(
    input: NormalizedInput,
    subtotal: number,
    context: DeliveryContext,
  ) {
    const { zone, candidateBranches, selectedPair } = context;

    if (!selectedPair) {
      return {
        subtotal,
        shippingFee: 0,
        discountAmount: 0,
        finalPrice: subtotal,
        shippingZone: toShippingZoneSummary(zone),
        availableSlots: [],
        selectedSlot: null,
        selectedBranch: null,
        candidateBranches,
        requiresBranchSelection: true,
      };
    }

    const selectedBranch = selectedPair.branch;
    const selectedServiceArea = selectedPair.serviceArea;
    const selectedMatchedZone = selectedPair.matchedZone;

    const { shippingFee } = computeShippingFee({
      subtotal,
      deliveryFeeOverride: selectedServiceArea.deliveryFeeOverride,
      baseFee: selectedMatchedZone.baseFee,
      freeShipThreshold: selectedMatchedZone.freeShipThreshold,
    });

    const availableSlots = await this.getAvailableDeliverySlotsService.execute({
      branchId: Number(selectedBranch.props.id),
      deliveryDate: input.deliveryDate!,
    });

    let selectedSlot: any = null;

    if (input.deliveryTimeSlotId && input.deliveryTimeSlotId > 0) {
      selectedSlot =
        availableSlots.find((x) => x.id === input.deliveryTimeSlotId) ?? null;

      if (!selectedSlot) {
        throw new Error("Khung giờ giao hàng không tồn tại");
      }

      if (!selectedSlot.isAvailable) {
        throw new Error(
          selectedSlot.reason || "Khung giờ giao hàng không khả dụng",
        );
      }
    }

    return {
      subtotal,
      shippingFee,
      discountAmount: 0,
      finalPrice: subtotal + shippingFee,
      shippingZone: toShippingZoneSummary(zone),
      availableSlots,
      selectedSlot: toSelectedSlotSummary(selectedSlot),
      selectedBranch: toSelectedBranchSummary(selectedBranch),
      candidateBranches,
      requiresBranchSelection: false,
    };
  }

  async execute(input: Input) {
    const normalized = this.normalizeInput(input);
    const { subtotal } = await this.loadCheckoutCart(normalized);

    if (normalized.fulfillmentType === "pickup") {
      return await this.buildPickupQuote(normalized, subtotal);
    }

    this.validateDeliveryRequest(normalized);

    const deliveryContext = await this.resolveDeliveryContext(
      normalized,
      subtotal,
    );

    return await this.buildDeliveryQuote(normalized, subtotal, deliveryContext);
  }
}
