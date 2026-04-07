export type PostCategoryStatus = "active" | "inactive";

export type Pagination = {
  page?: number;
  limit?: number;
};

export type Sort = {
  sortBy?: "id" | "title" | "position" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
};

export type PostCategoryParentType = "all" | "root" | "child";

export type PostCategoryListFilter = Pagination &
  Sort & {
    q?: string;
    parentId?: number | number[] | null;
    parentType?: PostCategoryParentType;
    status?: PostCategoryStatus | "all";
    missingThumbnail?: boolean;
    missingSeo?: boolean;
  };

export type PostCategoryListSummary = {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;
  rootCount: number;
  childCount: number;
  missingThumbnailCount: number;
  missingSeoCount: number;
};

export type PostCategorySeoInput = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
};

export type PostCategoryRef = {
  id: number;
  title: string;
  slug?: string | null;
};

export type PostCategoryTreeNode = {
  id: number;
  title: string;
  slug?: string | null;
  status: PostCategoryStatus;
  position?: number | null;
  parentId?: number | null;
  children?: PostCategoryTreeNode[];
};
