import { Post } from "./Post";
import type {
  PostListFilter,
  PostListSummary,
  PostSeoInput,
  PostStatus,
} from "./types";

export interface PostListResult {
  rows: Post[];
  count: number;
  summary: PostListSummary;
}

export type CreatePostInput = PostSeoInput & {
  postCategoryId?: number | null;

  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  thumbnail?: string | null;

  status?: PostStatus;
  featured?: boolean;
  position?: number | null;
  publishedAt?: Date | string | null;

  createdById?: number | null;
  updatedById?: number | null;

  tagIds?: number[];
  relatedProductIds?: number[];
};

export type UpdatePostPatch = Partial<
  Omit<CreatePostInput, "tagIds" | "relatedProductIds">
> & {
  deleted?: boolean;
  deletedById?: number | null;
  tagIds?: number[];
  relatedProductIds?: number[];
};

export interface PostRepository {
  list(filter: PostListFilter): Promise<PostListResult>;

  findById(id: number): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;

  create(input: CreatePostInput): Promise<Post>;
  update(id: number, patch: UpdatePostPatch): Promise<Post>;

  changeStatus(id: number, status: PostStatus): Promise<void>;
  softDelete(id: number, deletedById?: number | null): Promise<void>;

  bulkEdit?(ids: number[], patch: UpdatePostPatch): Promise<number>;
  reorderPositions?(
    pairs: { id: number; position: number }[],
    updatedById?: number,
  ): Promise<number>;

  increaseViewCount?(id: number, by?: number): Promise<void>;

  existsCategory(id: number): Promise<boolean>;
  isCategoryUsable(id: number): Promise<boolean>;

  findExistingTagIds(ids: number[]): Promise<number[]>;
  findUsableTagIds(ids: number[]): Promise<number[]>;

  findExistingRelatedProductIds(ids: number[]): Promise<number[]>;
  findUsableRelatedProductIds(ids: number[]): Promise<number[]>;
}
