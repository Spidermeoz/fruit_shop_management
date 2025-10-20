import { Request, Response } from "express";
import { Op } from "sequelize";
import ProductCategory from "../../models/product-category.model";
import Product from "../../models/product.model";

// GET /api/v1/admin/product-category
export const index = async (req: Request, res: Response) => {
  try {
    // ===== Pagination =====
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || 20), 10), 1),
      100
    );
    const offset = (page - 1) * limit;

    // ===== Filters =====
    const q =
      (req.query.q as string)?.trim() ||
      (req.query.keyword as string)?.trim() ||
      "";
    const status = (req.query.status as string)?.trim(); // active/inactive
    const parent_id = req.query.parent_id
      ? Number(req.query.parent_id)
      : undefined;
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    // ===== Where clause =====
    const where: any = {};
    if (!includeDeleted) where.deleted = 0;
    if (status) where.status = status;
    if (parent_id !== undefined) where.parent_id = parent_id;
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
      ];
    }

    // ===== Sort (mặc định theo position ASC) =====
    let order: any[] = [["position", "ASC"]];
    if (req.query.sort) {
      const [col, dirRaw] = String(req.query.sort).split(":");
      const dir = (dirRaw || "asc").toUpperCase() as "ASC" | "DESC";
      const allowCols = [
        "id",
        "title",
        "status",
        "position",
        "created_at",
        "updated_at",
      ];
      if (allowCols.includes(col)) order = [[col, dir]];
    }

    // ===== Query DB =====
    const { rows, count } = await ProductCategory.findAndCountAll({
      where,
      limit,
      offset,
      order,
      raw: true,
    });

    // ===== Optional: build tree (nếu muốn hiển thị theo cấp) =====
    const treeView = req.query.tree === "1";
    let data = rows;

    if (treeView) {
      const map: Record<number, any> = {};
      rows.forEach((cat) => (map[cat.id] = { ...cat, children: [] }));
      const roots: any[] = [];

      rows.forEach((cat) => {
        if (cat.parent_id && map[cat.parent_id]) {
          map[cat.parent_id].children.push(map[cat.id]);
        } else {
          roots.push(map[cat.id]);
        }
      });

      data = roots;
    }

    // ===== Response =====
    return res.status(200).json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        filters: { q, status, parent_id },
      },
    });
  } catch (error) {
    console.error("getAllCategories error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/admin/product-category
export const create = async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<Record<string, any>>;

    // ===== Validate =====
    if (!payload.title || typeof payload.title !== "string") {
      return res.status(400).json({
        success: false,
        message: "Field 'title' is required and must be a string.",
      });
    }

    // Nếu có parent_id, đảm bảo parent tồn tại và chưa bị xóa
    if (payload.parent_id) {
      const parent = await ProductCategory.findOne({
        where: { id: payload.parent_id, deleted: 0 },
      });
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: `Parent category with id=${payload.parent_id} not found or deleted.`,
        });
      }
    }

    // ===== Tạo danh mục =====
    const newCategory = await ProductCategory.create({
      title: payload.title,
      parent_id: payload.parent_id ?? null,
      description: payload.description ?? null,
      thumbnail: payload.thumbnail ?? null,
      status: payload.status ?? "active",
      position: payload.position ?? null,
      deleted: 0,
      deleted_at: null,
    });

    return res.status(201).json({
      success: true,
      message: "Product category created successfully.",
      data: newCategory,
    });
  } catch (error: any) {
    console.error("createProductCategory error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

// GET /api/v1/admin/product-category/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Lấy thông tin danh mục chính
    const category = await ProductCategory.findOne({
      where: { id, deleted: 0 },
      raw: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // Lấy danh mục cha (nếu có)
    let parent = null;
    if (category.parent_id) {
      parent = await ProductCategory.findOne({
        where: { id: category.parent_id, deleted: 0 },
        attributes: ["id", "title", "slug"],
        raw: true,
      });
    }

    // Lấy danh sách danh mục con
    const children = await ProductCategory.findAll({
      where: { parent_id: id, deleted: 0 },
      attributes: ["id", "title", "slug", "status", "position"],
      order: [["position", "ASC"]],
      raw: true,
    });

    // (Tuỳ chọn) Lấy tổng số sản phẩm thuộc danh mục này
    const productCount = await Product.count({
      where: { product_category_id: id, deleted: 0 },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...category,
        parent,
        children,
        product_count: productCount,
      },
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("getProductCategoryById error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /api/v1/admin/product-category/edit/:id
export const editProductCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // 1️⃣ Lấy chi tiết danh mục
    const category = await ProductCategory.findOne({
      where: { id, deleted: 0 },
      raw: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // 2️⃣ Lấy danh mục cha (nếu có)
    let parent = null;
    if (category.parent_id) {
      parent = await ProductCategory.findOne({
        where: { id: category.parent_id, deleted: 0 },
        attributes: ["id", "title", "slug"],
        raw: true,
      });
    }

    // 3️⃣ Lấy tất cả danh mục khác để chọn làm parent (loại trừ chính nó)
    const allCategories = await ProductCategory.findAll({
      where: {
        id: { [Op.ne]: id },
        deleted: 0,
        status: "active",
      },
      attributes: ["id", "title", "slug", "parent_id"],
      order: [["position", "ASC"]],
      raw: true,
    });

    // 4️⃣ Gợi ý option status
    const statusOptions = [
      { value: "active", label: "Hoạt động" },
      { value: "inactive", label: "Dừng hoạt động" },
    ];

    // 5️⃣ Trả kết quả
    return res.status(200).json({
      success: true,
      data: {
        category,
        parent,
        formOptions: {
          status: statusOptions,
          parents: allCategories, // dropdown chọn danh mục cha
        },
      },
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("getProductCategoryForEdit error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// PATCH /api/v1/admin/product-category/edit/:id
export const editPatchProductCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body as Partial<Record<string, any>>;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // 1️⃣ Kiểm tra danh mục có tồn tại không
    const category = await ProductCategory.findOne({ where: { id, deleted: 0 } });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // 2️⃣ Nếu có parent_id → kiểm tra hợp lệ
    if (payload.parent_id) {
      if (Number(payload.parent_id) === id) {
        return res.status(400).json({
          success: false,
          message: "A category cannot be its own parent.",
        });
      }

      const parent = await ProductCategory.findOne({
        where: { id: payload.parent_id, deleted: 0 },
      });

      if (!parent) {
        return res.status(400).json({
          success: false,
          message: `Parent category with id=${payload.parent_id} not found or deleted.`,
        });
      }

      // (Tuỳ chọn) kiểm tra vòng lặp cha–con (chống chọn con của chính nó làm cha)
      const descendants = await ProductCategory.findAll({
        where: { parent_id: id },
        attributes: ["id"],
        raw: true,
      });
      const childIds = descendants.map((c) => c.id);
      if (childIds.includes(Number(payload.parent_id))) {
        return res.status(400).json({
          success: false,
          message: "Cannot set a child category as parent.",
        });
      }
    }

    // 3️⃣ Chuẩn bị dữ liệu để cập nhật
    const allowedFields = [
      "title",
      "description",
      "thumbnail",
      "status",
      "position",
      "parent_id",
      "slug",
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (payload[key] !== undefined) updateData[key] = payload[key];
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // 4️⃣ Thực hiện cập nhật
    await ProductCategory.update(updateData, { where: { id } });

    // 5️⃣ Lấy dữ liệu mới sau update
    const updated = await ProductCategory.findOne({
      where: { id },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: "Product category updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("editProductCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// PATCH /api/v1/admin/product-category/:id/status
export const updateProductCategoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ✅ Validate id
    const categoryId = Number(id);
    if (!categoryId) {
      console.error("Invalid category ID:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // ✅ Validate status
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    // ✅ Kiểm tra danh mục tồn tại
    const category = await ProductCategory.findOne({
      where: { id: categoryId, deleted: 0 },
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // ✅ Cập nhật trạng thái
    await ProductCategory.update(
      { status, updated_at: new Date() },
      { where: { id: categoryId } }
    );

    // ✅ Lấy lại dữ liệu sau khi cập nhật
    const updated = await ProductCategory.findOne({
      where: { id: categoryId },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: `Product category status updated to '${status}'`,
      data: updated,
    });
  } catch (error) {
    console.error("updateProductCategoryStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE /api/v1/admin/product-category/delete/:id
export const softDeleteProductCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted_by_id = (req.body?.deleted_by_id as number) ?? null;

    const categoryId = Number(id);
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // 1️⃣ Kiểm tra danh mục tồn tại
    const category = await ProductCategory.findOne({
      where: { id: categoryId, deleted: 0 },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found or already deleted",
      });
    }

    // 2️⃣ Thực hiện xóa mềm
    await ProductCategory.update(
      {
        deleted: 1,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      { where: { id: categoryId } }
    );

    return res.status(200).json({
      success: true,
      message: "Product category soft-deleted successfully.",
      meta: {
        deletedAt: new Date().toISOString(),
        deletedBy: deleted_by_id,
      },
    });
  } catch (error) {
    console.error("softDeleteProductCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// PATCH /api/v1/admin/product-category/bulk-edit
export const bulkEditProductCategory = async (req: Request, res: Response) => {
  try {
    const { ids, action, value, updated_by_id } = req.body;

    // ✅ Validate cơ bản
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Field 'ids' must be a non-empty array.",
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "Field 'action' is required (status | delete | position).",
      });
    }

    const now = new Date();
    let resultMessage = "";
    let updateData: any = {};

    // ✅ Xử lý hành động
    switch (action) {
      case "status":
        if (!["active", "inactive"].includes(value)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status value. Must be 'active' or 'inactive'.",
          });
        }
        updateData = {
          status: value,
          updated_at: now,
        };
        resultMessage = `Categories status updated to '${value}'.`;
        break;

      case "delete":
        updateData = {
          deleted: 1,
          deleted_at: now,
          updated_at: now,
        };
        resultMessage = "Categories soft-deleted successfully.";
        break;

      case "position":
        if (typeof value !== "object" || Array.isArray(value)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid 'value' for position update. Must be an object {id: position}.",
          });
        }

        // cập nhật riêng từng danh mục
        for (const id of ids) {
          const pos = value[id];
          if (pos !== undefined && !isNaN(pos)) {
            await ProductCategory.update(
              { position: pos, updated_at: now },
              { where: { id } }
            );
          }
        }

        return res.status(200).json({
          success: true,
          message: "Categories positions updated successfully.",
        });

      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported action '${action}'.`,
        });
    }

    // ✅ Update hàng loạt (status | delete)
    await ProductCategory.update(updateData, {
      where: { id: { [Op.in]: ids } },
    });

    return res.status(200).json({
      success: true,
      message: resultMessage,
      data: {
        affectedIds: ids,
        action,
        updatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("bulkEditProductCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};