import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import User from "../../models/user.model";
import Role from "../../models/role.model";

// GET /api/v1/admin/users
export const index = async (req: Request, res: Response) => {
  try {
    // 🔹 Pagination
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || 10), 10), 1),
      100
    );
    const offset = (page - 1) * limit;

    // 🔹 Keyword search
    const q =
      (req.query.q as string)?.trim() ||
      (req.query.keyword as string)?.trim() ||
      "";

    // 🔹 Filters
    const status = (req.query.status as string)?.trim();
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    // 🔹 Sorting
    let order: any[] = [["id", "ASC"]];
    if (req.query.sort) {
      const [col, dirRaw] = String(req.query.sort).split(":");
      const dir = (dirRaw || "asc").toUpperCase() as "ASC" | "DESC";
      const allowCols = [
        "id",
        "full_name",
        "email",
        "phone",
        "status",
        "created_at",
        "updated_at",
      ];
      if (allowCols.includes(col)) order = [[col, dir]];
    }

    // 🔹 Where conditions
    const where: any = {};
    if (!includeDeleted) where.deleted = 0;
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
      ];
    }

    // 🔹 Query users with their roles
    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "title"],
        },
      ],
      raw: false,
    });

    // 🔹 Response
    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        sort: order,
        keyword: q,
      },
    });
  } catch (err) {
    console.error("listUsers error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// GET /api/v1/admin/users/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const user = await User.findOne({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "title"],
        },
      ],
      raw: false,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    console.error("getUserDetail error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/admin/users/create
export const create = async (req: Request, res: Response) => {
  try {
    const {
      role_id,
      full_name,
      email,
      password,
      phone,
      avatar,
      status,
    } = req.body;

    // 🔹 Validate cơ bản
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email và mật khẩu là bắt buộc" });
    }

    // 🔹 Kiểm tra email trùng
    const existingUser = await User.findOne({
      where: { email, deleted: 0 },
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email đã tồn tại trong hệ thống" });
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Tạo user mới
    const newUser = await User.create({
      role_id: role_id || null,
      full_name: full_name || null,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone || null,
      avatar: avatar || null,
      status: status || "active",
      deleted: 0,
    });

    // 🔹 Lấy lại user có include Role để trả ra đẹp hơn
    const createdUser = await User.findByPk(newUser.id, {
      include: [{ model: Role, as: "role", attributes: ["id", "title"] }],
    });

    return res.status(201).json({
      success: true,
      message: "Tạo người dùng mới thành công",
      data: createdUser,
    });
  } catch (err: any) {
    console.error("createUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// GET /api/v1/admin/users/edit/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const user = await User.findOne({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "title"],
        },
      ],
      raw: false,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    console.error("getEditUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// PATCH /api/v1/admin/users/edit/:id
export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const { role_id, full_name, email, password, phone, avatar, status } =
      req.body;

    const user = await User.findOne({ where: { id, deleted: 0 } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or deleted" });
    }

    // 🔹 Cập nhật thông tin cơ bản
    if (role_id !== undefined) user.role_id = role_id || null;
    if (full_name !== undefined) user.full_name = full_name || null;
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = phone || null;
    if (avatar !== undefined) user.avatar = avatar || null;
    if (status !== undefined) user.status = status;

    // 🔹 Nếu có password mới
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // 🔹 Lấy lại user có include Role để trả ra frontend
    const updatedUser = await User.findByPk(id, {
      include: [{ model: Role, as: "role", attributes: ["id", "title"] }],
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err: any) {
    console.error("patchEditUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// PATCH /api/v1/admin/users/:id/status
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const { status } = req.body;

    // 🔹 Kiểm tra giá trị status hợp lệ
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // 🔹 Tìm user
    const user = await User.findOne({ where: { id, deleted: 0 } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or deleted" });
    }

    // 🔹 Cập nhật trạng thái
    user.status = status;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error("updateUserStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// DELETE /api/v1/admin/users/delete/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findOne({ where: { id, deleted: 0 } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted",
      });
    }

    // 🔹 Soft delete
    user.deleted = 1;
    user.deleted_at = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        deleted_at: user.deleted_at,
      },
    });
  } catch (err: any) {
    console.error("deleteUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// PATCH /api/v1/admin/users/bulk-edit
export const bulkEdit = async (req: Request, res: Response) => {
  try {
    const { ids, action, value } = req.body;

    // 🔹 Kiểm tra dữ liệu đầu vào
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User IDs are required" });
    }

    if (!action) {
      return res
        .status(400)
        .json({ success: false, message: "Action is required" });
    }

    // 🔹 Chuẩn hoá danh sách ID
    const validIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    if (validIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid user IDs provided" });
    }

    let affectedRows = 0;

    // 🔹 Xử lý theo hành động
    switch (action) {
      case "status":
        {
          const validStatuses = ["active", "inactive", "banned"];
          if (!validStatuses.includes(value)) {
            return res.status(400).json({
              success: false,
              message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
          }

          const [count] = await User.update(
            { status: value },
            { where: { id: { [Op.in]: validIds }, deleted: 0 } }
          );
          affectedRows = count;
        }
        break;

      case "delete":
        {
          const [count] = await User.update(
            { deleted: 1, deleted_at: new Date() },
            { where: { id: { [Op.in]: validIds }, deleted: 0 } }
          );
          affectedRows = count;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid action. Supported: status, role, delete, restore.",
        });
    }

    return res.status(200).json({
      success: true,
      message: `Bulk operation '${action}' applied successfully.`,
      affected: affectedRows,
    });
  } catch (err: any) {
    console.error("bulkEditUsers error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};