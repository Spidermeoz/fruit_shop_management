import { http } from "../http";
import type {
  GetClientPostsParams,
  PostCategoriesResponse,
  PostDetailResponse,
  PostTagsResponse,
  PostsListResponse,
  RelatedPostsResponse,
} from "../../types/posts";

const buildQueryString = (params: GetClientPostsParams = {}) => {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.q) query.set("q", params.q.trim());
  if (params.category) query.set("category", params.category.trim());
  if (params.tag) query.set("tag", params.tag.trim());
  if (typeof params.featured === "boolean") {
    query.set("featured", String(params.featured));
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);

  const value = query.toString();
  return value ? `?${value}` : "";
};

export const getClientPosts = async (
  params: GetClientPostsParams = {},
): Promise<PostsListResponse> => {
  return http<PostsListResponse>(
    "GET",
    `/api/v1/client/posts${buildQueryString(params)}`,
  );
};

export const getClientPostDetail = async (
  slug: string,
): Promise<PostDetailResponse> => {
  return http<PostDetailResponse>("GET", `/api/v1/client/posts/${slug}`);
};

export const getClientPostCategories =
  async (): Promise<PostCategoriesResponse> => {
    return http<PostCategoriesResponse>(
      "GET",
      "/api/v1/client/post-categories",
    );
  };

export const getClientPostTags = async (): Promise<PostTagsResponse> => {
  return http<PostTagsResponse>("GET", "/api/v1/client/post-tags");
};

export const getRelatedPostsByProduct = async (
  productId: number,
  limit = 3,
): Promise<RelatedPostsResponse> => {
  return http<RelatedPostsResponse>(
    "GET",
    `/api/v1/client/posts/related-by-product/${productId}?limit=${limit}`,
  );
};
