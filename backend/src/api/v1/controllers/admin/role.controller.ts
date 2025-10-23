// controllers/admin/roleController.ts
import { Request, Response } from "express";
import Role from "../../models/role.model";

// GET /api/v1/admin/roles
export const index = async (req: Request, res: Response) => {
  try {
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = {};
    if (!includeDeleted) where.deleted = 0;

    const roles = await Role.findAll({
      where,
      order: [["id", "ASC"]],
      raw: false,
    });

    return res.status(200).json({
      success: true,
      data: roles,
      meta: {
        total: roles.length,
        includeDeleted,
      },
    });
  } catch (err) {
    console.error("listRoles error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// GET /api/v1/admin/roles/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role ID" });
    }

    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const role = await Role.findOne({ where });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (err) {
    console.error("roleDetail error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/admin/roles/create
export const create = async (req: Request, res: Response) => {
  try {
    const { title, description, permissions } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const newRole = await Role.create({
      title: title.trim(),
      description: description || null,
      permissions: permissions || null,
      deleted: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (err: any) {
    console.error("createRole error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// GET /api/v1/admin/roles/edit/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role ID" });
    }

    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const role = await Role.findOne({ where });
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (err: any) {
    console.error("getEditRole error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// PATCH /api/v1/admin/roles/edit/:id
export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role ID" });
    }

    const { title, description, permissions } = req.body;

    const role = await Role.findOne({ where: { id, deleted: 0 } });
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found or deleted" });
    }

    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Title cannot be empty" });
      }
      role.title = title.trim();
    }

    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (err: any) {
    console.error("patchEditRole error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// DELETE /api/v1/admin/roles/delete/:id
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role ID" });
    }

    const role = await Role.findOne({ where: { id, deleted: 0 } });
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found or already deleted" });
    }

    role.deleted = 1;
    role.deleted_at = new Date();
    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      data: { id: role.id, title: role.title },
    });
  } catch (err: any) {
    console.error("deleteRole error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// GET /api/v1/admin/roles/permissions
export const permissions = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Lấy toàn bộ roles trong hệ thống
    const roles = await Role.findAll({
      where: { deleted: 0 },
      attributes: ["id", "title", "permissions"],
      order: [["id", "ASC"]],
      raw: true,
    });

    // 2️⃣ Danh sách module & action (đây là cấu trúc cố định cho UI)
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

    // 3️⃣ Xây dữ liệu để UI render
    const data = modules.map((mod) => {
      const actions = mod.actions.map((action) => {
        const rolesStatus = roles.map((role) => {
          const perms = (role.permissions || {}) as Record<string, string[]>;
          const checked = !!(
            perms &&
            perms[mod.key] &&
            perms[mod.key].includes(action.key)
          );
          return {
            role_id: role.id,
            role_title: role.title,
            checked,
          };
        });

        return {
          action_key: action.key,
          action_label: action.label,
          roles: rolesStatus,
        };
      });

      return {
        group: mod.group,
        key: mod.key,
        actions,
      };
    });

    // 4️⃣ Trả kết quả gồm cả roles & data cho frontend
    return res.status(200).json({
      success: true,
      roles: roles.map((r) => ({
        id: r.id,
        title: r.title,
        permissions: r.permissions || {},
      })),
      data,
    });
  } catch (err: any) {
    console.error("getPermissions error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// PATCH /api/v1/admin/roles/permissions
export const permissionsPatch = async (req: Request, res: Response) => {
  try {
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid roles data" });
    }

    // Cập nhật tuần tự từng role
    for (const r of roles) {
      if (!r.id) continue;

      // Đảm bảo permissions là object hợp lệ
      let permissions = r.permissions;
      if (typeof permissions === "string") {
        try {
          permissions = JSON.parse(permissions);
        } catch {
          permissions = {};
        }
      }

      // Lưu vào DB
      await Role.update(
        { permissions },
        { where: { id: r.id, deleted: 0 } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
    });
  } catch (err: any) {
    console.error("updatePermissions error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
