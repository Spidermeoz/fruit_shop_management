import { Request, Response, NextFunction } from "express";
import { ListProducts } from "../../../../../application/products/usecases/ListProducts";
import { GetProductDetail } from "../../../../../application/products/usecases/GetProductDetail";
import { ProductListFilter } from "../../../../../domain/products/types";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));

export const makeClientProductsController = (uc: {
  list: ListProducts;
  detail: GetProductDetail;
}) => {
  return {
    // ✅ GET /api/v1/client/products
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          categoryId,
          minPrice,
          maxPrice,
          sortBy,
          order,
          featured,
        } = req.query;

        const featuredAsBoolean =
          featured === "true" ? true : featured === "false" ? false : undefined;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 12,
          q: q as string,
          categoryId: categoryId ? Number(categoryId) : null,
          status: "active", // chỉ hiển thị sản phẩm đang hoạt động
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sortBy: (sortBy as ProductListFilter["sortBy"]) ?? "position",
          order: (order as ProductListFilter["order"]) ?? "ASC",
          featured: featuredAsBoolean,
        });

        const result = data.rows.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          discountPercentage: p.discountPercentage,
          thumbnail: p.thumbnail,
          stock: p.stock,
          featured: p.featured,
          category: p.category
            ? { id: p.category.id, title: p.category.title }
            : null,
        }));

        res.json({
          success: true,
          data: result,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 12),
          },
        });
      } catch (err) {
        next(err);
      }
    },

    // ✅ GET /api/v1/client/products/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        if (!dto || dto.status !== "active") {
          return res.status(404).json({
            success: false,
            message: "Product not found or inactive",
          });
        }

        res.json({
          success: true,
          data: {
            id: dto.id,
            title: dto.title,
            description: dto.description,
            price: dto.price,
            discountPercentage: dto.discountPercentage,
            stock: dto.stock,
            thumbnail: dto.thumbnail,
            slug: dto.slug,
            featured: dto.featured,
            category: dto.category
              ? { id: dto.category.id, title: dto.category.title }
              : null,
          },
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type ClientProductsController = ReturnType<
  typeof makeClientProductsController
>;
