import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../layouts/Layout";
import { http } from "../../../services/http";
import Footer from "../layouts/Footer";

interface Category {
  id: number;
  title: string;
  slug: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  effective_price?: number;
  discount_percentage?: number;
  thumbnail: string;
  stock: number;
  totalStock?: number;
  featured: boolean;
  priceRange?: { min: number; max: number } | null;
  variants?: Array<{
    id: number;
    title?: string | null;
    stock: number;
    price: number;
    status?: string;
  }>;
  category?: Category | null;
}

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const productsPerPage = 12;

  // State mới để quản lý số lượng danh mục hiển thị
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5);

  const categorySlug = searchParams.get("category");
  const activeCategory = categories.find((cat) => cat.slug === categorySlug);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http("GET", "/api/v1/client/categories");
        if (res?.success && Array.isArray(res.data)) {
          setCategories(
            res.data.filter((c: { status: string }) => c.status === "active"),
          );
        }
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", productsPerPage.toString());

        if (categorySlug) params.set("category", categorySlug);
        if (searchTerm) params.set("q", searchTerm);
        if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
        if (priceRange[1] < 1000000)
          params.set("maxPrice", priceRange[1].toString());

        if (sortBy === "price-asc") {
          params.set("sortBy", "price");
          params.set("order", "ASC");
        } else if (sortBy === "price-desc") {
          params.set("sortBy", "price");
          params.set("order", "DESC");
        } else if (sortBy === "name") {
          params.set("sortBy", "title");
          params.set("order", "ASC");
        }

        const url = `/api/v1/client/products?${params.toString()}`;
        const res = await http("GET", url);

        if (res?.success) {
          setProducts(res.data);
          setTotal(res.meta.total);
        } else {
          setError("Không thể tải sản phẩm.");
        }
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setError("Không thể kết nối tới server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, currentPage, searchTerm, priceRange, sortBy]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, categorySlug, priceRange, sortBy]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [categorySlug, currentPage, searchTerm, priceRange, sortBy]);

  const totalPages = Math.ceil(total / productsPerPage);

  // --- GIỮ NGUYÊN HANDLERS ---
  const handleCategoryClick = (slug: string | null) => {
    setSearchParams(slug ? { category: slug } : {});
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handlePriceRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const newRange = [...priceRange] as [number, number];
    newRange[index] = parseInt(e.target.value);
    setPriceRange(newRange);
  };

  const handleClearFilter = () => {
    setSearchParams({});
    setSearchTerm("");
    setSortBy("default");
    setPriceRange([0, 1000000]);
    setVisibleCategoriesCount(5); // Xóa bộ lọc thì reset lại số danh mục hiển thị
  };

  const handleLoadMoreCategories = () => {
    setVisibleCategoriesCount((prev) => prev + 6);
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("vi-VN") + " đ";
  };

  const getDisplayPrice = (product: Product) => {
    if (product.priceRange?.min !== undefined) return product.priceRange.min;
    if (typeof product.effective_price === "number")
      return product.effective_price;
    return product.price ?? 0;
  };

  const getDisplayComparePrice = (product: Product) => {
    if (
      product.priceRange?.max !== undefined &&
      product.priceRange.max > getDisplayPrice(product)
    ) {
      return product.priceRange.max;
    }
    return product.price ?? 0;
  };

  const getDisplayStock = (product: Product) => {
    if (typeof product.totalStock === "number") {
      return Math.max(0, Number(product.totalStock));
    }

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => {
        return sum + Math.max(0, Number(variant.stock ?? 0));
      }, 0);
    }

    return Math.max(0, Number(product.stock ?? 0));
  };

  const hasMultipleVariants = (product: Product) =>
    Array.isArray(product.variants) && product.variants.length > 1;

  const getDiscountAmount = (product: Product) => {
    const displayPrice = getDisplayPrice(product);
    const comparePrice = getDisplayComparePrice(product);
    return Math.max(0, comparePrice - displayPrice);
  };

  return (
    <Layout>
      <div className="bg-[#fcfdfc] min-h-screen text-slate-800 font-sans selection:bg-green-200 selection:text-green-900 pb-20">
        {/* ==================== 1. HEADER / BANNER ==================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-transparent pt-12 pb-16 text-center">
          {/* Decorative Background Shapes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-200/30 rounded-[100%] blur-[100px] pointer-events-none -z-10"></div>

          <div className="container mx-auto px-4 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-slate-500 text-sm font-medium mb-6">
              <Link to="/" className="hover:text-green-600 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <span className="text-green-700">Cửa hàng</span>
              {activeCategory && (
                <>
                  <span className="mx-3 opacity-40">/</span>
                  <span className="text-green-700 font-bold">
                    {activeCategory.title}
                  </span>
                </>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700 border border-green-200 mb-4">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Fresh Selection
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              {activeCategory ? activeCategory.title : "Cửa hàng Trái cây"}
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
              Tuyển chọn kỹ lưỡng mỗi ngày. Nguồn vitamin tự nhiên, an toàn và
              tươi ngon nhất dành cho gia đình bạn.
            </p>
          </div>
        </section>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ==================== 3. SIDEBAR BỘ LỌC ==================== */}
            <aside className="lg:w-1/4">
              <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 p-6 lg:p-8 sticky top-24">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    Bộ lọc
                  </h2>
                </div>

                {/* 3.1. Tìm kiếm */}
                <div className="mb-8">
                  <label className="block text-slate-800 text-sm font-bold mb-3">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm trái cây..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 3.2. Danh mục */}
                <div className="mb-8">
                  <label className="block text-slate-800 text-sm font-bold mb-3">
                    Danh mục
                  </label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCategoryClick(null)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        !categorySlug
                          ? "bg-green-600 text-white shadow-md shadow-green-200"
                          : "bg-transparent text-slate-600 hover:bg-green-50 hover:text-green-700"
                      }`}
                    >
                      Tất cả sản phẩm
                    </button>
                    {categories.slice(0, visibleCategoriesCount).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          categorySlug === cat.slug
                            ? "bg-green-600 text-white shadow-md shadow-green-200"
                            : "bg-transparent text-slate-600 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        {cat.title}
                      </button>
                    ))}

                    {/* Nút Xem thêm danh mục */}
                    {visibleCategoriesCount < categories.length && (
                      <button
                        onClick={handleLoadMoreCategories}
                        className="flex items-center justify-center w-full px-4 py-2.5 mt-1 rounded-xl text-sm font-bold text-green-600 border border-dashed border-green-300 bg-green-50/50 hover:bg-green-100 hover:border-green-400 transition-all"
                      >
                        Xem thêm ({categories.length - visibleCategoriesCount})
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3.3. Khoảng giá */}
                <div className="mb-8">
                  <label className="block text-slate-800 text-sm font-bold mb-3">
                    Mức giá
                  </label>

                  {/* Visual Price Display */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
                        Từ
                      </span>
                      <span className="block text-sm font-bold text-green-700">
                        {priceRange[0].toLocaleString()}đ
                      </span>
                    </div>
                    <span className="text-slate-300">-</span>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
                        Đến
                      </span>
                      <span className="block text-sm font-bold text-green-700">
                        {priceRange[1].toLocaleString()}đ
                      </span>
                    </div>
                  </div>

                  {/* Range Inputs */}
                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="10000"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceRangeChange(e, 0)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                    </div>
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="10000"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceRangeChange(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 3.4. Sắp xếp */}
                <div className="mb-8">
                  <label className="block text-slate-800 text-sm font-bold mb-3">
                    Sắp xếp theo
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                    >
                      <option value="default">Phù hợp nhất</option>
                      <option value="price-asc">Giá: Thấp đến Cao</option>
                      <option value="price-desc">Giá: Cao đến Thấp</option>
                      <option value="name">Tên: A - Z</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 3.5. Nút xóa lọc */}
                <button
                  onClick={handleClearFilter}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 hover:border-slate-200 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Xóa thiết lập
                </button>
              </div>
            </aside>

            {/* ==================== 4. KHU VỰC SẢN PHẨM ==================== */}
            <main className="lg:w-3/4 flex flex-col">
              {/* 2. Toolbar Thông tin */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-4 rounded-[1.5rem] shadow-sm border border-slate-50 mb-8 gap-4">
                <div className="text-slate-500 font-medium text-sm">
                  {total > 0 ? (
                    <>
                      Hiển thị{" "}
                      <span className="font-bold text-slate-900">
                        {(currentPage - 1) * productsPerPage + 1}
                      </span>{" "}
                      đến{" "}
                      <span className="font-bold text-slate-900">
                        {Math.min(currentPage * productsPerPage, total)}
                      </span>{" "}
                      trong tổng số{" "}
                      <span className="font-bold text-green-600">{total}</span>{" "}
                      sản phẩm
                    </>
                  ) : (
                    "Đang làm mới danh sách..."
                  )}
                </div>
                {/* Active Filter Tags */}
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-700 rounded-full">
                      "{searchTerm}"
                    </span>
                  )}
                  {activeCategory && (
                    <span className="text-xs font-bold px-3 py-1 bg-green-50 text-green-700 rounded-full">
                      {activeCategory.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Trạng thái Loading / Error / Data */}
              {isLoading ? (
                // 5. Loading Skeleton State (Điều chỉnh lg:grid-cols-4 và mảng thành 8 để lấp đầy 2 hàng)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm animate-pulse"
                    >
                      <div className="w-full aspect-square bg-slate-100 rounded-[1.5rem] mb-4"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/3 mb-3"></div>
                      <div className="h-6 bg-slate-100 rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-slate-100 rounded w-1/2 mb-6"></div>
                      <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                // 6. Error State
                <div className="flex flex-col items-center justify-center bg-white rounded-[2rem] border border-red-50 py-20 px-4 text-center">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Đã xảy ra lỗi
                  </h3>
                  <p className="text-slate-500 font-medium">{error}</p>
                </div>
              ) : products.length > 0 ? (
                // 4.1. Product Grid (Điều chỉnh thành lg:grid-cols-4) -> đổi thành tự co dãn layout (reponsive)
                <>
                  <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
                    {products.map((product) => {
                      const displayPrice = getDisplayPrice(product);
                      const comparePrice = getDisplayComparePrice(product);
                      const hasDiscount = comparePrice > displayPrice;
                      const discountAmount = getDiscountAmount(product);
                      const stock = getDisplayStock(product);

                      return (
                        <div
                          key={product.id}
                          className="group flex flex-col bg-white rounded-[2rem] p-3 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(22,101,52,0.08)] hover:-translate-y-1 transition-all duration-300"
                        >
                          {/* Khung Ảnh */}
                          <div className="relative aspect-square rounded-[1.5rem] bg-slate-50 overflow-hidden mb-4">
                            <img
                              src={
                                product.thumbnail ||
                                "https://via.placeholder.com/300x300?text=No+Image"
                              }
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-multiply"
                            />

                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {hasDiscount && (
                                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                  Giảm giá
                                </span>
                              )}
                              {product.featured && (
                                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                  Nổi bật
                                </span>
                              )}
                            </div>

                            {/* Out of stock overlay */}
                            {stock <= 0 && (
                              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                                <span className="bg-slate-900 text-white font-bold text-sm px-5 py-2 rounded-full shadow-lg">
                                  Tạm hết hàng
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Thông tin Text */}
                          <div className="px-2 pb-2 flex-1 flex flex-col">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 mb-1.5 line-clamp-1">
                              {product.category?.title || "Sản phẩm tươi"}
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">
                              {product.title}
                            </h3>
                            {hasMultipleVariants(product) && (
                              <p className="text-xs font-bold text-slate-400 mb-2">
                                Nhiều quy cách / size
                              </p>
                            )}

                            {/* Vùng Giá */}
                            <div className="mt-auto flex flex-col gap-1 mb-5">
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-green-700">
                                  {formatPrice(displayPrice)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs font-medium text-slate-400 line-through decoration-slate-300">
                                    {formatPrice(comparePrice)}
                                  </span>
                                )}
                              </div>

                              {/* Cục Tiết kiệm */}
                              <div className="h-6">
                                {hasDiscount && (
                                  <span className="inline-flex items-center text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                    Tiết kiệm {formatPrice(discountAmount)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Nút CTA */}
                            <Link
                              to={`/products/${product.id}`}
                              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 active:scale-[0.98] transition-all shadow-sm group-hover:shadow-md"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                              </svg>
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ==================== 8. PHÂN TRANG ==================== */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-12 mb-4">
                      <nav className="inline-flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 gap-1">
                        <button
                          onClick={() =>
                            currentPage > 1 && setCurrentPage(currentPage - 1)
                          }
                          disabled={currentPage === 1}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                            currentPage === 1
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-600 hover:bg-green-50 hover:text-green-700"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M15 19l-7-7 7-7"
                            ></path>
                          </svg>
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                              currentPage === i + 1
                                ? "bg-green-600 text-white shadow-md shadow-green-200"
                                : "bg-transparent text-slate-600 hover:bg-green-50 hover:text-green-700"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}

                        <button
                          onClick={() =>
                            currentPage < totalPages &&
                            setCurrentPage(currentPage + 1)
                          }
                          disabled={currentPage === totalPages}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                            currentPage === totalPages
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-600 hover:bg-green-50 hover:text-green-700"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M9 5l7 7-7 7"
                            ></path>
                          </svg>
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                // 7. Empty State
                <div className="flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 py-24 px-4 text-center shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mb-6 transform -rotate-6">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">
                    Không tìm thấy trái cây
                  </h3>
                  <p className="text-slate-500 font-medium mb-8 max-w-sm">
                    Tiếc quá, chúng tôi không tìm thấy sản phẩm nào khớp với bộ
                    lọc của bạn. Hãy thử thay đổi tùy chọn nhé!
                  </p>
                  <button
                    onClick={handleClearFilter}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-green-700 active:scale-95 transition-all"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default ProductListPage;
