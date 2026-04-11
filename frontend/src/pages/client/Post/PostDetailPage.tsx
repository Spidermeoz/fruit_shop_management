import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import Footer from "../../../components/client/layouts/Footer";
import {
  getClientPostDetail,
  getClientPosts,
} from "../../../services/api/postsClient";
import type { PostDetail, PostListItem } from "../../../types/posts";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
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

const getExcerpt = (post?: PostDetail | null) => {
  const excerpt = String(post?.excerpt ?? "").trim();
  if (excerpt) return excerpt;
  return stripHtml(post?.content).slice(0, 180);
};

const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<PostListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError("");
        setPost(null);

        if (!slug) {
          setError("Slug bài viết không hợp lệ.");
          return;
        }

        const res = await getClientPostDetail(slug);

        if (res?.success && res.data) {
          setPost(res.data);
        } else {
          setError("Không tìm thấy bài viết.");
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết bài viết:", err);
        setError("Không thể kết nối tới server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        if (!post?.category?.slug) {
          setRelatedPosts([]);
          return;
        }

        setRelatedLoading(true);

        const res = await getClientPosts({
          page: 1,
          limit: 4,
          category: post.category.slug,
          sortBy: "publishedAt",
          order: "DESC",
        });

        if (res?.success && Array.isArray(res.data)) {
          const filtered = res.data.filter((item) => item.slug !== post.slug);
          setRelatedPosts(filtered.slice(0, 3));
        } else {
          setRelatedPosts([]);
        }
      } catch (err) {
        console.error("Lỗi tải bài viết liên quan:", err);
        setRelatedPosts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    if (post) {
      fetchRelatedPosts();
    }
  }, [post]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [slug]);

  const excerpt = useMemo(() => getExcerpt(post), [post]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
        <Layout>
          <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 lg:px-8">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
              <p className="font-medium text-slate-500">Đang tải bài viết...</p>
            </div>
          </div>
        </Layout>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
        <Layout>
          <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 lg:px-8">
            <div className="w-full max-w-xl rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                !
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Không tìm thấy bài viết
              </h2>
              <p className="mt-3 font-medium text-slate-500">
                {error || "Bài viết này không tồn tại hoặc đã bị ẩn."}
              </p>
              <Link
                to="/posts"
                className="mt-8 inline-flex rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition hover:bg-emerald-600"
              >
                Quay lại danh sách bài viết
              </Link>
            </div>
          </div>
        </Layout>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
      <Layout>
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-100/40 to-transparent py-8 text-center">
          <div className="container relative z-10 mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <Link to="/" className="transition-colors hover:text-emerald-600">
                Trang chủ
              </Link>
              <span className="opacity-30">/</span>
              <Link
                to="/posts"
                className="transition-colors hover:text-emerald-600"
              >
                Bài viết
              </Link>
              {post.category?.slug ? (
                <>
                  <span className="opacity-30">/</span>
                  <Link
                    to={`/posts?category=${post.category.slug}`}
                    className="transition-colors hover:text-emerald-600"
                  >
                    {post.category.title}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <article className="container mx-auto px-4 pb-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <header className="mb-10 pt-4 text-center">
              {post.category?.title ? (
                <div className="mb-4">
                  <Link
                    to={
                      post.category.slug
                        ? `/posts?category=${post.category.slug}`
                        : "/posts"
                    }
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {post.category.title}
                  </Link>
                </div>
              ) : null}

              <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                {post.title}
              </h1>

              {excerpt ? (
                <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-8 text-slate-500">
                  {excerpt}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-slate-400">
                <span>{formatDateTime(post.published_at)}</span>
                <span>•</span>
                <span>
                  {Number(post.view_count ?? 0).toLocaleString("vi-VN")} lượt
                  xem
                </span>
                {post.featured ? (
                  <>
                    <span>•</span>
                    <span className="font-bold text-emerald-600">
                      Bài viết nổi bật
                    </span>
                  </>
                ) : null}
              </div>
            </header>

            {post.thumbnail ? (
              <div className="mb-10 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm md:p-10">
                  <div
                    className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-8 prose-li:text-slate-600 prose-a:text-emerald-700 prose-strong:text-slate-900"
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content ||
                        "<p>Nội dung bài viết đang được cập nhật.</p>",
                    }}
                  />
                </div>

                {Array.isArray(post.relatedProducts) &&
                post.relatedProducts.length > 0 ? (
                  <section className="mt-8 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-5">
                      <h2 className="text-2xl font-black text-slate-900">
                        Sản phẩm liên quan
                      </h2>
                      <p className="mt-2 font-medium text-slate-500">
                        Gợi ý sản phẩm được liên kết trực tiếp với bài viết này.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {post.relatedProducts.map((item) => (
                        <Link
                          key={item.id}
                          to={
                            item.slug ? `/products/${item.slug}` : "/products"
                          }
                          className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-white"
                        >
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <div className="line-clamp-2 text-base font-bold text-slate-900 transition group-hover:text-emerald-700">
                              {item.title}
                            </div>
                            <div className="mt-2 text-sm font-medium text-slate-500">
                              Xem sản phẩm →
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                  {Array.isArray(post.tags) && post.tags.length > 0 ? (
                    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900">
                        Tag bài viết
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((item) => (
                          <Link
                            key={item.id}
                            to={
                              item.slug ? `/posts?tag=${item.slug}` : "/posts"
                            }
                            className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            #{item.name}
                          </Link>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900">
                      Thông tin nhanh
                    </h3>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-slate-400">
                          Danh mục
                        </span>
                        <span className="text-right font-bold text-slate-900">
                          {post.category?.title || "Đang cập nhật"}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-slate-400">
                          Xuất bản
                        </span>
                        <span className="text-right font-bold text-slate-900">
                          {formatDateTime(post.published_at)}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-slate-400">
                          Lượt xem
                        </span>
                        <span className="text-right font-bold text-slate-900">
                          {Number(post.view_count ?? 0).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900">
                      Khám phá thêm
                    </h3>
                    <p className="mt-2 font-medium leading-7 text-slate-500">
                      Xem thêm các bài viết khác để hiểu rõ hơn về trái cây,
                      dinh dưỡng và cách lựa chọn sản phẩm phù hợp.
                    </p>
                    <Link
                      to="/posts"
                      className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      Xem tất cả bài viết
                    </Link>
                  </section>
                </div>
              </aside>
            </div>

            <section className="mt-10 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">
                  Bài viết liên quan
                </h2>
                <p className="mt-2 font-medium text-slate-500">
                  Một vài bài viết cùng chủ đề để bạn đọc tiếp liền mạch hơn.
                </p>
              </div>

              {relatedLoading ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-[2rem] border border-slate-100 p-4"
                    >
                      <div className="mb-4 aspect-[16/10] rounded-[1.5rem] bg-slate-100" />
                      <div className="mb-3 h-5 w-3/4 rounded bg-slate-100" />
                      <div className="mb-2 h-4 rounded bg-slate-100" />
                      <div className="h-4 w-2/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : relatedPosts.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-6 py-10 text-center">
                  <p className="font-medium text-slate-500">
                    Chưa có thêm bài viết liên quan.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {relatedPosts.map((item) => (
                    <article
                      key={item.id}
                      className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                    >
                      <Link
                        to={`/posts/${item.slug}`}
                        className="block aspect-[16/10] overflow-hidden bg-slate-100"
                      >
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : null}
                      </Link>

                      <div className="p-5">
                        <div className="mb-2 text-xs font-bold text-slate-400">
                          {formatDateTime(item.published_at)}
                        </div>

                        <Link
                          to={`/posts/${item.slug}`}
                          className="line-clamp-2 text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-emerald-700"
                        >
                          {item.title}
                        </Link>

                        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                          {String(item.excerpt ?? "").trim() ||
                            stripHtml(item.content).slice(0, 120) ||
                            "Nội dung đang được cập nhật."}
                        </p>

                        <Link
                          to={`/posts/${item.slug}`}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
                        >
                          Đọc tiếp →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </article>
      </Layout>

      <Footer />
    </div>
  );
};

export default PostDetailPage;
