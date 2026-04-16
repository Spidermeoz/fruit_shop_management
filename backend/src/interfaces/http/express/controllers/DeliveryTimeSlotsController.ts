import type { Request, Response } from "express";
import { ListDeliveryTimeSlots } from "../../../../application/shipping/usecases/ListDeliveryTimeSlots";
import { GetDeliveryTimeSlotDetail } from "../../../../application/shipping/usecases/GetDeliveryTimeSlotDetail";
import { CreateDeliveryTimeSlot } from "../../../../application/shipping/usecases/CreateDeliveryTimeSlot";
import { EditDeliveryTimeSlot } from "../../../../application/shipping/usecases/EditDeliveryTimeSlot";
import { ChangeDeliveryTimeSlotStatus } from "../../../../application/shipping/usecases/ChangeDeliveryTimeSlotStatus";
import { SoftDeleteDeliveryTimeSlot } from "../../../../application/shipping/usecases/SoftDeleteDeliveryTimeSlot";

type DeliveryTimeSlotsControllerDeps = {
  list: ListDeliveryTimeSlots;
  detail: GetDeliveryTimeSlotDetail;
  create: CreateDeliveryTimeSlot;
  edit: EditDeliveryTimeSlot;
  changeStatus: ChangeDeliveryTimeSlotStatus;
  softDelete: SoftDeleteDeliveryTimeSlot;
};

export class DeliveryTimeSlotsController {
  constructor(private readonly deps: DeliveryTimeSlotsControllerDeps) {}

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
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Lấy danh sách khung giờ giao hàng thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message || "Không thể lấy danh sách khung giờ giao hàng.",
        });
    }
  };

  detail = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.detail.execute(id);
      return res
        .status(200)
        .json({
          success: true,
          message: "Lấy chi tiết khung giờ giao hàng thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message || "Không thể lấy chi tiết khung giờ giao hàng.",
        });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.deps.create.execute({
        code: req.body.code,
        label: req.body.label,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        cutoffMinutes: req.body.cutoffMinutes,
        maxOrders: req.body.maxOrders,
        sortOrder: req.body.sortOrder,
        status: req.body.status,
      });
      return res
        .status(201)
        .json({
          success: true,
          message: "Tạo khung giờ giao hàng thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message: error.message || "Không thể tạo khung giờ giao hàng.",
        });
    }
  };

  edit = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.edit.execute({
        id,
        code: req.body.code,
        label: req.body.label,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        cutoffMinutes: req.body.cutoffMinutes,
        maxOrders: req.body.maxOrders,
        sortOrder: req.body.sortOrder,
        status: req.body.status,
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Cập nhật khung giờ giao hàng thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message: error.message || "Không thể cập nhật khung giờ giao hàng.",
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
      return res
        .status(200)
        .json({
          success: true,
          message: "Cập nhật trạng thái khung giờ giao hàng thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể cập nhật trạng thái khung giờ giao hàng.",
        });
    }
  };

  softDelete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.softDelete.execute(id);
      return res
        .status(200)
        .json({ success: true, message: result.message, data: result });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message: error.message || "Không thể xóa khung giờ giao hàng.",
        });
    }
  };
}

export function makeDeliveryTimeSlotsController(
  deps: DeliveryTimeSlotsControllerDeps,
) {
  return new DeliveryTimeSlotsController(deps);
}
