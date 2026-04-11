import { Request, Response, NextFunction } from "express";
import { ListClientPostCategories } from "../../../../../application/posts/usecases/ListClientPostCategories";

const toCategoryTreeNode = (item: any): any => {
  const children = Array.isArray(item?.children)
    ? item.children.map((child: any) => toCategoryTreeNode(child))
    : [];

  return {
    id: Number(item?.id ?? 0),
    title: String(item?.title ?? ""),
    slug: item?.slug ?? null,
    parent_id:
      item?.parentId !== undefined && item?.parentId !== null
        ? Number(item.parentId)
        : item?.parent_id !== undefined && item?.parent_id !== null
          ? Number(item.parent_id)
          : null,
    status: item?.status ?? "active",
    position:
      item?.position !== undefined && item?.position !== null
        ? Number(item.position)
        : null,
    children,
  };
};

export const makeClientPostCategoriesController = (uc: {
  list: ListClientPostCategories;
}) => {
  return {
    list: async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await uc.list.execute();

        return res.json({
          success: true,
          data: Array.isArray(data)
            ? data.map((item) => toCategoryTreeNode(item))
            : [],
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ClientPostCategoriesController = ReturnType<
  typeof makeClientPostCategoriesController
>;
