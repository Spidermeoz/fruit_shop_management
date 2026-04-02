import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { ShippingZoneRepository } from "../../../domain/shipping/ShippingZoneRepository";
import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";
import type { CreateBranchServiceAreaInput } from "../../../domain/shipping/branchServiceArea.types";

export class CreateBranchServiceArea {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
    private readonly branchRepo: BranchRepository,
    private readonly shippingZoneRepo: ShippingZoneRepository,
  ) {}

  async execute(input: CreateBranchServiceAreaInput) {
    const branchId = Number(input.branchId);
    const shippingZoneId = Number(input.shippingZoneId);

    if (!branchId || branchId <= 0) {
      throw new Error("Chi nhánh không hợp lệ");
    }

    if (!shippingZoneId || shippingZoneId <= 0) {
      throw new Error("Vùng giao hàng không hợp lệ");
    }

    const branch = await this.branchRepo.findById(branchId);
    if (!branch) {
      throw new Error("Chi nhánh không tồn tại");
    }

    const shippingZone = await this.shippingZoneRepo.findById(shippingZoneId);
    if (!shippingZone) {
      throw new Error("Vùng giao hàng không tồn tại");
    }

    const deliveryFeeOverride =
      input.deliveryFeeOverride !== undefined &&
      input.deliveryFeeOverride !== null
        ? Number(input.deliveryFeeOverride)
        : null;

    if (
      deliveryFeeOverride !== null &&
      (!Number.isFinite(deliveryFeeOverride) || deliveryFeeOverride < 0)
    ) {
      throw new Error("Phí giao hàng override không hợp lệ");
    }

    const minOrderValue =
      input.minOrderValue !== undefined && input.minOrderValue !== null
        ? Number(input.minOrderValue)
        : null;

    if (
      minOrderValue !== null &&
      (!Number.isFinite(minOrderValue) || minOrderValue < 0)
    ) {
      throw new Error("Giá trị đơn hàng tối thiểu không hợp lệ");
    }

    const maxOrderValue =
      input.maxOrderValue !== undefined && input.maxOrderValue !== null
        ? Number(input.maxOrderValue)
        : null;

    if (
      maxOrderValue !== null &&
      (!Number.isFinite(maxOrderValue) || maxOrderValue < 0)
    ) {
      throw new Error("Giá trị đơn hàng tối đa không hợp lệ");
    }

    if (
      minOrderValue !== null &&
      maxOrderValue !== null &&
      minOrderValue > maxOrderValue
    ) {
      throw new Error("Giá trị đơn hàng tối thiểu không được lớn hơn tối đa");
    }

    const status = String(input.status ?? "active")
      .trim()
      .toLowerCase();

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái cấu hình vùng phục vụ không hợp lệ");
    }

    const existed = await this.branchServiceAreaRepo.findByBranchAndZone(
      branchId,
      shippingZoneId,
    );

    if (existed) {
      throw new Error("Chi nhánh đã có cấu hình cho vùng giao hàng này");
    }

    const supportsSameDay = input.supportsSameDay ?? true;

    const deletedCandidate =
      await this.branchServiceAreaRepo.findDeletedByBranchAndZone(
        branchId,
        shippingZoneId,
      );

    if (deletedCandidate) {
      const revived = await this.branchServiceAreaRepo.revive(
        deletedCandidate.props.id!,
        {
          branchId,
          shippingZoneId,
          deliveryFeeOverride,
          minOrderValue,
          maxOrderValue,
          supportsSameDay,
          status: status as "active" | "inactive",
        },
      );

      return revived.props;
    }

    const created = await this.branchServiceAreaRepo.create({
      branchId,
      shippingZoneId,
      deliveryFeeOverride,
      minOrderValue,
      maxOrderValue,
      supportsSameDay,
      status: status as "active" | "inactive",
    });

    return created.props;
  }
}
