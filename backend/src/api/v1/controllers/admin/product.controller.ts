import { Request, Response } from "express";
import { Op } from "sequelize";
import Product from "../../models/product.model";

// GET /api/v1/admin/products
export const index = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || 10), 10), 1),
      100
    );
    const offset = (page - 1) * limit;

    const q = (req.query.q as string)?.trim();
    const status = (req.query.status as string)?.trim();
    const featured =
      req.query.featured !== undefined ? Number(req.query.featured) : undefined;
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    // sort
    let order: any[] = [["id", "ASC"]];
    if (req.query.sort) {
      const [col, dirRaw] = String(req.query.sort).split(":");
      const dir = (dirRaw || "asc").toUpperCase() as "ASC" | "DESC";
      const allowCols = [
        "id",
        "price",
        "stock",
        "position",
        "average_rating",
        "review_count",
        "created_at",
        "updated_at",
        "title",
        "slug",
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
        { slug: { [Op.like]: `%${q}%` } },
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
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        sort: order,
      },
    });
  } catch (err) {
    console.error("listProducts error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// GET /api/v1/admin/products/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const product = await Product.findOne({ where, raw: true });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("detail error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/admin/products/create
export const createProduct = async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<Record<string, any>>;

    // bảo vệ tối thiểu các trường quan trọng; còn lại để Sequelize/DB validate
    if (!payload.title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });

    if (!payload.position) {
      const maxPosition:number = await Product.max("position");
      payload.position = (maxPosition || 0) + 1;
    }

    const created = await Product.create({
      product_category_id: payload.product_category_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price ?? null,
      discount_percentage: payload.discount_percentage ?? null,
      stock: payload.stock ?? 0,
      thumbnail: payload.thumbnail ?? null,
      status: payload.status ?? "active",
      featured: payload.featured ?? 0,
      position: payload.position ?? null,
      slug: payload.slug ?? null,
      average_rating: payload.average_rating ?? 0.0,
      review_count: payload.review_count ?? 0,
      created_by_id: payload.created_by_id ?? null,
      updated_by_id: payload.updated_by_id ?? null,
      deleted_by_id: null,
      deleted: 0,
      deleted_at: null,
      // created_at/updated_at do timestamps handle
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error("createProduct error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Internal server error",
    });
  }
};

// GET /api/v1/admin/products/edit/:id
export const editProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const includeDeleted = Number(req.query.includeDeleted || 0) === 1;

    const where: any = { id };
    if (!includeDeleted) where.deleted = 0;

    const product = await Product.findOne({ where, raw: true });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("get detail error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/v1/admin/products/edit/:id
export const editPatchProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const payload = req.body as Partial<Record<string, any>>;

    // Kiểm tra sản phẩm tồn tại & chưa bị xóa
    const product = await Product.findOne({ where: { id, deleted: 0 } });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Tạo object chỉ chứa field cần update
    const fieldsToUpdate: Record<string, any> = {};

    const allowedFields = [
      "product_category_id",
      "title",
      "description",
      "price",
      "discount_percentage",
      "stock",
      "thumbnail",
      "status",
      "featured",
      "position",
      "slug",
      "average_rating",
      "review_count",
      "updated_by_id",
    ];

    for (const key of allowedFields) {
      if (payload[key] !== undefined) {
        fieldsToUpdate[key] = payload[key];
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update",
      });
    }

    await Product.update(fieldsToUpdate, { where: { id } });

    // Lấy bản ghi mới sau khi update
    const updated = await Product.findOne({ where: { id }, raw: true });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("patchProduct error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Internal server error",
    });
  }
};

// PATCH /api/v1/admin/products/:id/status
export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate id
    const productId = Number(id);
    if (!productId) {
      console.error("Invalid product ID:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate status
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({
      where: { id: productId, deleted: 0 },
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Cập nhật trạng thái
    await Product.update(
      { status, updated_at: new Date() },
      { where: { id: productId } }
    );

    const updated = await Product.findOne({
      where: { id: productId },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: `Product status updated to '${status}'`,
      data: updated,
    });
  } catch (error) {
    console.error("updateProductStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE /api/v1/admin/products/delete/:id
export const softDeleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted_by_id = (req.body?.deleted_by_id as number) ?? null;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({ where: { id, deleted: 0 } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or already deleted",
      });
    }

    // Thực hiện xóa mềm
    await Product.update(
      {
        deleted: 1,
        deleted_at: new Date(),
        deleted_by_id,
        updated_at: new Date(),
      },
      { where: { id } }
    );

    return res.status(200).json({
      success: true,
      message: "Product soft-deleted successfully",
      meta: {
        deletedAt: new Date().toISOString(),
        deletedBy: deleted_by_id,
      },
    });
  } catch (error) {
    console.error("softDeleteProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
