import { Request, Response, NextFunction } from "express";
import { ListPostTags } from "../../../../application/post-tags/usecases/ListPostTags";
import { GetPostTagDetail } from "../../../../application/post-tags/usecases/GetPostTagDetail";
import { CreatePostTag } from "../../../../application/post-tags/usecases/CreatePostTag";
import { EditPostTag } from "../../../../application/post-tags/usecases/EditPostTag";
import { ChangePostTagStatus } from "../../../../application/post-tags/usecases/ChangePostTagStatus";
import { SoftDeletePostTag } from "../../../../application/post-tags/usecases/SoftDeletePostTag";
import { BulkEditPostTags } from "../../../../application/post-tags/usecases/BulkEditPostTags";
import { ReorderPostTagPositions } from "../../../../application/post-tags/usecases/ReorderPostTagPositions";
import { GetPostTagSummary } from "../../../../application/post-tags/usecases/GetPostTagSummary";
import { CanDeletePostTag } from "../../../../application/post-tags/usecases/CanDeletePostTag";
import { GetPostTagUsage } from "../../../../application/post-tags/usecases/GetPostTagUsage";
import type { PostTagStatus } from "../../../../domain/post-tags/types";
import type {
  ReorderPostTagPositionsInput,
  UpdatePostTagPatch,
} from "../../../../domain/post-tags/PostTagRepository";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));

const isValidStatus = (value: unknown): value is PostTagStatus =>
  value === "active" || value === "inactive";

const isValidSortBy = (
  value: unknown,
): value is "id" | "name" | "position" | "createdAt" | "updatedAt" =>
  value === "id" ||
  value === "name" ||
  value === "position" ||
  value === "createdAt" ||
  value === "updatedAt";

const isValidOrder = (value: unknown): value is "ASC" | "DESC" =>
  value === "ASC" || value === "DESC";

export const makePostTagsController = (uc: {
  list: ListPostTags;
  detail: GetPostTagDetail;
  create: CreatePostTag;
  edit: EditPostTag;
  changeStatus: ChangePostTagStatus;
  softDelete: SoftDeletePostTag;
  bulkEdit: BulkEditPostTags;
  reorder: ReorderPostTagPositions;
  summary: GetPostTagSummary;
  canDelete: CanDeletePostTag;
  usage: GetPostTagUsage;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, keyword, status, sortBy, order } =
          req.query as Record<string, string>;

        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 10);
        const normalizedQuery = String(q ?? keyword ?? "").trim();

        const normalizedStatus =
          status && status !== "all"
            ? isValidStatus(status)
              ? status
              : (() => {
                  throw new Error("Invalid post tag status");
                })()
            : "all";

        const normalizedSortBy = sortBy
          ? isValidSortBy(sortBy)
            ? sortBy
            : (() => {
                throw new Error("Invalid post tag sortBy");
              })()
          : "id";

        const normalizedOrder = order
          ? isValidOrder(String(order).toUpperCase())
            ? (String(order).toUpperCase() as "ASC" | "DESC")
            : (() => {
                throw new Error("Invalid post tag order");
              })()
          : "DESC";

        const data = await uc.list.execute({
          page: normalizedPage,
          limit: normalizedLimit,
          q: normalizedQuery,
          status: normalizedStatus,
          sortBy: normalizedSortBy,
          order: normalizedOrder,
        });

        return res.json({
          success: true,
          data: data.rows,
          meta: {
            total: data.count,
            page: normalizedPage,
            limit: normalizedLimit,
            summary: data.summary,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    summary: async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await uc.summary.execute();

        return res.json({
          success: true,
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const dto = await uc.detail.execute(id);

        return res.json({
          success: true,
          data: {
            id: dto.id,
            name: dto.name,
            slug: dto.slug ?? "",
            description: dto.description ?? "",
            status: dto.status,
            position: dto.position ?? 0,
            deleted: dto.deleted ? 1 : 0,
            deleted_at: dto.deletedAt ?? null,
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    usage: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const data = await uc.usage.execute(id);

        return res.json({
          success: true,
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    canDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const data = await uc.canDelete.execute(id);

        return res.json({
          success: true,
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          name: string;
          slug?: string | null;
          description?: string | null;
          status?: PostTagStatus;
          position?: number | null;
        };

        if (payload.status !== undefined && !isValidStatus(payload.status)) {
          throw new Error("Invalid post tag status");
        }

        const result = await uc.create.execute({
          name: String(payload.name ?? ""),
          slug: payload.slug ?? null,
          description: payload.description ?? null,
          status: payload.status ?? "active",
          position:
            payload.position !== undefined && payload.position !== null
              ? Number(payload.position)
              : 0,
        });

        return res.status(201).json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const dto = await uc.detail.execute(id);

        return res.json({
          success: true,
          data: {
            id: dto.id,
            name: dto.name,
            slug: dto.slug ?? "",
            description: dto.description ?? "",
            status: dto.status,
            position: dto.position ?? 0,
            deleted: dto.deleted ? 1 : 0,
            deleted_at: dto.deletedAt ?? null,
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const body = req.body as UpdatePostTagPatch;

        if (body.status !== undefined && !isValidStatus(body.status)) {
          throw new Error("Invalid post tag status");
        }

        const payload: UpdatePostTagPatch = {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.position !== undefined
            ? {
                position: body.position !== null ? Number(body.position) : null,
              }
            : {}),
          ...(body.deleted !== undefined ? { deleted: !!body.deleted } : {}),
        };

        const updated = await uc.edit.execute(id, payload);

        return res.json({
          success: true,
          data: updated.props,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const { status } = req.body as { status: PostTagStatus };

        if (!isValidStatus(status)) {
          throw new Error("Invalid post tag status");
        }

        const result = await uc.changeStatus.execute(id, status);

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error("Invalid post tag id");
        }

        const result = await uc.softDelete.execute(id);

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as {
          ids?: number[];
          patch?: UpdatePostTagPatch;
        };

        const ids = Array.from(
          new Set(
            (body.ids || []).map((id) => Number(id)).filter(Number.isFinite),
          ),
        );

        if (!ids.length) {
          throw new Error("No post tag ids provided");
        }

        if (
          body.patch?.status !== undefined &&
          !isValidStatus(body.patch.status)
        ) {
          throw new Error("Invalid post tag status");
        }

        const patch: UpdatePostTagPatch = {
          ...(body.patch?.description !== undefined
            ? { description: body.patch.description }
            : {}),
          ...(body.patch?.status !== undefined
            ? { status: body.patch.status }
            : {}),
          ...(body.patch?.deleted !== undefined
            ? { deleted: !!body.patch.deleted }
            : {}),
        };

        const result = await uc.bulkEdit.execute({
          ids,
          patch,
        });

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    reorder: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as {
          items?: ReorderPostTagPositionsInput[];
        };

        const items = (body.items || [])
          .map((item) => ({
            id: Number(item.id),
            position: Number(item.position),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.id) &&
              Number.isFinite(item.position) &&
              item.position >= 0,
          );

        if (!items.length) {
          throw new Error("No valid reorder items provided");
        }

        const result = await uc.reorder.execute(items);

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type PostTagsController = ReturnType<typeof makePostTagsController>;
