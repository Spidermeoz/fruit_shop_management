import { Request, Response } from "express";
import { ListCategories } from "../../../../../application/categories/usecases/ListCategories";

export const makeClientCategoriesController = (deps: { list: ListCategories }) => {
  const { list } = deps;

  return {
    // GET /api/v1/client/categories
    list: async (req: Request, res: Response) => {
      try {
        const { tree } = req.query;

        const result = await list.execute({
          page: 1,
          limit: 1000,
          status: "active",           // ✅ chỉ lấy danh mục đang hoạt động
          includeDeleted: false,      // ✅ không lấy danh mục bị xóa
          sortBy: "position",
          order: "ASC",
          tree: tree === "true",      // hỗ trợ lấy tree nếu FE gọi ?tree=true
        });

        res.json({
          success: true,
          data: result.rows,
          meta: { total: result.count },
        });
      } catch (err) {
        console.error("List client categories error:", err);
        res.status(500).json({
          success: false,
          message: "Không thể tải danh sách danh mục.",
        });
      }
    },
  };
};
