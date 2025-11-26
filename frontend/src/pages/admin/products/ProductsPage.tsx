import React, { useEffect, useState } from "react";
import Card from "../../../components/layouts/Card";
import { Search, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";
import { http } from "../../../services/http";

// 🔹 Kiểu dữ liệu sản phẩm
interface Product {
  category: any;
  id: number;
  product_category_id: number | string;
  category_name?: string;
  title: string;
  description: string;
  price: number;
  discount_percentage: number;
  stock: number;
  thumbnail: string;
  status: string;
  featured: number | string;
  position: number;
  slug: string;
  average_rating?: number;
  review_count?: number;
  created_by_id?: number;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("keyword") || ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);

  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  const [sortOrder, setSortOrder] = useState<string>("");

  const [pendingMap, setPendingMap] = useState<Record<number, number>>({});

  const fetchPendingReviews = async () => {
    const res = await http("GET", "/api/v1/admin/reviews/pending-summary");
    if (res.success) {
      const map: Record<number, number> = {};
      res.data.forEach((row: any) => {
        map[row.productId] = row.pending;
      });
      setPendingMap(map);
    }
  };

  // 🔹 Gọi API danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/products?page=${currentPage}&limit=10`;

      // Xử lý các trạng thái khác (không còn pending_reviews)
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      // --- fix: tách sortOrder "field:dir" thành sortBy & order để backend nhận
      if (sortOrder) {
        const [field, dir] = String(sortOrder).split(":");
        if (field) {
          url += `&sortBy=${encodeURIComponent(field)}`;
          if (dir) url += `&order=${encodeURIComponent(dir.toUpperCase())}`;
        }
      }

      // giữ keyword param nếu backend chấp nhận 'keyword' (hoặc đổi sang q nếu cần)
      if (searchTerm.trim())
        url += `&keyword=${encodeURIComponent(searchTerm.trim())}`;

      const json = await http<any>("GET", url);

      if (Array.isArray(json.data)) {
        setProducts(json.data);
        // --- fix: tính totalPages từ meta.total / meta.limit (fallback 1)
        const total = Number(json.meta?.total ?? 0);
        const limit = Number(json.meta?.limit ?? 10);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải sản phẩm.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPendingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, sortOrder, searchTerm]);

  // 🔹 Tự động cập nhật URL khi tìm kiếm
  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm.trim()) params.set("keyword", searchTerm.trim());
      else params.delete("keyword");
      params.delete("page");
      setSearchParams(params);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 🔹 Lọc hiển thị theo keyword
  const filteredProducts = products.filter((product) => {
    // Chỉ còn lại filter theo keyword
    return (
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddProduct = () => navigate("/admin/products/create");

  const handleEditProduct = (id: number) =>
    navigate(`/admin/products/edit/${id}`);

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;

    try {
      setLoading(true);
      setError("");

      await http("DELETE", `/api/v1/admin/products/delete/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Đã xóa sản phẩm thành công!");
    } catch (err) {
      console.error("Delete product error:", err);
      alert(
        err instanceof Error ? err.message : "Không thể kết nối đến server!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus =
      product.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await http("PATCH", `/api/v1/admin/products/${product.id}/status`, {
        status: newStatus,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái"
      );
    }
  };

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    if (filter === "all") params.delete("status");
    else params.set("status", filter);
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Products
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Product */}
          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* ✅ BỘ LỌC ĐÃ ĐƯỢC CHUYỂN VỀ BÊN TRÁI */}
      {/* ✅ Bộ lọc trạng thái - ĐÃ BỎ NÚT CHỜ PHẢN HỒI */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Tất cả
        </button>

        <button
          onClick={() => handleFilterChange("active")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "active"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Hoạt động
        </button>

        <button
          onClick={() => handleFilterChange("inactive")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "inactive"
              ? "bg-red-600 text-white border-red-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Dừng hoạt động
        </button>
      </div>

      {/* Thanh sắp xếp */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sắp xếp:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("sort", e.target.value);
            else params.delete("sort");
            setSearchParams(params);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Mặc định --</option>
          <option value="position:asc">Vị trí tăng dần</option>
          <option value="position:desc">Vị trí giảm dần</option>
          <option value="price:asc">Giá thấp → cao</option>
          <option value="price:desc">Giá cao → thấp</option>
          <option value="title:asc">Tiêu đề A → Z</option>
          <option value="title:desc">Tiêu đề Z → A</option>
        </select>
      </div>

      {/* ✅ Thanh chọn hành động khi có sản phẩm được chọn */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Đã chọn <strong>{selectedProducts.length}</strong> sản phẩm
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn hành động --</option>
              <option value="activate">Hoạt động</option>
              <option value="deactivate">Dừng hoạt động</option>
              <option value="delete">Xóa mềm</option>
              <option value="update_position">Cập nhật vị trí</option>
            </select>

            <button
              onClick={async () => {
                if (!bulkAction) {
                  alert("Vui lòng chọn hành động!");
                  return;
                }

                if (
                  !window.confirm(
                    `Xác nhận thực hiện '${bulkAction}' cho ${selectedProducts.length} sản phẩm?`
                  )
                )
                  return;

                try {
                  let body: {
                    ids: number[];
                    updated_by_id: number;
                    action?: string;
                    value?: any;
                  } = {
                    ids: selectedProducts,
                    updated_by_id: 1,
                  };

                  // ✅ Gửi đúng định dạng theo action
                  switch (bulkAction) {
                    case "activate":
                      body.action = "status";
                      body.value = "active";
                      break;

                    case "deactivate":
                      body.action = "status";
                      body.value = "inactive";
                      break;

                    case "delete":
                      body.action = "delete";
                      break;

                    case "update_position":
                      body.action = "position";
                      body.value = {};

                      products
                        .filter((p) => selectedProducts.includes(p.id))
                        .forEach((p) => {
                          body.value[p.id] = Number(p.position) || 0;
                        });
                      break;

                    default:
                      alert("Hành động không hợp lệ!");
                      return;
                  }

                  await http("PATCH", "/api/v1/admin/products/bulk-edit", body);
                  alert("Cập nhật thành công!");
                  setSelectedProducts([]);
                  fetchProducts();
                } catch (err) {
                  console.error(err);
                  alert(
                    err instanceof Error ? err.message : "Lỗi kết nối server!"
                  );
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading products...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No products found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length > 0 &&
                        selectedProducts.length === filteredProducts.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(
                            filteredProducts.map((p) => p.id)
                          );
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts((prev) => [
                              ...prev,
                              product.id,
                            ]);
                          } else {
                            setSelectedProducts((prev) =>
                              prev.filter((id) => id !== product.id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={
                              product.thumbnail ||
                              "https://via.placeholder.com/50"
                            }
                            alt={product.title}
                          />
                          {pendingMap[product.id] > 0 && (
                            <span className="absolute -top-1 -right-1 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                              {pendingMap[product.id]}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            #{product.id}
                          </div>
                          {pendingMap[product.id] > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              {pendingMap[product.id]} đánh giá chờ phản hồi
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="number"
                        value={product.position || ""}
                        onChange={(e) => {
                          const newPos = Number(e.target.value); // ✅ ép kiểu rõ ràng
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === product.id
                                ? { ...p, position: newPos }
                                : p
                            )
                          );
                        }}
                        className="w-20 border border-gray-300 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.category?.title || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.price?.toLocaleString()}₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          product.stock < 10
                            ? "text-red-600"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {product.stock} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <span
                        onClick={() => handleToggleStatus(product)} // ✅ thêm dòng này
                        title="Click để đổi trạng thái"
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition cursor-pointer ${
                          product.status?.toLowerCase() === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/products/${product.id}`)
                          } // ✅ chuyển sang trang chi tiết
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams);
          if (page === 1) params.delete("page");
          else params.set("page", String(page));
          setSearchParams(params);
        }}
      />
    </div>
  );
};

export default ProductsPage;
