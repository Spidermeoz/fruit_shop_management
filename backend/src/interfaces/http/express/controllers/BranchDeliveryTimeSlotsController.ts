import type { Request, Response } from "express";
import { ListBranchDeliveryTimeSlots } from "../../../../application/shipping/usecases/ListBranchDeliveryTimeSlots";
import { GetBranchDeliveryTimeSlotDetail } from "../../../../application/shipping/usecases/GetBranchDeliveryTimeSlotDetail";
import { CreateBranchDeliveryTimeSlot } from "../../../../application/shipping/usecases/CreateBranchDeliveryTimeSlot";
import { EditBranchDeliveryTimeSlot } from "../../../../application/shipping/usecases/EditBranchDeliveryTimeSlot";
import { ChangeBranchDeliveryTimeSlotStatus } from "../../../../application/shipping/usecases/ChangeBranchDeliveryTimeSlotStatus";
import { SoftDeleteBranchDeliveryTimeSlot } from "../../../../application/shipping/usecases/SoftDeleteBranchDeliveryTimeSlot";

type BranchDeliveryTimeSlotsControllerDeps = {
  list: ListBranchDeliveryTimeSlots;
  detail: GetBranchDeliveryTimeSlotDetail;
  create: CreateBranchDeliveryTimeSlot;
  edit: EditBranchDeliveryTimeSlot;
  changeStatus: ChangeBranchDeliveryTimeSlotStatus;
  softDelete: SoftDeleteBranchDeliveryTimeSlot;
};

export class BranchDeliveryTimeSlotsController {
  constructor(private readonly deps: BranchDeliveryTimeSlotsControllerDeps) {}

  list = async (req: Request, res: Response) => {
    try {
      const result = await this.deps.list.execute({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        keyword: req.query.keyword
          ? String(req.query.keyword)
          : req.query.q
            ? String(req.query.q)
            : "",
        status: req.query.status ? String(req.query.status) : "",
        branchId: req.query.branchId ? Number(req.query.branchId) : undefined,
        deliveryTimeSlotId: req.query.deliveryTimeSlotId
          ? Number(req.query.deliveryTimeSlotId)
          : undefined,
      });

      return res.status(200).json({
        success: true,
        message:
          "Lấy danh sách cấu hình khung giờ giao hàng theo chi nhánh thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể lấy danh sách cấu hình khung giờ giao hàng theo chi nhánh.",
      });
    }
  };

  detail = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.detail.execute(id);

      return res.status(200).json({
        success: true,
        message:
          "Lấy chi tiết cấu hình khung giờ giao hàng theo chi nhánh thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể lấy chi tiết cấu hình khung giờ giao hàng theo chi nhánh.",
      });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.deps.create.execute({
        branchId: req.body.branchId,
        deliveryTimeSlotId: req.body.deliveryTimeSlotId,
        maxOrdersOverride: req.body.maxOrdersOverride,
        status: req.body.status,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo cấu hình khung giờ giao hàng theo chi nhánh thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể tạo cấu hình khung giờ giao hàng theo chi nhánh.",
      });
    }
  };

  edit = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.edit.execute({
        id,
        branchId: req.body.branchId,
        deliveryTimeSlotId: req.body.deliveryTimeSlotId,
        maxOrdersOverride: req.body.maxOrdersOverride,
        status: req.body.status,
      });

      return res.status(200).json({
        success: true,
        message:
          "Cập nhật cấu hình khung giờ giao hàng theo chi nhánh thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể cập nhật cấu hình khung giờ giao hàng theo chi nhánh.",
      });
    }
  };

  changeStatus = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.changeStatus.execute({
        id,
        status: req.body.status,
      });

      return res.status(200).json({
        success: true,
        message:
          "Cập nhật trạng thái cấu hình khung giờ giao hàng theo chi nhánh thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể cập nhật trạng thái cấu hình khung giờ giao hàng theo chi nhánh.",
      });
    }
  };

  softDelete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.softDelete.execute(id);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể xóa cấu hình khung giờ giao hàng theo chi nhánh.",
      });
    }
  };
}

export function makeBranchDeliveryTimeSlotsController(
  deps: BranchDeliveryTimeSlotsControllerDeps,
) {
  return new BranchDeliveryTimeSlotsController(deps);
}
