import { Request, Response, NextFunction } from "express";
import { ListClientPostTags } from "../../../../../application/posts/usecases/ListClientPostTags";

const toTagDto = (item: any) => ({
  id: Number(item?.id ?? 0),
  name: String(item?.name ?? ""),
  slug: item?.slug ?? null,
  description: item?.description ?? null,
  status: item?.status ?? "active",
});

export const makeClientPostTagsController = (uc: {
  list: ListClientPostTags;
}) => {
  return {
    list: async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await uc.list.execute();

        return res.json({
          success: true,
          data: Array.isArray(data) ? data.map((item) => toTagDto(item)) : [],
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ClientPostTagsController = ReturnType<
  typeof makeClientPostTagsController
>;
