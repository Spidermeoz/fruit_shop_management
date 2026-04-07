export type PostTagStatus = "active" | "inactive";

export type Pagination = {
  page?: number;
  limit?: number;
};

export type Sort = {
  sortBy?: "id" | "name" | "position" | "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
};

export type PostTagListFilter = Pagination &
  Sort & {
    q?: string;
    status?: PostTagStatus | "all";
  };

export type PostTagListSummary = {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;

  missingDescriptionCount: number;
  missingSlugCount: number;
  zeroPositionCount: number;
  duplicateNameCount: number;

  usedCount: number;
  unusedCount: number;
};

export type PostTagRef = {
  id: number;
  name: string;
  slug: string;
};

export type PostTagUsageInfo = {
  postCount: number;
};
