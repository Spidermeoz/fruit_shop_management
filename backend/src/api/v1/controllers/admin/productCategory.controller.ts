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
