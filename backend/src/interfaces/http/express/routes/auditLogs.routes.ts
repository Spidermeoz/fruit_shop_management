import { Router } from "express";
import type { AuditLogsController } from "../controllers/AuditLogsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const auditLogsRoutes = (
  controller: AuditLogsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("audit_log", "view"), controller.list);
  r.post("/create", auth, can("audit_log", "create"), controller.create);

  return r;
};
