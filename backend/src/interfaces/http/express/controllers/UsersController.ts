import { Request, Response, NextFunction } from "express";
import type { ListUsers } from "../../../../application/users/usecases/ListUsers";
import type { GetUserDetail } from "../../../../application/users/usecases/GetUserDetail";
import type { CreateUser } from "../../../../application/users/usecases/CreateUser";
import type { EditUser } from "../../../../application/users/usecases/EditUser";
import type { UpdateUserStatus } from "../../../../application/users/usecases/UpdateUserStatus";
import type { SoftDeleteUser } from "../../../../application/users/usecases/SoftDeleteUser";
import type { BulkEditUsers } from "../../../../application/users/usecases/BulkEditUsers";
import type { UserSort } from "../../../../domain/users/types";

const toBool = (v: any) =>
  v === true || v === "true" || v === 1 || v === "1";
const toNum = (v: any) =>
  v === null || v === undefined || v === "" ? undefined : Number(v);

const mapSort = (sortBy?: string, order?: string): UserSort | undefined => {
  const allowed = new Set([
    "id",
    "full_name",
    "email",
    "phone",
    "status",
    "created_at",
    "updated_at",
  ]);
  const col = sortBy && allowed.has(sortBy) ? (sortBy as any) : "id";
  const dir = order && String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { column: col, dir };
};

// camel -> legacy (snake) for FE
const toLegacy = (u: any) => ({
  id: u.id,
  role_id: u.roleId,
  full_name: u.fullName,
  email: u.email,
  phone: u.phone,
  avatar: u.avatar,
  status: u.status,
  deleted: u.deleted,
  deleted_at: u.deletedAt,
  created_at: u.createdAt,
  updated_at: u.updatedAt,
  role: u.role ? { id: u.role.id, title: u.role.title } : null,
});

export const makeUsersController = (uc: {
  list: ListUsers;
  detail: GetUserDetail;
  create: CreateUser;
  edit: EditUser;
  updateStatus: UpdateUserStatus;
  softDelete: SoftDeleteUser;
  bulkEdit: BulkEditUsers;
}) => {
  return {
    // GET /
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, keyword, status, includeDeleted, sortBy, order } =
          req.query as Record<string, string>;

        const pg = toNum(page) ?? 1;
        const lm = toNum(limit) ?? 10;

        const result = await uc.list.execute({
          page: pg,
          limit: lm,
          q: (q || keyword || "").trim() || undefined,
          status: status ?? "all",
          includeDeleted: toBool(includeDeleted),
          sort: mapSort(sortBy, order),
        });

        res.json({
          success: true,
          data: result.rows.map(toLegacy),
          meta: { total: result.count, page: pg, limit: lm },
        });
      } catch (e) {
        next(e);
      }
    },

    // GET /detail/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const u = await uc.detail.execute(id);
        if (!u) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, data: toLegacy(u), meta: { total: 0, page: 1, limit: 10 } });
      } catch (e) {
        next(e);
      }
    },

    // POST /create
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const b = req.body as any;
        const created = await uc.create.execute({
          roleId: b.roleId ?? b.role_id ?? null,
          fullName: b.fullName ?? b.full_name ?? null,
          email: b.email,
          password: b.password, // plain
          phone: b.phone ?? null,
          avatar: b.avatar ?? null,
          status: b.status ?? "active",
        });
        res.status(201).json({
          success: true,
          data: toLegacy(created),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // GET /edit/:id
    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const u = await uc.detail.execute(id);
        if (!u) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, data: toLegacy(u), meta: { total: 0, page: 1, limit: 10 } });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /edit/:id
    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const b = req.body as any;

        const updated = await uc.edit.execute(id, {
          roleId:
            b.roleId !== undefined
              ? toNum(b.roleId) ?? null
              : b.role_id !== undefined
              ? toNum(b.role_id) ?? null
              : undefined,
          fullName:
            b.fullName !== undefined ? b.fullName : b.full_name !== undefined ? b.full_name : undefined,
          email: b.email,
          password: b.password, // plain (optional)
          phone: b.phone,
          avatar: b.avatar,
          status: b.status,
        });

        res.json({
          success: true,
          data: { id: updated.id, user: toLegacy(updated.user) },
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /:id/status
    updateStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: "active" | "inactive" };
        if (!["active", "inactive"].includes(String(status))) {
          return res.status(400).json({ success: false, message: "Invalid status" });
        }
        const r = await uc.updateStatus.execute(id, status);
        res.json({
          success: true,
          data: r,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // DELETE /delete/:id  (soft-delete)
    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const r = await uc.softDelete.execute(id);
        res.json({
          success: true,
          data: r,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /bulk-edit
    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const b = req.body as any;
        const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number) : [];
        const action = String(b.action || "");

        if (!ids.length) {
          return res.status(400).json({ success: false, message: "Field 'ids' must be a non-empty array" });
        }

        if (action === "status") {
          const value = String(b.value || "");
          if (!["active", "inactive"].includes(value)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
          }
          const r = await uc.bulkEdit.execute({ action: "status", ids, value: value as "active" | "inactive" });
          return res.json({ success: true, data: r, meta: { total: 0, page: 1, limit: 10 } });
        }

        if (action === "role") {
          const raw = b.value ?? b.roleId ?? b.role_id ?? null;
          const roleId = raw === "" ? null : raw === null ? null : Number(raw);
          const r = await uc.bulkEdit.execute({ action: "role", ids, value: Number.isNaN(roleId) ? null : roleId });
          return res.json({ success: true, data: r, meta: { total: 0, page: 1, limit: 10 } });
        }

        if (action === "delete") {
          const r = await uc.bulkEdit.execute({ action: "delete", ids });
          return res.json({ success: true, data: r, meta: { total: 0, page: 1, limit: 10 } });
        }

        if (action === "restore") {
          const r = await uc.bulkEdit.execute({ action: "restore", ids });
          return res.json({ success: true, data: r, meta: { total: 0, page: 1, limit: 10 } });
        }

        return res.status(400).json({ success: false, message: `Unsupported action: ${action}` });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type UsersController = ReturnType<typeof makeUsersController>;
