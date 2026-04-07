export const POST_STATUSES = [
  "draft",
  "published",
  "inactive",
  "archived",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export function isPostStatus(value: unknown): value is PostStatus {
  return (
    typeof value === "string" &&
    (POST_STATUSES as readonly string[]).includes(value)
  );
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type Pagination = {
  page?: number;
  limit?: number;
};

export type Sort = {
  sortBy?:
    | "id"
    | "title"
    | "position"
    | "publishedAt"
    | "createdAt"
    | "updatedAt"
    | "viewCount";
  order?: "ASC" | "DESC";
};

export type PostListFilter = Pagination &
  Sort & {
    q?: string;
    categoryId?: number | number[] | null;
    status?: PostStatus | "all";
    featured?: boolean;
    missingThumbnail?: boolean;
    missingSeo?: boolean;
    publishedOnly?: boolean;
  };

export type PostListSummary = {
  totalItems: number;
  draftCount: number;
  publishedCount: number;
  inactiveCount: number;
  archivedCount: number;
  featuredCount: number;
  missingThumbnailCount: number;
  missingSeoCount: number;
};

export type PostCategoryRef = {
  id: number;
  title: string;
  slug?: string | null;
};

export type PostTagRef = {
  id: number;
  name: string;
  slug?: string | null;
};

export type RelatedProductRef = {
  id: number;
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  position?: number;
};

export type PostSeoInput = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
};
