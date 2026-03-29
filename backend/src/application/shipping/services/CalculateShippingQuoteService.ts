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

export class CalculateShippingQuoteService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly branchRepo: BranchRepository,
    private readonly shippingZoneRepo: ShippingZoneRepository,
    private readonly resolveShippingZoneService: ResolveShippingZoneService,
    private readonly getAvailableDeliverySlotsService: GetAvailableDeliverySlotsService,
  ) {}

  async execute(input: Input) {
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

    if (
      !Array.isArray(input.productVariantIds) ||
      input.productVariantIds.length === 0
    ) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    if (!["pickup", "delivery"].includes(fulfillmentType)) {
      throw new Error("Hình thức nhận hàng không hợp lệ");
    }

    if (!["standard", "same_day", "scheduled"].includes(deliveryType)) {
      throw new Error("Loại giao hàng không hợp lệ");
    }

    const cartItems = await this.cartRepo.listSelectedItems(
      userId,
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

    if (fulfillmentType === "pickup") {
      if (!requestedBranchId || requestedBranchId <= 0) {
        throw new Error("Bạn chưa chọn chi nhánh nhận hàng");
      }

      const branch = await this.branchRepo.findById(requestedBranchId);
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
        selectedBranch: {
          id: Number(branch.props.id),
          name: branch.props.name,
          code: branch.props.code ?? null,
          addressLine1: branch.props.addressLine1 ?? null,
          district: branch.props.district ?? null,
          province: branch.props.province ?? null,
          supportsPickup: !!branch.props.supportsPickup,
          supportsDelivery: !!branch.props.supportsDelivery,
        },
        candidateBranches: [],
        requiresBranchSelection: false,
      };
    }

    if (!input.address?.province?.trim()) {
      throw new Error("Thiếu tỉnh/thành phố để tính phí giao hàng");
    }

    if (!input.address?.district?.trim()) {
      throw new Error("Thiếu quận/huyện để tính phí giao hàng");
    }

    if (!input.address?.addressLine1?.trim()) {
      throw new Error("Thiếu địa chỉ giao hàng");
    }

    if (!deliveryDate) {
      throw new Error("Bạn chưa chọn ngày giao hàng");
    }

    const today = startOfToday();
    const selectedDeliveryDate = new Date(`${deliveryDate}T00:00:00`);

    if (Number.isNaN(selectedDeliveryDate.getTime())) {
      throw new Error("Ngày giao hàng không hợp lệ");
    }

    if (selectedDeliveryDate < today) {
      throw new Error("Không thể chọn ngày giao hàng trong quá khứ");
    }

    const zone = await this.resolveShippingZoneService.execute({
      province: input.address?.province ?? null,
      district: input.address?.district ?? null,
      ward: input.address?.ward ?? null,
    });

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
        !!branch.props.supportsDelivery,
    );

    const matchedBranchPairs: Array<{
      branch: any;
      serviceArea: any;
    }> = [];

    for (const branch of deliveryCapableBranches) {
      const serviceArea = await this.shippingZoneRepo.findBranchServiceArea(
        Number(branch.props.id),
        zone.id,
      );

      if (!serviceArea) continue;
      if (String(serviceArea.status).toLowerCase() !== "active") continue;

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

      if (deliveryType === "same_day" && !serviceArea.supportsSameDay) {
        continue;
      }

      matchedBranchPairs.push({ branch, serviceArea });
    }

    if (matchedBranchPairs.length === 0) {
      throw new Error("Hiện chưa có chi nhánh nào hỗ trợ giao tới khu vực này");
    }

    const candidateBranches: CandidateBranch[] = matchedBranchPairs.map(
      ({ branch }) => ({
        id: Number(branch.props.id),
        name: branch.props.name,
        code: branch.props.code ?? null,
        addressLine1: branch.props.addressLine1 ?? null,
        district: branch.props.district ?? null,
        province: branch.props.province ?? null,
        supportsPickup: !!branch.props.supportsPickup,
        supportsDelivery: !!branch.props.supportsDelivery,
      }),
    );

    let selectedPair:
      | {
          branch: any;
          serviceArea: any;
        }
      | undefined;

    if (requestedBranchId && requestedBranchId > 0) {
      selectedPair = matchedBranchPairs.find(
        ({ branch }) => Number(branch.props.id) === requestedBranchId,
      );

      if (!selectedPair) {
        throw new Error(
          "Chi nhánh đã chọn hiện không hỗ trợ giao tới khu vực này",
        );
      }
    } else if (matchedBranchPairs.length === 1) {
      selectedPair = matchedBranchPairs[0];
    } else {
      return {
        subtotal,
        shippingFee: 0,
        discountAmount: 0,
        finalPrice: subtotal,
        shippingZone: {
          id: zone.id,
          code: zone.code,
          name: zone.name,
        },
        availableSlots: [],
        selectedSlot: null,
        selectedBranch: null,
        candidateBranches,
        requiresBranchSelection: true,
      };
    }

    const selectedBranch = selectedPair.branch;
    const selectedServiceArea = selectedPair.serviceArea;

    const shippingFeeRaw =
      selectedServiceArea.deliveryFeeOverride !== null &&
      selectedServiceArea.deliveryFeeOverride !== undefined
        ? Number(selectedServiceArea.deliveryFeeOverride)
        : Number(zone.baseFee ?? 0);

    const freeShipThreshold =
      zone.freeShipThreshold !== null && zone.freeShipThreshold !== undefined
        ? Number(zone.freeShipThreshold)
        : null;

    const shippingFee =
      freeShipThreshold !== null && subtotal >= freeShipThreshold
        ? 0
        : Math.max(0, shippingFeeRaw);

    const availableSlots = await this.getAvailableDeliverySlotsService.execute({
      branchId: Number(selectedBranch.props.id),
      deliveryDate,
    });

    let selectedSlot: any = null;

    if (deliveryTimeSlotId && deliveryTimeSlotId > 0) {
      selectedSlot =
        availableSlots.find((x) => x.id === deliveryTimeSlotId) ?? null;

      if (!selectedSlot) {
        throw new Error("Khung giờ giao hàng không tồn tại");
      }

      if (!selectedSlot.isAvailable) {
        throw new Error(
          selectedSlot.reason || "Khung giờ giao hàng không khả dụng",
        );
      }

      if (deliveryType === "same_day") {
        const now = new Date();
        const slotStart = toDateAtLocalTime(
          deliveryDate,
          selectedSlot.startTime,
        );
        if (slotStart <= now) {
          throw new Error("Không thể chọn khung giờ đã bắt đầu");
        }
      }
    }

    return {
      subtotal,
      shippingFee,
      discountAmount: 0,
      finalPrice: subtotal + shippingFee,
      shippingZone: {
        id: zone.id,
        code: zone.code,
        name: zone.name,
      },
      availableSlots,
      selectedSlot: selectedSlot
        ? {
            id: selectedSlot.id,
            label: selectedSlot.label,
          }
        : null,
      selectedBranch: {
        id: Number(selectedBranch.props.id),
        name: selectedBranch.props.name,
        code: selectedBranch.props.code ?? null,
        addressLine1: selectedBranch.props.addressLine1 ?? null,
        district: selectedBranch.props.district ?? null,
        province: selectedBranch.props.province ?? null,
        supportsPickup: !!selectedBranch.props.supportsPickup,
        supportsDelivery: !!selectedBranch.props.supportsDelivery,
      },
      candidateBranches,
      requiresBranchSelection: false,
    };
  }
}
