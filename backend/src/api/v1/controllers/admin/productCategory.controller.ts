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