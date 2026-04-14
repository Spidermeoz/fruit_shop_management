import { Request, Response, NextFunction } from "express";

import type { ListRoles } from "../../../../application/roles/usecases/ListRoles";
import type { GetRoleDetail } from "../../../../application/roles/usecases/GetRoleDetail";
import type { CreateRole } from "../../../../application/roles/usecases/CreateRole";
import type { UpdateRole } from "../../../../application/roles/usecases/UpdateRole";
import type { SoftDeleteRole } from "../../../../application/roles/usecases/SoftDeleteRole";
import type { GetRolePermissions } from "../../../../application/roles/usecases/GetRolePermissions";
import type { UpdateRolePermissions } from "../../../../application/roles/usecases/UpdateRolePermissions";
import type { ListRolesForPermissions } from "../../../../application/roles/usecases/ListRolesForPermissions";
import type { ListAssignableRoles } from "../../../../application/roles/usecases/ListAssignableRoles";

const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

const toNum = (v: any) =>
  v === null || v === undefined || v === "" ? undefined : Number(v);

const toScope = (v: any): "system" | "branch" | "client" | undefined => {
  if (v === "system" || v === "branch" || v === "client") {
    return v;
  }
  return undefined;
};

const normalizePermissions = (
  input: unknown,
): Record<string, string[]> | undefined => {
  if (input === undefined || input === null) return undefined;

  if (typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const entries = Object.entries(input as Record<string, any>).reduce(
    (acc, [k, v]) => {
      if (Array.isArray(v)) {
        acc[k] = v.map((x) => String(x));
      } else if (v != null) {
        acc[k] = [String(v)];
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return entries;
};

const mapRoleView = (role: any) => ({
  id: role?.id ?? null,
  code: role?.code ?? null,
  scope: role?.scope ?? null,
  level: role?.level ?? null,

  isAssignable: role?.isAssignable ?? role?.is_assignable ?? null,
  isProtected: role?.isProtected ?? role?.is_protected ?? null,
  is_assignable: role?.is_assignable ?? role?.isAssignable ?? null,
  is_protected: role?.is_protected ?? role?.isProtected ?? null,

  title: role?.title ?? null,
  description: role?.description ?? null,
  permissions: role?.permissions ?? {},

  deleted: role?.deleted ?? false,
  deletedAt: role?.deletedAt ?? role?.deleted_at ?? null,
  deleted_at: role?.deleted_at ?? role?.deletedAt ?? null,
  createdAt: role?.createdAt ?? role?.created_at ?? null,
  created_at: role?.created_at ?? role?.createdAt ?? null,
  updatedAt: role?.updatedAt ?? role?.updated_at ?? null,
  updated_at: role?.updated_at ?? role?.updatedAt ?? null,
});

export const makeRolesController = (uc: {
  list: ListRoles;
  listAssignable: ListAssignableRoles;
  detail: GetRoleDetail;
  create: CreateRole;
  update: UpdateRole;
  softDelete: SoftDeleteRole;
  getPermissions: GetRolePermissions;
  updatePermissions: UpdateRolePermissions;
  listForPermissions: ListRolesForPermissions;
  bulkUpdatePermissions: UpdateRolePermissions;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, includeDeleted, scope, assignableOnly } =
          req.query as Record<string, string>;

        const pg = toNum(page) ?? 1;
        const lm = toNum(limit) ?? 10;

        const result = await uc.list.execute({
          q: q?.trim() || undefined,
          includeDeleted: toBool(includeDeleted),
          scope: toScope(scope),
          assignableOnly: toBool(assignableOnly) ?? false,
        });

        res.json({
          success: true,
          data: result.rows.map((role: any) => mapRoleView(role)),
          meta: { total: result.count, page: pg, limit: lm },
        });
      } catch (e) {
        next(e);
      }
    },

    assignable: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user ?? null;

        const roles = await uc.listAssignable.execute({
          actorRoleCode: actor?.roleCode ?? null,
          actorLevel: actor?.roleLevel ?? null,
          actorIsSuperAdmin: actor?.isSuperAdmin === true,
        });

        res.json({
          success: true,
          data: roles.map((role: any) => mapRoleView(role)),
          meta: {
            total: Array.isArray(roles) ? roles.length : 0,
            page: 1,
            limit: Array.isArray(roles) ? roles.length : 0,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const role = await uc.detail.execute(id);

        if (!role) {
          return res
            .status(404)
            .json({ success: false, message: "Role not found" });
        }

        const out = mapRoleView(role as any);

        res.json({
          success: true,
          data: out,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          code?: string;
          scope?: "system" | "branch" | "client";
          level?: number;
          isAssignable?: boolean;
          isProtected?: boolean;
          title: string;
          description?: string | null;
          permissions?: unknown;
        };

        const title = String(payload.title ?? "").trim();
        if (!title) {
          return res.status(400).json({
            success: false,
            message: "Role title is required",
          });
        }

        const normalizedPermissions = normalizePermissions(payload.permissions);

        const fallbackCode = title
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "_")
          .replace(/^_+|_+$/g, "");

        const finalCode = String(payload.code ?? fallbackCode)
          .trim()
          .toLowerCase();

        if (!finalCode) {
          return res.status(400).json({
            success: false,
            message: "Role code is required",
          });
        }

        const created = await uc.create.execute({
          code: finalCode,
          scope: payload.scope ?? "branch",
          level:
            payload.level === undefined || payload.level === null
              ? 10
              : Number(payload.level),
          isAssignable: payload.isAssignable ?? true,
          isProtected: payload.isProtected ?? false,
          title,
          description: payload.description ?? null,
          permissions: normalizedPermissions ?? {},
        });

        res.status(201).json({
          success: true,
          data: mapRoleView(created as any),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const role = await uc.detail.execute(id);

        if (!role) {
          return res
            .status(404)
            .json({ success: false, message: "Role not found" });
        }

        const out = mapRoleView(role as any);

        res.json({
          success: true,
          data: out,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const body = req.body as Partial<{
          code: string;
          scope: "system" | "branch" | "client";
          level: number;
          isAssignable: boolean;
          isProtected: boolean;
          title: string;
          description: string | null;
          permissions: unknown;
        }>;

        if (body.title !== undefined && !String(body.title).trim()) {
          return res.status(400).json({
            success: false,
            message: "Role title cannot be empty",
          });
        }

        if (body.code !== undefined && !String(body.code).trim()) {
          return res.status(400).json({
            success: false,
            message: "Role code cannot be empty",
          });
        }

        const normalizedPermissions = normalizePermissions(body.permissions);

        const patch: Partial<{
          code: string;
          scope: "system" | "branch" | "client";
          level: number;
          isAssignable: boolean;
          isProtected: boolean;
          title: string;
          description: string | null;
          permissions: Record<string, string[]>;
        }> = {};

        if (body.code !== undefined)
          patch.code = String(body.code).trim().toLowerCase();
        if (body.scope !== undefined) patch.scope = body.scope;
        if (body.level !== undefined) patch.level = Number(body.level);
        if (body.isAssignable !== undefined)
          patch.isAssignable = !!body.isAssignable;
        if (body.isProtected !== undefined)
          patch.isProtected = !!body.isProtected;
        if (body.title !== undefined) patch.title = String(body.title);
        if (body.description !== undefined) {
          patch.description = body.description ?? null;
        }
        if (body.permissions !== undefined) {
          if (normalizedPermissions === undefined) {
            return res.status(400).json({
              success: false,
              message: "Invalid permissions format",
            });
          }
          patch.permissions = normalizedPermissions;
        }

        const updated = await uc.update.execute(id, patch);

        res.json({
          success: true,
          data: mapRoleView(updated as any),
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await uc.softDelete.execute(id);

        res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    getPermissions: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const permissions = await uc.getPermissions.execute(id);

        res.json({
          success: true,
          data: permissions,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    updatePermissions: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const id = Number(req.params.id);
        const { permissions } = req.body as { permissions: unknown };

        const normalizedPermissions = normalizePermissions(permissions);

        if (normalizedPermissions === undefined) {
          return res.status(400).json({
            success: false,
            message: "Invalid permissions format",
          });
        }

        const updated = await uc.updatePermissions.execute({
          id,
          permissions: normalizedPermissions,
        });

        res.json({
          success: true,
          message: "Permissions updated successfully",
          data: updated,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    permissionsMatrix: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const roles = await uc.listForPermissions.execute();

        const modules = [
          {
            group: "Chi nhánh",
            key: "branch",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Kho hàng",
            key: "inventory",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Vùng giao hàng",
            key: "shipping_zone",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Khu vực phục vụ chi nhánh",
            key: "branch_service_area",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Khung giờ giao hàng",
            key: "delivery_time_slot",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Mapping chi nhánh và khung giờ giao hàng",
            key: "branch_delivery_time_slot",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Mapping chi nhánh và năng lực giao hàng",
            key: "branch_delivery_slot_capacity",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Danh mục sản phẩm",
            key: "product_category",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Sản phẩm",
            key: "product",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Xuất xứ",
            key: "origin",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Tag sản phẩm",
            key: "product_tag",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Content",
            key: "post",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Content tags",
            key: "post_tag",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Content categories",
            key: "post_category",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Nhóm quyền",
            key: "role",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
              { key: "permissions", label: "Phân quyền" },
            ],
          },
          {
            group: "Tài khoản",
            key: "user",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Khuyến mãi",
            key: "promotion",
            actions: [
              { key: "view", label: "Xem" },
              { key: "create", label: "Thêm mới" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", label: "Xóa" },
            ],
          },
          {
            group: "Đơn hàng",
            key: "order",
            actions: [
              { key: "view", label: "Xem" },
              { key: "update_status", label: "Cập nhật trạng thái" },
              { key: "add_history", label: "Thêm lịch sử giao hàng" },
              { key: "add_payment", label: "Thêm thanh toán" },
            ],
          },
          {
            group: "Đánh giá sản phẩm",
            key: "review",
            actions: [
              { key: "view", label: "Xem đánh giá" },
              { key: "reply", label: "Trả lời đánh giá" },
            ],
          },
          {
            group: "Cài đặt hệ thống",
            key: "setting",
            actions: [
              { key: "view", label: "Xem" },
              { key: "update", label: "Cập nhật" },
            ],
          },
        ];

        const data = modules.map((mod) => {
          const actions = mod.actions.map((action) => {
            const rolesStatus = roles.map((r) => {
              const perms = (r.permissions || {}) as Record<string, string[]>;
              const checked = !!perms[mod.key]?.includes(action.key);
              return { role_id: r.id, role_title: r.title, checked };
            });

            return {
              action_key: action.key,
              action_label: action.label,
              roles: rolesStatus,
            };
          });

          return { group: mod.group, key: mod.key, actions };
        });

        return res.json({
          success: true,
          roles: roles.map((r) => ({
            id: r.id,
            code: r.code,
            scope: r.scope,
            level: r.level,
            is_assignable: r.isAssignable,
            is_protected: r.isProtected,
            title: r.title,
            permissions: r.permissions || {},
          })),
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    permissionsPatchMatrix: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const { roles } = req.body as {
          roles: Array<{ id: number; permissions: any }>;
        };

        if (!Array.isArray(roles)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid roles data" });
        }

        const norm = roles
          .filter((r) => r && r.id)
          .map((r) => {
            let p = r.permissions;
            if (typeof p === "string") {
              try {
                p = JSON.parse(p);
              } catch {
                p = {};
              }
            }
            return {
              id: Number(r.id),
              permissions:
                p && typeof p === "object" && !Array.isArray(p) ? p : {},
            };
          });

        await uc.bulkUpdatePermissions.execute(norm);

        return res.json({
          success: true,
          message: "Permissions updated successfully",
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type RolesController = ReturnType<typeof makeRolesController>;
