import { Request, Response, NextFunction } from "express";
import type { ListUsers } from "../../../../application/users/usecases/ListUsers";
import type { GetUserDetail } from "../../../../application/users/usecases/GetUserDetail";
import type { CreateUser } from "../../../../application/users/usecases/CreateUser";
import type { EditUser } from "../../../../application/users/usecases/EditUser";
import type { UpdateUserStatus } from "../../../../application/users/usecases/UpdateUserStatus";
import type { SoftDeleteUser } from "../../../../application/users/usecases/SoftDeleteUser";
import type { BulkEditUsers } from "../../../../application/users/usecases/BulkEditUsers";
import type { UserSort } from "../../../../domain/users/types";

const toBool = (v: any) => v === true || v === "true" || v === 1 || v === "1";
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

const normalizeActorScope = (req: Request) => ({
  roleId:
    req.user?.roleId !== undefined && req.user?.roleId !== null
      ? Number(req.user.roleId)
      : null,
  branchIds: Array.isArray(req.user?.branchIds)
    ? req
        .user!.branchIds!.map(Number)
        .filter((x) => Number.isFinite(x) && x > 0)
    : [],
});

const normalizeBranchAssignments = (body: any) => {
  if (Array.isArray(body?.branchAssignments)) {
    return body.branchAssignments
      .map((x: any) => ({
        branchId: Number(x?.branchId ?? x?.branch_id),
        isPrimary:
          x?.isPrimary === true ||
          x?.is_primary === true ||
          x?.isPrimary === "true" ||
          x?.is_primary === "true" ||
          x?.isPrimary === 1 ||
          x?.is_primary === 1,
      }))
      .filter((x: any) => Number.isFinite(x.branchId) && x.branchId > 0);
  }

  const branchIds = Array.isArray(body?.branchIds)
    ? body.branchIds
    : Array.isArray(body?.branch_ids)
      ? body.branch_ids
      : [];

  const primaryBranchId = Number(
    body?.primaryBranchId ?? body?.primary_branch_id ?? 0,
  );

  return branchIds
    .map((id: any) => Number(id))
    .filter((id: number) => Number.isFinite(id) && id > 0)
    .map((branchId: number) => ({
      branchId,
      isPrimary: branchId === primaryBranchId,
    }));
};

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
  primary_branch_id: u.primaryBranchId ?? null,
  branch_ids: Array.isArray(u.branchAssignments)
    ? u.branchAssignments.map((x: any) => x.branchId)
    : [],
  branches: Array.isArray(u.branchAssignments)
    ? u.branchAssignments.map((x: any) => ({
        id: x.branch?.id ?? x.branchId,
        name: x.branch?.name ?? null,
        code: x.branch?.code ?? null,
        status: x.branch?.status ?? null,
        is_primary: !!x.isPrimary,
      }))
    : [],
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
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          keyword,
          status,
          includeDeleted,
          sortBy,
          order,
          type,
          branchId,
        } = req.query as Record<string, string>;

        const pg = toNum(page) ?? 1;
        const lm = toNum(limit) ?? 10;

        const result = await uc.list.execute({
          page: pg,
          limit: lm,
          q: (q || keyword || "").trim() || undefined,
          status: status ?? "all",
          includeDeleted: toBool(includeDeleted),
          sort: mapSort(sortBy, order),
          userType:
            type === "internal" || type === "customer" || type === "all"
              ? (type as "internal" | "customer" | "all")
              : "all",
          branchId: toNum(branchId) ?? null,
          actor: normalizeActorScope(req),
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

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const u = await uc.detail.execute(id, false, normalizeActorScope(req));
        if (!u) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }
        res.json({
          success: true,
          data: toLegacy(u),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const b = req.body as any;
        const created = await uc.create.execute(
          {
            roleId: b.roleId ?? b.role_id ?? null,
            fullName: b.fullName ?? b.full_name ?? null,
            email: b.email,
            password: b.password,
            phone: b.phone ?? null,
            avatar: b.avatar ?? null,
            status: b.status ?? "active",
            branchAssignments: normalizeBranchAssignments(b),
          },
          normalizeActorScope(req),
        );

        res.status(201).json({
          success: true,
          data: toLegacy(created),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const u = await uc.detail.execute(id, false, normalizeActorScope(req));
        if (!u) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }
        res.json({
          success: true,
          data: toLegacy(u),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const b = req.body as any;

        const updated = await uc.edit.execute(
          id,
          {
            roleId:
              b.roleId !== undefined
                ? (toNum(b.roleId) ?? null)
                : b.role_id !== undefined
                  ? (toNum(b.role_id) ?? null)
                  : undefined,
            fullName:
              b.fullName !== undefined
                ? b.fullName
                : b.full_name !== undefined
                  ? b.full_name
                  : undefined,
            email: b.email,
            password: b.password,
            phone: b.phone,
            avatar: b.avatar,
            status: b.status,
            branchAssignments:
              b.branchAssignments !== undefined ||
              b.branch_assignments !== undefined ||
              b.branchIds !== undefined ||
              b.branch_ids !== undefined ||
              b.primaryBranchId !== undefined ||
              b.primary_branch_id !== undefined
                ? normalizeBranchAssignments(b)
                : undefined,
          },
          normalizeActorScope(req),
        );

        res.json({
          success: true,
          data: { id: updated.id, user: toLegacy(updated.user) },
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    updateStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: "active" | "inactive" };
        if (!["active", "inactive"].includes(String(status))) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid status" });
        }
        const currentUserId = req.user?.id;

        if (!currentUserId) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized",
          });
        }

        const r = await uc.updateStatus.execute(id, status, currentUserId);
        res.json({
          success: true,
          data: r,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

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

    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const b = req.body as any;
        const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number) : [];
        const action = String(b.action || "");

        if (!ids.length) {
          return res.status(400).json({
            success: false,
            message: "Field 'ids' must be a non-empty array",
          });
        }

        if (action === "status") {
          const value = String(b.value || "");
          if (!["active", "inactive"].includes(value)) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid status value" });
          }
          const r = await uc.bulkEdit.execute({
            action: "status",
            ids,
            value: value as "active" | "inactive",
          });
          return res.json({
            success: true,
            data: r,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        if (action === "role") {
          const raw = b.value ?? b.roleId ?? b.role_id ?? null;
          const roleId = raw === "" ? null : raw === null ? null : Number(raw);
          const r = await uc.bulkEdit.execute({
            action: "role",
            ids,
            value: Number.isNaN(roleId) ? null : roleId,
          });
          return res.json({
            success: true,
            data: r,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        if (action === "delete") {
          const r = await uc.bulkEdit.execute({ action: "delete", ids });
          return res.json({
            success: true,
            data: r,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        if (action === "restore") {
          const r = await uc.bulkEdit.execute({ action: "restore", ids });
          return res.json({
            success: true,
            data: r,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        return res
          .status(400)
          .json({ success: false, message: `Unsupported action: ${action}` });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type UsersController = ReturnType<typeof makeUsersController>;
