import { Request, Response } from "express";
import { Op } from "sequelize";
import Product from "../../models/product.model";

/**
 * GET /api/v1/admin/products
 * Query hỗ trợ:
 *  - page, limit (mặc định 1, 10)
 *  - q (search theo title, slug)
 *  - status (active/inactive)
 *  - featured (0/1)
 *  - sort (vd: "created_at:desc", "price:asc")
 *  - includeDeleted (0/1) - mặc định 0 (chỉ bản ghi chưa xóa mềm)
 */
export const index = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || 10), 10), 1), 100);
    const offset = (page - 1) * limit;

    const q = (req.query.q as string)?.trim();
    const status = (req.query.status as string)?.trim();
    const featured = req.query.featured !== undefined ? Number(req.query.featured) : undefined;
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    // sort
    let order: any[] = [["id", "ASC"]];
    if (req.query.sort) {
      const [col, dirRaw] = String(req.query.sort).split(":");
      const dir = (dirRaw || "asc").toUpperCase() as "ASC" | "DESC";
      const allowCols = [
        "id","price","stock","position","average_rating","review_count",
        "created_at","updated_at","title","slug"
      ];
      if (allowCols.includes(col)) order = [[col, dir]];
    }

    // where
    const where: any = {};
    if (!includeDeleted) where.deleted = 0;
    if (status) where.status = status;
    if (featured === 0 || featured === 1) where.featured = featured;
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug:  { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order,
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        page, limit, total: count,
        totalPages: Math.ceil(count / limit),
        sort: order,
      },
    });
  } catch (err) {
    console.error("listProducts error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const detail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const product = await Product.findOne({ where, raw: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("detail error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};