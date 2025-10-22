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

// POST /api/v1/admin/product-category/create
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

    // ✅ Kiểm tra parent_id (nếu có)
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

    // ✅ Tính position nếu không được gửi
    let position: number;
    if (
      payload.position === undefined ||
      payload.position === null ||
      payload.position === ""
    ) {
      const whereCondition: any = { deleted: 0 };
      if (
        payload.parent_id === undefined ||
        payload.parent_id === null ||
        payload.parent_id === ""
      ) {
        whereCondition.parent_id = { [Op.is]: null };
      } else {
        whereCondition.parent_id = payload.parent_id;
      }

      const maxCategory = await ProductCategory.findOne({
        where: whereCondition,
        order: [["position", "DESC"]],
        attributes: ["position"],
        raw: true,
      });

      position = maxCategory?.position ? Number(maxCategory.position) + 1 : 1;
    } else {
      position = Number(payload.position);
    }

    // ✅ Tạo danh mục
    const newCategory = await ProductCategory.create({
      title: payload.title,
      parent_id:
        payload.parent_id === undefined || payload.parent_id === ""
          ? null
          : payload.parent_id,
      description: payload.description ?? null,
      thumbnail: payload.thumbnail ?? null,
      status: payload.status ?? "active",
      position,
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
    const { id } = req.params;

    // ✅ Validate ID
    const categoryId = Number(id);
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    // ✅ Lấy chi tiết danh mục + danh mục cha bằng quan hệ Sequelize
    const category = await ProductCategory.findOne({
      where: {
        id: categoryId,
        deleted: 0,
      },
      include: [
        {
          model: ProductCategory,
          as: "parent", // 👈 nhờ quan hệ belongsTo
          attributes: ["id", "title"],
        },
      ],
      attributes: [
        "id",
        "title",
        "parent_id",
        "description",
        "thumbnail",
        "status",
        "position",
        "slug",
        "created_at",
        "updated_at",
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // ✅ Chuyển dữ liệu trả về
    const data = {
      ...category.get({ plain: true }),
      parent_name: category.parent ? category.parent.title : null,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("detailProductCategory error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
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
    const category = await ProductCategory.findOne({
      where: { id, deleted: 0 },
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // 2️⃣ Kiểm tra parent_id (nếu có trong payload)
    if (payload.parent_id !== undefined) {
      // ép kiểu và chuẩn hóa
      const parentIdRaw = payload.parent_id;
      const parentId =
        parentIdRaw === null || parentIdRaw === "" ? null : Number(parentIdRaw);

      if (parentId === null) {
        // người dùng chọn danh mục gốc → parent_id = null
        payload.parent_id = null;
      } else {
        // chỉ kiểm tra nếu parentId là số hợp lệ > 0
        if (isNaN(parentId) || parentId <= 0) {
          payload.parent_id = null;
        } else {
          if (parentId === id) {
            return res.status(400).json({
              success: false,
              message: "A category cannot be its own parent.",
            });
          }

          const parent = await ProductCategory.findOne({
            where: { id: parentId, deleted: 0 },
          });

          if (!parent) {
            return res.status(400).json({
              success: false,
              message: `Parent category with id=${parentId} not found or deleted.`,
            });
          }

          // kiểm tra vòng lặp cha – con
          const descendants = await ProductCategory.findAll({
            where: { parent_id: id },
            attributes: ["id"],
            raw: true,
          });
          const childIds = descendants.map((c) => c.id);
          if (childIds.includes(parentId)) {
            return res.status(400).json({
              success: false,
              message: "Cannot set a child category as parent.",
            });
          }

          // hợp lệ → gán lại vào payload
          payload.parent_id = parentId;
        }
      }
    }

    // 3️⃣ Chuẩn bị dữ liệu cập nhật
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

    // 4️⃣ Tính lại position nếu đổi cha hoặc chưa có
    const newParentId = payload.parent_id ?? category.parent_id ?? null;
    const parentChanged =
      payload.parent_id !== undefined &&
      Number(payload.parent_id) !== category.parent_id;

    if (
      parentChanged ||
      payload.position === undefined ||
      payload.position === null ||
      payload.position === ""
    ) {
      const maxSibling = await ProductCategory.findOne({
        where: {
          deleted: 0,
          parent_id: newParentId,
          id: { [Op.ne]: id },
        },
        order: [["position", "DESC"]],
        attributes: ["position"],
        raw: true,
      });

      updateData.position = maxSibling?.position
        ? Number(maxSibling.position) + 1
        : 1;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    // 5️⃣ Cập nhật DB
    await ProductCategory.update(updateData, { where: { id } });

    // 6️⃣ Trả về bản ghi sau khi cập nhật
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
    console.error("editPatchProductCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
// PATCH /api/v1/admin/product-category/:id/status
export const updateProductCategoryStatus = async (
  req: Request,
  res: Response
) => {
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
export const softDeleteProductCategory = async (
  req: Request,
  res: Response
) => {
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

    // 1️⃣ Kiểm tra danh mục có tồn tại không
    const category = await ProductCategory.findOne({
      where: { id: categoryId, deleted: 0 },
      raw: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found or already deleted.",
      });
    }

    // 2️⃣ Kiểm tra xem có danh mục con không
    const children = await ProductCategory.findAll({
      where: { parent_id: categoryId, deleted: 0 },
      attributes: ["id", "title"],
      raw: true,
    });

    // 3️⃣ Nếu có con → reset parent_id = null
    if (children.length > 0) {
      await ProductCategory.update(
        { parent_id: null, updated_at: new Date() },
        { where: { parent_id: categoryId } }
      );
    }

    // 4️⃣ Xóa mềm danh mục cha
    await ProductCategory.update(
      {
        deleted: 1,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      { where: { id: categoryId } }
    );

    // 5️⃣ Trả phản hồi
    return res.status(200).json({
      success: true,
      message:
        children.length > 0
          ? `Category '${category.title}' deleted. ${children.length} child category(ies) have been detached (parent_id set to null).`
          : "Product category soft-deleted successfully.",
      data: {
        id: categoryId,
        deletedAt: new Date().toISOString(),
        detachedChildren: children.map((c) => ({ id: c.id, title: c.title })),
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
        // 1️⃣ Xóa mềm danh mục cha
        await ProductCategory.update(
          {
            deleted: 1,
            deleted_at: now,
            updated_at: now,
          },
          { where: { id: { [Op.in]: ids } } }
        );

        // 2️⃣ Set parent_id = null cho các danh mục con
        await ProductCategory.update(
          {
            parent_id: null,
            updated_at: now,
          },
          { where: { parent_id: { [Op.in]: ids }, deleted: 0 } }
        );

        return res.status(200).json({
          success: true,
          message: "Soft-deleted categories and detached their children.",
          data: {
            affectedIds: ids,
            action,
            updatedAt: now.toISOString(),
          },
        });

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
