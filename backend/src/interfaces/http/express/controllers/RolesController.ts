// src/interfaces/http/express/controllers/RolesController.ts
import { Request, Response, NextFunction } from "express";

import type { ListRoles } from "../../../../application/roles/usecases/ListRoles";
import type { GetRoleDetail } from "../../../../application/roles/usecases/GetRoleDetail";
import type { CreateRole } from "../../../../application/roles/usecases/CreateRole";
import type { UpdateRole } from "../../../../application/roles/usecases/UpdateRole";
import type { SoftDeleteRole } from "../../../../application/roles/usecases/SoftDeleteRole";
import type { GetRolePermissions } from "../../../../application/roles/usecases/GetRolePermissions";
import type { UpdateRolePermissions } from "../../../../application/roles/usecases/UpdateRolePermissions";
import type { ListRolesForPermissions } from "../../../../application/roles/usecases/ListRolesForPermissions";
import type { UpdateRolePermissions as BulkUpdateRolePermissions } from "../../../../application/roles/usecases/UpdateRolePermissions";

const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";
const toNum = (v: any) => (v === undefined ? undefined : Number(v));

export const makeRolesController = (uc: {
  list: ListRoles;
  detail: GetRoleDetail;
  create: CreateRole;
  update: UpdateRole;
  softDelete: SoftDeleteRole;
  getPermissions: GetRolePermissions;
  updatePermissions: UpdateRolePermissions;
  listForPermissions: ListRolesForPermissions;
  bulkUpdatePermissions: BulkUpdateRolePermissions;
}) => {
  return {
    // GET /api/v1/admin/roles
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, includeDeleted } = req.query as Record<
          string,
          string
        >;
        const pg = toNum(page) ?? 1;
        const lm = toNum(limit) ?? 10;

        // cast to any to avoid strict mismatch with ListRolesInput shape
        const listInput: any = {
          page: pg,
          limit: lm,
          q: q?.trim() || undefined,
          includeDeleted: toBool(includeDeleted),
        };

        const result = await uc.list.execute(listInput);

        res.json({
          success: true,
          data: result.rows,
          meta: { total: result.count, page: pg, limit: lm },
        });
      } catch (e) {
        next(e);
      }
    },

    // GET /api/v1/admin/roles/detail/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const role = await uc.detail.execute(id);
        if (!role) {
          return res
            .status(404)
            .json({ success: false, message: "Role not found" });
        }

        // map createdAt/updatedAt -> created_at/updated_at for frontend
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

    // POST /api/v1/admin/roles/create
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          title: string;
          description?: string | null;
          permissions?: unknown; // optional khi tạo mới
        };

        // Normalize permissions -> Record<string, string[]> | null
        let normalizedPermissions: Record<string, string[]> | null = null;
        if (
          payload.permissions &&
          typeof payload.permissions === "object" &&
          !Array.isArray(payload.permissions)
        ) {
          const entries = Object.entries(
            payload.permissions as Record<string, any>
          ).reduce((acc, [k, v]) => {
            if (Array.isArray(v)) {
              acc[k] = v.map((x) => String(x));
            } else if (v != null) {
              // single value -> convert to single-element array
              acc[k] = [String(v)];
            }
            return acc;
          }, {} as Record<string, string[]>);
          normalizedPermissions = Object.keys(entries).length ? entries : null;
        }

        const created = await uc.create.execute({
          title: payload.title,
          description: payload.description ?? null,
          permissions: normalizedPermissions,
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

    // GET /api/v1/admin/roles/edit/:id  (giống detail để FE lấy form)
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

    // PATCH /api/v1/admin/roles/edit/:id
    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const body = req.body as Partial<{
          title: string;
          description: string | null;
          permissions: unknown;
        }>;

        // Normalize permissions if provided
        let normalizedPermissions: Record<string, string[]> | null | undefined =
          undefined;
        if (body.permissions !== undefined) {
          if (body.permissions === null) {
            normalizedPermissions = null;
          } else if (
            typeof body.permissions === "object" &&
            !Array.isArray(body.permissions)
          ) {
            const entries = Object.entries(
              body.permissions as Record<string, any>
            ).reduce((acc, [k, v]) => {
              if (Array.isArray(v)) acc[k] = v.map((x) => String(x));
              else if (v != null) acc[k] = [String(v)];
              return acc;
            }, {} as Record<string, string[]>);
            normalizedPermissions = Object.keys(entries).length
              ? entries
              : null;
          } else {
            return res.status(400).json({
              success: false,
              message: "Invalid permissions format",
            });
          }
        }

        // Build patch matching Partial<CreateRoleInput>
        const patch: Partial<{
          title: string;
          description: string | null;
          permissions: Record<string, string[]> | null;
        }> = {};
        if (body.title !== undefined) patch.title = String(body.title);
        if (body.description !== undefined)
          patch.description = body.description ?? null;
        if (normalizedPermissions !== undefined)
          patch.permissions = normalizedPermissions;

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

    // DELETE /api/v1/admin/roles/delete/:id (soft delete)
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

    // GET /api/v1/admin/roles/:id/permissions
    getPermissions: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const permissions = await uc.getPermissions.execute(id);
        // Giữ format như controller cũ: { success, data: permissions }
        res.json({
          success: true,
          data: permissions,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // PUT /api/v1/admin/roles/:id/permissions
    updatePermissions: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const id = Number(req.params.id);
        let { permissions } = req.body as { permissions: unknown };

        const invalid =
          permissions === undefined ||
          permissions === null ||
          (typeof permissions !== "object" && !Array.isArray(permissions));
        if (invalid) {
          return res.status(400).json({
            success: false,
            message: "Invalid permissions format",
          });
        }

        // Pass a single object argument (id + permissions) — works with typical signatures
        const updated = await (uc.updatePermissions as any).execute({
          id,
          permissions,
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

    // GET /api/v1/admin/roles/permissions  (GLOBAL)
    permissionsMatrix: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const roles = await uc.listForPermissions.execute(); // [{id,title,permissions}]
        // Danh sách module & action — copy đúng cấu trúc cũ
        const modules = [
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

    // PATCH /api/v1/admin/roles/permissions  (GLOBAL)
    permissionsPatchMatrix: async (
      req: Request,
      res: Response,
      next: NextFunction
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

        // Chuẩn hoá permissions: string JSON -> object
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
              permissions: p && typeof p === "object" ? p : {},
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
