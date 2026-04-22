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



const getActorId = (req: Request): number | null => {
  const user = (req as any).user ?? (req as any).authUser ?? null;
  const rawId = user?.id ?? user?.userId ?? user?.adminId ?? user?.sub ?? null;

  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const buildActor = (req: Request) => ({
  id: getActorId(req),
  roleId:
    (req as any)?.user?.roleId ??
    (req as any)?.authUser?.roleId ??
    null,
  roleCode:
    (req as any)?.user?.roleCode ??
    (req as any)?.authUser?.roleCode ??
    null,
  roleLevel:
    (req as any)?.user?.roleLevel ??
    (req as any)?.authUser?.roleLevel ??
    null,
  isSuperAdmin:
    (req as any)?.user?.isSuperAdmin === true ||
    (req as any)?.authUser?.isSuperAdmin === true,
  branchIds:
    (req as any)?.user?.branchIds ??
    (req as any)?.authUser?.branchIds ??
    [],
  requestId: (req as any)?.requestId ?? null,
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
});

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
      const result = await (this.deps.create.execute as any)({
        code: req.body.code,
        label: req.body.label,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        cutoffMinutes: req.body.cutoffMinutes,
        maxOrders: req.body.maxOrders,
        sortOrder: req.body.sortOrder,
        status: req.body.status,
      }, buildActor(req));
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
      const result = await (this.deps.edit.execute as any)({
        id,
        code: req.body.code,
        label: req.body.label,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        cutoffMinutes: req.body.cutoffMinutes,
        maxOrders: req.body.maxOrders,
        sortOrder: req.body.sortOrder,
        status: req.body.status,
      }, buildActor(req));
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
      const result = await (this.deps.changeStatus.execute as any)({
        id,
        status: req.body.status,
      }, buildActor(req));
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
      const result = await (this.deps.softDelete.execute as any)(id, buildActor(req));
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
