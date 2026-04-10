import type { Request, Response, NextFunction } from "express";
import { GetAdminDashboard } from "../../../../application/dashboard/usecases/GetAdminDashboard";
import type { DashboardRange } from "../../../../domain/dashboard/types";

const normalizeRange = (value: unknown): DashboardRange => {
  const raw = String(value ?? "7d")
    .trim()
    .toLowerCase();
  if (raw === "today") return "today";
  if (raw === "30d") return "30d";
  return "7d";
};

export const makeDashboardController = (uc: {
  getAdminDashboard: GetAdminDashboard;
}) => {
  return {
    summary: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const branchIdRaw = req.query.branchId;
        const branchId =
          branchIdRaw !== undefined &&
          branchIdRaw !== null &&
          String(branchIdRaw).trim() !== "" &&
          Number(branchIdRaw) > 0
            ? Number(branchIdRaw)
            : null;

        const range = normalizeRange(req.query.range);

        const data = await uc.getAdminDashboard.execute({
          actor: req.user ?? {},
          branchId,
          range,
        });

        return res.json({
          success: true,
          data,
        });
      } catch (error) {
        next(error);
      }
    },
  };
};

export type DashboardController = ReturnType<typeof makeDashboardController>;
