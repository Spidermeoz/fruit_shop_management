import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";
import {
  getClientPostCategories,
  getClientPosts,
  getClientPostTags,
} from "../../../services/api/postsClient";
import type { PostCategory, PostListItem, PostTag } from "../../../types/posts";

const POSTS_PER_PAGE = 9;

const formatDate = (value?: string | null) => {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const stripHtml = (value?: string | null) =>
  String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getExcerpt = (post: PostListItem) => {
  const excerpt = String(post.excerpt ?? "").trim();
  if (excerpt) return excerpt;
  return stripHtml(post.content).slice(0, 160);
};

const buildCategoryMap = (categories: PostCategory[]) => {
  const map = new Map<string, string>();
  categories.forEach((item) => {
    if (item.slug) map.set(item.slug, item.title);
    if (Array.isArray(item.children)) {
      item.children.forEach((child) => {
        if (child.slug) map.set(child.slug, child.title);
      });
    }
  });
  return map;
};

const flattenCategories = (categories: PostCategory[]): PostCategory[] => {
  const result: PostCategory[] = [];
  categories.forEach((item) => {
    result.push(item);
    if (Array.isArray(item.children)) {
      result.push(...flattenCategories(item.children));
    }
  });
  return result;
};

const PostsPageClient: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [tags, setTags] = useState<PostTag[]>([]);

  const [loading, setLoading] = useState(true);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");

  const [total, setTotal] = useState(0);

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const q = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const fetchBootstrap = async () => {
      try {
        setBootLoading(true);

        const [categoriesRes, tagsRes] = await Promise.all([
          getClientPostCategories(),
          getClientPostTags(),
        ]);

        setCategories(
          Array.isArray(categoriesRes?.data) ? categoriesRes.data : [],
        );
        setTags(Array.isArray(tagsRes?.data) ? tagsRes.data : []);
      } catch (err) {
        console.error("Lỗi tải bootstrap posts:", err);
      } finally {
        setBootLoading(false);
      }
    };

    fetchBootstrap();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getClientPosts({
          page,
          limit: POSTS_PER_PAGE,
          q: q || undefined,
          category: category || undefined,
          tag: tag || undefined,
          sortBy: "publishedAt",
          order: "DESC",
        });

        if (res?.success) {
          setPosts(Array.isArray(res.data) ? res.data : []);
          setTotal(Number(res.meta?.total ?? 0));
        } else {
          setPosts([]);
          setTotal(0);
          setError("Không thể tải danh sách bài viết.");
        }
      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
        setPosts([]);
        setTotal(0);
        setError("Không thể kết nối tới server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, category, tag, q]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page, category, tag, q]);

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );
  const categoryTitleMap = useMemo(
    () => buildCategoryMap(categories),
    [categories],
  );

  const activeCategoryTitle = category ? categoryTitleMap.get(category) : "";
  const activeTag = tags.find((item) => item.slug === tag);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(patch).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    if (patch.page === null || patch.page === undefined) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({
      q: searchInput.trim() || null,
      page: null,
    });
  };

  const handleCategoryClick = (slug: string | null) => {
    updateParams({
      category: slug,
      page: null,
    });
  };

  const handleTagClick = (slug: string | null) => {
    updateParams({
      tag: slug,
      page: null,
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
      <Layout>
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-100/40 to-transparent pt-10 pb-16 text-center">
          <div className="absolute left-1/2 top-0 -z-10 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-200/30 blur-[100px]" />
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mb-5 flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
              <Link to="/" className="transition-colors hover:text-emerald-600">
                Trang chủ
              </Link>
              <span className="opacity-30">/</span>
              <span className="font-semibold text-emerald-700">Bài viết</span>
              {activeCategoryTitle ? (
                <>
                  <span className="opacity-30">/</span>
                  <span className="font-semibold text-emerald-700">
                    {activeCategoryTitle}
                  </span>
                </>
              ) : null}
            </div>

            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Góc nội dung Fresh Fruits
            </span>

            <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Khám phá bài viết mới về trái cây,
              <br className="hidden md:block" /> dinh dưỡng và lối sống tươi
              lành
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-slate-500">
              Những bài viết giúp khách hàng hiểu sản phẩm hơn, chọn mua thông
              minh hơn và sống lành mạnh hơn mỗi ngày.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-20 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="lg:w-[320px]">
              <div className="sticky top-24 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Bộ lọc bài viết
                  </h2>
                </div>

                <form onSubmit={handleSubmitSearch} className="mb-8">
                  <label className="mb-3 block text-sm font-bold text-slate-800">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Tìm theo tiêu đề hoặc nội dung..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                  >
                    Tìm bài viết
                  </button>
                </form>

                <div className="mb-8">
                  <label className="mb-3 block text-sm font-bold text-slate-800">
                    Danh mục
                  </label>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(null)}
                      className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                        !category
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      Tất cả bài viết
                    </button>

                    {flatCategories.map((item) => {
                      const isChild =
                        item.parent_id !== null && item.parent_id !== undefined;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleCategoryClick(item.slug || null)}
                          className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                            category === item.slug
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                          } ${isChild ? "ml-4" : ""}`}
                        >
                          {isChild ? "— " : ""}
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="mb-3 block text-sm font-bold text-slate-800">
                    Tag
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleTagClick(null)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        !tag
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                    >
                      Tất cả
                    </button>

                    {tags.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTagClick(item.slug || null)}
                        className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                          tag === item.slug
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        #{item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              <div className="mb-8 rounded-[1.5rem] border border-slate-100 bg-white px-6 py-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    {loading ? (
                      "Đang tải danh sách bài viết..."
                    ) : (
                      <>
                        Hiển thị{" "}
                        <span className="font-bold text-slate-900">
                          {posts.length > 0
                            ? (page - 1) * POSTS_PER_PAGE + 1
                            : 0}
                        </span>{" "}
                        đến{" "}
                        <span className="font-bold text-slate-900">
                          {Math.min(page * POSTS_PER_PAGE, total)}
                        </span>{" "}
                        trong tổng số{" "}
                        <span className="font-bold text-emerald-600">
                          {total}
                        </span>{" "}
                        bài viết
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {q ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        "{q}"
                      </span>
                    ) : null}
                    {activeCategoryTitle ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {activeCategoryTitle}
                      </span>
                    ) : null}
                    {activeTag ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        #{activeTag.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {bootLoading || loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4 aspect-[16/10] rounded-[1.5rem] bg-slate-100" />
                      <div className="mb-3 h-4 w-24 rounded bg-slate-100" />
                      <div className="mb-3 h-7 w-4/5 rounded bg-slate-100" />
                      <div className="mb-2 h-4 rounded bg-slate-100" />
                      <div className="mb-2 h-4 rounded bg-slate-100" />
                      <div className="h-4 w-2/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[2rem] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                    !
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Đã xảy ra lỗi
                  </h3>
                  <p className="mt-2 font-medium text-slate-500">{error}</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900">
                    Chưa có bài viết phù hợp
                  </h3>
                  <p className="mt-2 font-medium text-slate-500">
                    Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc hiện tại.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post) => {
                      const excerpt = getExcerpt(post);
                      return (
                        <article
                          key={post.id}
                          className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                        >
                          <Link
                            to={`/posts/${post.slug}`}
                            className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
                          >
                            {post.thumbnail ? (
                              <img
                                src={post.thumbnail}
                                alt={post.title}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                Bài viết
                              </div>
                            )}
                            {post.category?.title ? (
                              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
                                {post.category.title}
                              </span>
                            ) : null}
                          </Link>

                          <div className="flex flex-1 flex-col p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                              <span>{formatDate(post.published_at)}</span>
                              <span>•</span>
                              <span>
                                {Number(post.view_count ?? 0).toLocaleString(
                                  "vi-VN",
                                )}{" "}
                                lượt xem
                              </span>
                            </div>

                            <Link
                              to={`/posts/${post.slug}`}
                              className="line-clamp-2 text-xl font-black leading-tight text-slate-900 transition-colors group-hover:text-emerald-700"
                            >
                              {post.title}
                            </Link>

                            <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                              {excerpt || "Nội dung đang được cập nhật."}
                            </p>

                            {Array.isArray(post.tags) &&
                            post.tags.length > 0 ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {post.tags.slice(0, 3).map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                      handleTagClick(item.slug || null)
                                    }
                                    className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                                  >
                                    #{item.name}
                                  </button>
                                ))}
                              </div>
                            ) : null}

                            <Link
                              to={`/posts/${post.slug}`}
                              className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                            >
                              Đọc bài viết
                              <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {totalPages > 1 ? (
                    <div className="mt-12 flex justify-center">
                      <nav className="inline-flex gap-1 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() =>
                            updateParams({
                              page:
                                page > 2
                                  ? String(page - 1)
                                  : page > 1
                                    ? "1"
                                    : null,
                            })
                          }
                          className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                            page <= 1
                              ? "cursor-not-allowed text-slate-300"
                              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          ‹
                        </button>

                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNumber = idx + 1;
                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() =>
                                updateParams({
                                  page:
                                    pageNumber > 1 ? String(pageNumber) : null,
                                })
                              }
                              className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                                pageNumber === page
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() =>
                            updateParams({
                              page: String(page + 1),
                            })
                          }
                          className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                            page >= totalPages
                              ? "cursor-not-allowed text-slate-300"
                              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          ›
                        </button>
                      </nav>
                    </div>
                  ) : null}
                </>
              )}
            </main>
          </div>
        </div>
      </Layout>

      <Footer />
    </div>
  );
};

export default PostsPageClient;
