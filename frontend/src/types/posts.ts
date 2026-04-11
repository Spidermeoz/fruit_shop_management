export interface PostCategory {
  id: number;
  title: string;
  slug?: string | null;
  parent_id?: number | null;
  status?: string;
  position?: number | null;
  children?: PostCategory[];
}

export interface PostTag {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: string;
}

export interface RelatedProduct {
  id: number;
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  status?: string;
}

export interface PostListItem {
  id: number;
  post_category_id?: number | null;
  category?: PostCategory | null;

  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  thumbnail?: string | null;

  status: string;
  featured?: boolean;
  position?: number | null;

  published_at?: string | null;

  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;

  view_count?: number;

  tags?: PostTag[];
  relatedProducts?: RelatedProduct[];

  created_at?: string | null;
  updated_at?: string | null;
}

export interface PostDetail extends PostListItem {}

export interface PostsListMeta {
  total: number;
  page: number;
  limit: number;
  summary?: Record<string, unknown>;
}

export interface PostsListResponse {
  success: boolean;
  data: PostListItem[];
  meta: PostsListMeta;
}

export interface PostDetailResponse {
  success: boolean;
  data: PostDetail;
}

export interface PostCategoriesResponse {
  success: boolean;
  data: PostCategory[];
}

export interface PostTagsResponse {
  success: boolean;
  data: PostTag[];
}

export interface RelatedPostsResponse {
  success: boolean;
  data: PostListItem[];
  meta?: {
    total?: number;
    limit?: number;
  };
}

export type GetClientPostsParams = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
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
