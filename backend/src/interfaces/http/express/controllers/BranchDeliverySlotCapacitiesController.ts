import type { Request, Response } from "express";
import { ListBranchDeliverySlotCapacities } from "../../../../application/shipping/usecases/ListBranchDeliverySlotCapacities";
import { GetBranchDeliverySlotCapacityDetail } from "../../../../application/shipping/usecases/GetBranchDeliverySlotCapacityDetail";
import { CreateBranchDeliverySlotCapacity } from "../../../../application/shipping/usecases/CreateBranchDeliverySlotCapacity";
import { EditBranchDeliverySlotCapacity } from "../../../../application/shipping/usecases/EditBranchDeliverySlotCapacity";
import { ChangeBranchDeliverySlotCapacityStatus } from "../../../../application/shipping/usecases/ChangeBranchDeliverySlotCapacityStatus";
import { SoftDeleteBranchDeliverySlotCapacity } from "../../../../application/shipping/usecases/SoftDeleteBranchDeliverySlotCapacity";

type BranchDeliverySlotCapacitiesControllerDeps = {
  list: ListBranchDeliverySlotCapacities;
  detail: GetBranchDeliverySlotCapacityDetail;
  create: CreateBranchDeliverySlotCapacity;
  edit: EditBranchDeliverySlotCapacity;
  changeStatus: ChangeBranchDeliverySlotCapacityStatus;
  softDelete: SoftDeleteBranchDeliverySlotCapacity;
};

export class BranchDeliverySlotCapacitiesController {
  constructor(
    private readonly deps: BranchDeliverySlotCapacitiesControllerDeps,
  ) {}

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
        deliveryDate: req.query.deliveryDate
          ? String(req.query.deliveryDate)
          : "",
      });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách branch delivery slot capacities thành công.",
        data: result.items,
        meta: {
          total: result.total,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể lấy danh sách branch delivery slot capacities.",
      });
    }
  };

  detail = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.deps.detail.execute(id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết branch delivery slot capacity thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể lấy chi tiết branch delivery slot capacity.",
      });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.deps.create.execute({
        branchId: Number(req.body.branchId),
        deliveryDate: String(req.body.deliveryDate),
        deliveryTimeSlotId: Number(req.body.deliveryTimeSlotId),
        maxOrders:
          req.body.maxOrders === null ||
          req.body.maxOrders === undefined ||
          req.body.maxOrders === ""
            ? null
            : Number(req.body.maxOrders),
        status: req.body.status,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo branch delivery slot capacity thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Không thể tạo branch delivery slot capacity.",
      });
    }
  };

  edit = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const result = await this.deps.edit.execute({
        id,
        branchId: Number(req.body.branchId),
        deliveryDate: String(req.body.deliveryDate),
        deliveryTimeSlotId: Number(req.body.deliveryTimeSlotId),
        maxOrders:
          req.body.maxOrders === null ||
          req.body.maxOrders === undefined ||
          req.body.maxOrders === ""
            ? null
            : Number(req.body.maxOrders),
        status: req.body.status,
      });

      return res.status(200).json({
        success: true,
        message: "Cập nhật branch delivery slot capacity thành công.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Không thể cập nhật branch delivery slot capacity.",
      });
    }
  };

  changeStatus = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const status = req.body.status as "active" | "inactive";

      await this.deps.changeStatus.execute(id, status);

      return res.status(200).json({
        success: true,
        message:
          "Cập nhật trạng thái branch delivery slot capacity thành công.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Không thể cập nhật trạng thái branch delivery slot capacity.",
      });
    }
  };

  softDelete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      await this.deps.softDelete.execute(id);

      return res.status(200).json({
        success: true,
        message: "Xóa branch delivery slot capacity thành công.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Không thể xóa branch delivery slot capacity.",
      });
    }
  };
}

export function makeBranchDeliverySlotCapacitiesController(
  deps: BranchDeliverySlotCapacitiesControllerDeps,
) {
  return new BranchDeliverySlotCapacitiesController(deps);
}
