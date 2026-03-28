import { Request, Response, NextFunction } from "express";
import { SetInventoryStock } from "../../../../application/inventory/usecases/SetInventoryStock";
import { ListInventoryStocks } from "../../../../application/inventory/usecases/ListInventoryStocks";

export const makeInventoryController = (uc: {
  setStock: SetInventoryStock;
  list: ListInventoryStocks;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.query as Record<string, string>;

        const branchId =
          query.branchId !== undefined && query.branchId !== ""
            ? Number(query.branchId)
            : null;

        const q = String(query.q ?? "").trim();
        const status = query.status ?? "all";

        const data = await uc.list.execute({
          branchId,
          q,
          status,
        });

        return res.json({
          success: true,
          data,
          meta: {
            total: data.length,
            page: 1,
            limit: data.length || 10,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    setStock: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as {
          branchId?: number | string;
          productVariantId?: number | string;
          quantity?: number | string;
          note?: string | null;
        };

        const branchId = Number(body.branchId);
        const productVariantId = Number(body.productVariantId);
        const quantity = Number(body.quantity ?? 0);

        const currentUserId =
          (req as any)?.user?.id !== undefined &&
          (req as any)?.user?.id !== null
            ? Number((req as any).user.id)
            : null;

        const result = await uc.setStock.execute({
          branchId,
          productVariantId,
          quantity,
          note: body.note ?? null,
          createdById: currentUserId,
        });

        return res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type InventoryController = ReturnType<typeof makeInventoryController>;
