import { Request, Response, NextFunction } from "express";

import type { ListRoles } from "../../../../application/roles/usecases/ListRoles";
import type { GetRoleDetail } from "../../../../application/roles/usecases/GetRoleDetail";
import type { CreateRole } from "../../../../application/roles/usecases/CreateRole";
import type { UpdateRole } from "../../../../application/roles/usecases/UpdateRole";
import type { SoftDeleteRole } from "../../../../application/roles/usecases/SoftDeleteRole";
import type { GetRolePermissions } from "../../../../application/roles/usecases/GetRolePermissions";
import type { UpdateRolePermissions } from "../../../../application/roles/usecases/UpdateRolePermissions";
import type { ListRolesForPermissions } from "../../../../application/roles/usecases/ListRolesForPermissions";

const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

const toNum = (v: any) =>
  v === null || v === undefined || v === "" ? undefined : Number(v);

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

export const makeRolesController = (uc: {
  list: ListRoles;
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
        const { page, limit, q, includeDeleted } = req.query as Record<
          string,
          string
        >;

        const pg = toNum(page) ?? 1;
        const lm = toNum(limit) ?? 10;

        const result = await uc.list.execute({
          q: q?.trim() || undefined,
          includeDeleted: toBool(includeDeleted),
        });

        res.json({
          success: true,
          data: result.rows,
          meta: { total: result.count, page: pg, limit: lm },
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

        const out = {
          ...(role as any),
          created_at:
            (role as any).created_at ?? (role as any).createdAt ?? null,
          updated_at:
            (role as any).updated_at ?? (role as any).updatedAt ?? null,
        };

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
          title: string;
          description?: string | null;
          permissions?: unknown;
        };

        const normalizedPermissions = normalizePermissions(payload.permissions);

        const created = await uc.create.execute({
          title: payload.title,
          description: payload.description ?? null,
          permissions: normalizedPermissions ?? {},
        });

        res.status(201).json({
          success: true,
          data: created,
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

        const out = {
          ...(role as any),
          created_at:
            (role as any).created_at ?? (role as any).createdAt ?? null,
          updated_at:
            (role as any).updated_at ?? (role as any).updatedAt ?? null,
        };

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
          title: string;
          description: string | null;
          permissions: unknown;
        }>;

        const normalizedPermissions = normalizePermissions(body.permissions);

        const patch: Partial<{
          title: string;
          description: string | null;
          permissions: Record<string, string[]>;
        }> = {};

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
          data: updated,
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
