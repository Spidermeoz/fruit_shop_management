import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import { http } from "../../../services/http";
import Footer from "../layout/Footer";

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
  discountPercentage: number;
  thumbnail: string;
  stock: number;
  featured: boolean;
  category?: Category | null;
  effectivePrice: number;
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

  const categorySlug = searchParams.get("category");
  const activeCategory = categories.find((cat) => cat.slug === categorySlug);

  // ✅ Lấy danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http("GET", "/api/v1/client/categories");
        if (res?.success && Array.isArray(res.data)) {
          setCategories(
            res.data.filter((c: { status: string }) => c.status === "active")
          );
        }
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Lấy sản phẩm từ API với tất cả các bộ lọc
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Xây dựng URL với tất cả các tham số lọc
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", productsPerPage.toString());

        if (categorySlug) params.set("category", categorySlug);
        if (searchTerm) params.set("q", searchTerm); // Backend dùng 'q'
        if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
        if (priceRange[1] < 1000000)
          params.set("maxPrice", priceRange[1].toString());

        // Map sortBy của frontend với tham số của backend
        if (sortBy === "price-asc") {
          params.set("sortBy", "effectivePrice"); // Sắp xếp theo giá đã giảm
          params.set("order", "ASC");
        } else if (sortBy === "price-desc") {
          params.set("sortBy", "effectivePrice");
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
  }, [categorySlug, currentPage, searchTerm, priceRange, sortBy]); // Fetch lại khi bất kỳ bộ lọc nào thay đổi

  // ✅ Reset về trang 1 khi bộ lọc (trừ trang) thay đổi
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, categorySlug, priceRange, sortBy]);

  const totalPages = Math.ceil(total / productsPerPage);

  const handleCategoryClick = (slug: string | null) => {
    setSearchParams(slug ? { category: slug } : {});
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handlePriceRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newRange = [...priceRange] as [number, number];
    newRange[index] = parseInt(e.target.value);
    setPriceRange(newRange);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        {/* ... (Giữ nguyên phần Header) */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            {activeCategory ? activeCategory.title : "Cửa hàng trái cây"}
          </h1>
          <p className="text-gray-700">
            Khám phá những loại trái cây tươi ngon nhất từ khắp nơi trên thế
            giới
          </p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Sản phẩm</span>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Bộ lọc */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                Bộ lọc sản phẩm
              </h2>

              {/* Tìm kiếm */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Danh mục */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Danh mục
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`block w-full text-left px-3 py-1 rounded ${
                      !categorySlug
                        ? "bg-green-600 text-white"
                        : "hover:bg-green-100 text-gray-700"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`block w-full text-left px-3 py-1 rounded ${
                        categorySlug === cat.slug
                          ? "bg-green-600 text-white"
                          : "hover:bg-green-100 text-gray-700"
                      }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khoảng giá */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Khoảng giá
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">
                      Từ: {priceRange[0].toLocaleString()}đ
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceRangeChange(e, 0)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Đến: {priceRange[1].toLocaleString()}đ
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceRangeChange(e, 1)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Sắp xếp */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Sắp xếp theo
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchParams({});
                  setSearchTerm("");
                  setSortBy("default");
                  setPriceRange([0, 1000000]);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="lg:w-3/4">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <p className="text-center text-red-500 py-10">{error}</p>
            ) : (
              <>
                {/* ✅ Hiển thị tổng số sản phẩm từ server */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    {total > 0 ? (
                      <>
                        Hiển thị{" "}
                        <span className="font-semibold">
                          {(currentPage - 1) * productsPerPage + 1} -{" "}
                          {Math.min(currentPage * productsPerPage, total)}
                        </span>{" "}
                        / <span className="font-semibold">{total}</span> sản
                        phẩm
                      </>
                    ) : (
                      "Không có sản phẩm nào"
                    )}
                  </p>
                </div>

                {products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <div className="relative overflow-hidden h-56">
                            <img
                              src={
                                product.thumbnail ||
                                "https://via.placeholder.com/300x300?text=No+Image"
                              }
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {product.discountPercentage &&
                              product.discountPercentage > 0 && (
                                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                                  -{product.discountPercentage}%
                                </div>
                              )}
                            {product.stock <= 0 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  Hết hàng
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <span className="text-xs text-green-600 font-medium">
                              {product.category?.title}
                            </span>
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                              {product.title}
                            </h3>
                            <div className="flex items-center justify-between mb-3">
                              {product.discountPercentage &&
                              product.discountPercentage > 0 ? (
                                <>
                                  <span className="text-lg font-bold text-green-700">
                                    {product.effectivePrice.toLocaleString()} đ
                                  </span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    {product.price.toLocaleString()} đ
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-green-700">
                                  {product.price.toLocaleString()} đ
                                </span>
                              )}
                            </div>
                            <Link
                              to={`/products/${product.id}`}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-center font-medium hover:bg-green-700 transition block"
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ✅ Phân trang dựa trên total từ server */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-10">
                        <nav className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              currentPage > 1 && setCurrentPage(currentPage - 1)
                            }
                            disabled={currentPage === 1}
                            className={`px-3 py-2 rounded-lg ${
                              currentPage === 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
                            }`}
                          >
                            «
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`px-4 py-2 rounded-lg ${
                                currentPage === i + 1
                                  ? "bg-green-600 text-white"
                                  : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
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
                            className={`px-3 py-2 rounded-lg ${
                              currentPage === totalPages
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
                            }`}
                          >
                            »
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                ) : (
                  !isLoading && (
                    <div className="text-center py-20 text-gray-600">
                      Không tìm thấy sản phẩm phù hợp
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer></Footer>
    </Layout>
  );
};

export default ProductListPage;
