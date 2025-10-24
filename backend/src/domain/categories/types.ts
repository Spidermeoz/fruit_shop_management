// src/domain/categories/types.ts

export type CategoryStatus = "active" | "inactive";

export type Pagination = { page?: number; limit?: number };
export type Sort = { sortBy?: "id" | "title" | "status" | "position" | "createdAt" | "updatedAt"; order?: "ASC" | "DESC" };

export type CategoryListFilter = Pagination & Sort & {
  q?: string;                 // tìm theo title/slug
  parentId?: number | null;   // lọc theo cha (null = root)
  status?: CategoryStatus | "all";
  includeDeleted?: boolean;   // mặc định false
  tree?: boolean;             // nếu true, trả cây
};
