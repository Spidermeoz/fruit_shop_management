import { PostTag } from "./PostTag";
import type {
  PostTagListFilter,
  PostTagListSummary,
  PostTagStatus,
} from "./types";

export interface PostTagListResult {
  rows: PostTag[];
  count: number;
  summary: PostTagListSummary;
}

export type CreatePostTagInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: PostTagStatus;
  position?: number | null;
};

export type UpdatePostTagPatch = Partial<CreatePostTagInput> & {
  deleted?: boolean;
};

export type BulkEditPostTagsInput = {
  ids: number[];
  patch: UpdatePostTagPatch;
};

export type ReorderPostTagPositionsInput = {
  id: number;
  position: number;
};

export interface PostTagRepository {
  list(filter: PostTagListFilter): Promise<PostTagListResult>;

  getSummary(): Promise<PostTagListSummary>;

  findById(id: number): Promise<PostTag | null>;
  findBySlug(slug: string): Promise<PostTag | null>;

  create(input: CreatePostTagInput): Promise<PostTag>;
  update(id: number, patch: UpdatePostTagPatch): Promise<PostTag>;

  changeStatus(id: number, status: PostTagStatus): Promise<void>;
  softDelete(id: number): Promise<void>;

  bulkEdit(input: BulkEditPostTagsInput): Promise<number>;
  reorderPositions(pairs: ReorderPostTagPositionsInput[]): Promise<number>;

  countPostsUsingTag(id: number): Promise<number>;
  canDelete(id: number): Promise<{
    canDelete: boolean;
    usageCount: number;
  }>;
}
