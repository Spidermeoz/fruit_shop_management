import { PostCategory } from "./PostCategory";
import type {
  PostCategoryListFilter,
  PostCategoryListSummary,
  PostCategorySeoInput,
  PostCategoryStatus,
} from "./types";

export interface PostCategoryListResult {
  rows: PostCategory[];
  count: number;
  summary: PostCategoryListSummary;
}

export type CreatePostCategoryInput = PostCategorySeoInput & {
  title: string;
  parentId?: number | null;
  description?: string | null;
  thumbnail?: string | null;
  status?: PostCategoryStatus;
  position?: number | null;
  slug?: string | null;
};

export type UpdatePostCategoryPatch = Partial<CreatePostCategoryInput> & {
  deleted?: boolean;
};

export type ReorderPostCategoryPositionPair = {
  id: number;
  position: number;
};

export type CanDeletePostCategoryResult = {
  id: number;
  canDelete: boolean;
  reasons: string[];
  checks: {
    hasChildren: boolean;
    activePostsCount: number;
  };
};

export interface PostCategoryRepository {
  list(filter: PostCategoryListFilter): Promise<PostCategoryListResult>;

  findById(id: number): Promise<PostCategory | null>;
  findBySlug(slug: string): Promise<PostCategory | null>;

  create(input: CreatePostCategoryInput): Promise<PostCategory>;
  update(id: number, patch: UpdatePostCategoryPatch): Promise<PostCategory>;

  changeStatus(id: number, status: PostCategoryStatus): Promise<void>;
  softDelete(id: number): Promise<void>;

  bulkEdit?(ids: number[], patch: UpdatePostCategoryPatch): Promise<number>;
  reorderPositions?(pairs: ReorderPostCategoryPositionPair[]): Promise<number>;

  hasChildren?(id: number): Promise<boolean>;
  countActivePostsUsingCategory?(id: number): Promise<number>;
  getSummary?(): Promise<PostCategoryListSummary>;
}
