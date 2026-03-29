import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";
import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";
import type { UpdateBranchServiceAreaPatch } from "../../../domain/shipping/branchServiceArea.types";

export class EditBranchServiceArea {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly branchRepo: BranchRepository,
    private readonly shippingZoneRepo: ShippingZoneRepository,
  ) {}

  async execute(id: number, patch: UpdateBranchServiceAreaPatch) {
    const serviceAreaId = Number(id);

    if (!serviceAreaId || serviceAreaId <= 0) {
      throw new Error("Branch service area id không hợp lệ");
    }

    const current = await this.branchServiceAreaRepo.findById(serviceAreaId);
    if (!current) {
      throw new Error("Không tìm thấy cấu hình vùng phục vụ");
    }

    const nextBranchId =
      patch.branchId !== undefined
        ? Number(patch.branchId)
        : Number(current.props.branchId);

    const nextShippingZoneId =
      patch.shippingZoneId !== undefined
        ? Number(patch.shippingZoneId)
        : Number(current.props.shippingZoneId);

    if (!nextBranchId || nextBranchId <= 0) {
      throw new Error("Chi nhánh không hợp lệ");
    }

    if (!nextShippingZoneId || nextShippingZoneId <= 0) {
      throw new Error("Vùng giao hàng không hợp lệ");
    }

    const branch = await this.branchRepo.findById(nextBranchId);
    if (!branch) {
      throw new Error("Chi nhánh không tồn tại");
    }

    const shippingZone =
      await this.shippingZoneRepo.findById(nextShippingZoneId);
    if (!shippingZone) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    const existed = await this.branchServiceAreaRepo.findByBranchAndZone(
      nextBranchId,
      nextShippingZoneId,
    );

    if (existed && existed.props.id !== serviceAreaId) {
      throw new Error("Chi nhánh đã có cấu hình cho vùng giao hàng này");
    }

    if (patch.deliveryFeeOverride !== undefined) {
      patch.deliveryFeeOverride =
        patch.deliveryFeeOverride === null
          ? null
          : Number(patch.deliveryFeeOverride);

      if (
        patch.deliveryFeeOverride !== null &&
        (!Number.isFinite(patch.deliveryFeeOverride) ||
          patch.deliveryFeeOverride < 0)
      ) {
        throw new Error("Phí giao hàng override không hợp lệ");
      }
    }

    if (patch.minOrderValue !== undefined) {
      patch.minOrderValue =
        patch.minOrderValue === null ? null : Number(patch.minOrderValue);

      if (
        patch.minOrderValue !== null &&
        (!Number.isFinite(patch.minOrderValue) || patch.minOrderValue < 0)
      ) {
        throw new Error("Giá trị đơn hàng tối thiểu không hợp lệ");
      }
    }

    if (patch.maxOrderValue !== undefined) {
      patch.maxOrderValue =
        patch.maxOrderValue === null ? null : Number(patch.maxOrderValue);

      if (
        patch.maxOrderValue !== null &&
        (!Number.isFinite(patch.maxOrderValue) || patch.maxOrderValue < 0)
      ) {
        throw new Error("Giá trị đơn hàng tối đa không hợp lệ");
      }
    }

    const nextMin =
      patch.minOrderValue !== undefined
        ? patch.minOrderValue
        : (current.props.minOrderValue ?? null);

    const nextMax =
      patch.maxOrderValue !== undefined
        ? patch.maxOrderValue
        : (current.props.maxOrderValue ?? null);

    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      throw new Error("Giá trị đơn hàng tối thiểu không được lớn hơn tối đa");
    }

    if (patch.status !== undefined) {
      const normalizedStatus = String(patch.status ?? "")
        .trim()
        .toLowerCase();

      if (!["active", "inactive"].includes(normalizedStatus)) {
        throw new Error("Trạng thái cấu hình vùng phục vụ không hợp lệ");
      }

      patch.status = normalizedStatus as "active" | "inactive";
    }

    const updated = await this.branchServiceAreaRepo.update(serviceAreaId, {
      ...patch,
      branchId: nextBranchId,
      shippingZoneId: nextShippingZoneId,
    });

    return updated.props;
  }
}
