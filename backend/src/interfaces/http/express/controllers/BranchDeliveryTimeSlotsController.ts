import type { Request, Response } from "express";
import { ListBranchDeliveryTimeSlots } from "../../../../application/shipping/usecases/ListBranchDeliveryTimeSlots";
import { GetBranchDeliveryTimeSlotDetail } from "../../../../application/shipping/usecases/GetBranchDeliveryTimeSlotDetail";
import { CreateBranchDeliveryTimeSlot } from "../../../../application/shipping/usecases/CreateBranchDeliveryTimeSlot";
import { EditBranchDeliveryTimeSlot } from "../../../../application/shipping/usecases/EditBranchDeliveryTimeSlot";
import { ChangeBranchDeliveryTimeSlotStatus } from "../../../../application/shipping/usecases/ChangeBranchDeliveryTimeSlotStatus";
import { SoftDeleteBranchDeliveryTimeSlot } from "../../../../application/shipping/usecases/SoftDeleteBranchDeliveryTimeSlot";
import { BulkUpsertBranchDeliveryTimeSlots } from "../../../../application/shipping/usecases/BulkUpsertBranchDeliveryTimeSlots";
import { CopyBranchDeliveryTimeSlotsFromBranch } from "../../../../application/shipping/usecases/CopyBranchDeliveryTimeSlotsFromBranch";
import { BulkChangeBranchDeliveryTimeSlotStatus } from "../../../../application/shipping/usecases/BulkChangeBranchDeliveryTimeSlotStatus";

type Deps = {
  list: ListBranchDeliveryTimeSlots;
  detail: GetBranchDeliveryTimeSlotDetail;
  create: CreateBranchDeliveryTimeSlot;
  edit: EditBranchDeliveryTimeSlot;
  changeStatus: ChangeBranchDeliveryTimeSlotStatus;
  softDelete: SoftDeleteBranchDeliveryTimeSlot;
  bulkUpsert: BulkUpsertBranchDeliveryTimeSlots;
  copyFromBranch: CopyBranchDeliveryTimeSlotsFromBranch;
  bulkChangeStatus: BulkChangeBranchDeliveryTimeSlotStatus;
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

export class BranchDeliveryTimeSlotsController {
  constructor(private readonly deps: Deps) {}
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
      return res
        .status(200)
        .json({
          success: true,
          message:
            "Lấy danh sách cấu hình khung giờ giao hàng theo chi nhánh thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể lấy danh sách cấu hình khung giờ giao hàng theo chi nhánh.",
        });
    }
  };
  detail = async (req: Request, res: Response) => {
    try {
      const result = await this.deps.detail.execute(Number(req.params.id));
      return res
        .status(200)
        .json({
          success: true,
          message:
            "Lấy chi tiết cấu hình khung giờ giao hàng theo chi nhánh thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể lấy chi tiết cấu hình khung giờ giao hàng theo chi nhánh.",
        });
    }
  };
  create = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.create.execute as any)({
        branchId: req.body.branchId,
        deliveryTimeSlotId: req.body.deliveryTimeSlotId,
        maxOrdersOverride: req.body.maxOrdersOverride,
        status: req.body.status,
      }, buildActor(req));
      return res
        .status(201)
        .json({
          success: true,
          message:
            "Tạo cấu hình khung giờ giao hàng theo chi nhánh thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể tạo cấu hình khung giờ giao hàng theo chi nhánh.",
        });
    }
  };
  edit = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.edit.execute as any)({
        id: Number(req.params.id),
        branchId: req.body.branchId,
        deliveryTimeSlotId: req.body.deliveryTimeSlotId,
        maxOrdersOverride: req.body.maxOrdersOverride,
        status: req.body.status,
      }, buildActor(req));
      return res
        .status(200)
        .json({
          success: true,
          message:
            "Cập nhật cấu hình khung giờ giao hàng theo chi nhánh thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể cập nhật cấu hình khung giờ giao hàng theo chi nhánh.",
        });
    }
  };
  changeStatus = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.changeStatus.execute as any)({
        id: Number(req.params.id),
        status: req.body.status,
      }, buildActor(req));
      return res
        .status(200)
        .json({
          success: true,
          message:
            "Cập nhật trạng thái cấu hình khung giờ giao hàng theo chi nhánh thành công.",
          data: result,
        });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể cập nhật trạng thái cấu hình khung giờ giao hàng theo chi nhánh.",
        });
    }
  };
  softDelete = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.softDelete.execute as any)(Number(req.params.id), buildActor(req));
      return res
        .status(200)
        .json({ success: true, message: result.message, data: result });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể xóa cấu hình khung giờ giao hàng theo chi nhánh.",
        });
    }
  };
  bulkUpsert = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.bulkUpsert.execute as any)({
        items: Array.isArray(req.body?.items) ? req.body.items : [],
        mode: req.body?.mode,
      }, buildActor(req));
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể bulk upsert branch delivery time slots.",
        });
    }
  };
  copyFromBranch = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.copyFromBranch.execute as any)({
        sourceBranchId: Number(req.body?.sourceBranchId),
        targetBranchIds: Array.isArray(req.body?.targetBranchIds)
          ? req.body.targetBranchIds
          : [],
        mode: req.body?.mode,
        statusOverride: req.body?.statusOverride,
      }, buildActor(req));
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message || "Không thể copy branch delivery time slots.",
        });
    }
  };
  bulkChangeStatus = async (req: Request, res: Response) => {
    try {
      const result = await (this.deps.bulkChangeStatus.execute as any)({
        ids: Array.isArray(req.body?.ids) ? req.body.ids : [],
        status: req.body?.status,
      }, buildActor(req));
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "Không thể cập nhật trạng thái hàng loạt branch delivery time slots.",
        });
    }
  };
}
export function makeBranchDeliveryTimeSlotsController(deps: Deps) {
  return new BranchDeliveryTimeSlotsController(deps);
}
