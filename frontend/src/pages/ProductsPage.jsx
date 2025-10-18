// src/pages/ProductsPage.jsx
import React, { useEffect, useState } from "react";
import Card from "../components/layouts/Card";
import { Search, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../components/common/Pagination";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]); // ✅ lưu danh sách id đã chọn
  const [bulkAction, setBulkAction] = useState(""); // ✅ hành động chọn

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("keyword") || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1); // ✅ thêm dòng này

  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_category_id: 1,
    title: "",
    description: "",
    price: "",
    discount_percentage: 0,
    stock: 0,
    thumbnail: "",
    status: "active",
    featured: 0,
    position: 0,
    slug: "",
    average_rating: 0,
    review_count: 0,
    created_by_id: 1,
  });

  const navigate = useNavigate();

  const [sortOrder, setSortOrder] = useState(""); // ✅ quản lý sắp xếp

  // Gọi API lấy sản phẩm thật
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/products?page=${currentPage}&limit=10`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (sortOrder) url += `&sort=${sortOrder}`; // ✅ thêm tham số sort
      if (searchTerm.trim())
        url += `&keyword=${encodeURIComponent(searchTerm.trim())}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
        setTotalPages(json.meta?.totalPages || 1);
      } else {
        setError(json.message || "Không thể tải sản phẩm.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, sortOrder, searchTerm]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (searchTerm.trim()) params.set("keyword", searchTerm.trim());
      else params.delete("keyword");

      params.delete("page"); // reset về trang đầu khi tìm kiếm mới
      setSearchParams(params);
    }, 500); // ⏳ debounce 0.5s

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Lọc theo từ khóa tìm kiếm
  const filteredProducts = products.filter(
    (product) =>
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Các handler hành động
  const handleAddProduct = () => {
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (json.success) {
        alert("Thêm sản phẩm thành công!");
        setShowForm(false);
        setFormData({
          product_category_id: 1,
          title: "",
          description: "",
          price: "",
          discount_percentage: 0,
          stock: 0,
          thumbnail: "",
          status: "active",
          featured: 0,
          position: 0,
          slug: "",
          average_rating: 0,
          review_count: 0,
          created_by_id: 1,
        });

        // ✅ reload lại danh sách (fetchProducts đã có sẵn)
        fetchProducts();
      } else {
        alert(json.message || "Không thể thêm sản phẩm!");
      }
    } catch (err) {
      console.error("Create product error:", err);
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (id) => navigate(`/admin/products/edit/${id}`);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/v1/admin/products/delete/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        // ✅ Cập nhật lại UI ngay
        setProducts((prev) => prev.filter((p) => p.id !== id));
        alert("Đã xóa sản phẩm thành công!");
      } else {
        alert(json.message || "Xóa sản phẩm thất bại!");
      }
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  // Toggle trạng thái sản phẩm
  const handleToggleStatus = async (product) => {
    const newStatus =
      product.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      // Gọi API cập nhật status
      const res = await fetch(`/api/v1/admin/products/${product.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (json.success) {
        // ✅ Cập nhật lại UI ngay mà không cần reload toàn bộ
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, status: newStatus } : p
          )
        );
      } else {
        alert(json.message || "Cập nhật trạng thái thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối server để cập nhật trạng thái");
    }
  };

  const handleFilterChange = (filter) => {
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
          </div>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}

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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Thêm sản phẩm mới
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* --- Tên sản phẩm --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* --- Danh mục --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Danh mục
                </label>
                <select
                  name="product_category_id"
                  value={formData.product_category_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  <option value="1">Trái Cây Việt Nam</option>
                  <option value="2">Trái Cây Nhập Khẩu</option>
                  <option value="3">Combo & Quà Tặng</option>
                  <option value="4">Trái Cây Theo Mùa</option>
                  <option value="5">Táo & Nho Mỹ</option>
                </select>
              </div>

              {/* --- Mô tả --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                ></textarea>
              </div>

              {/* --- Giá & Giảm giá --- */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* --- Số lượng tồn --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Số lượng tồn
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* --- Hình ảnh --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ảnh minh họa (URL)
                </label>
                <input
                  type="text"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* --- Vị trí hiển thị --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vị trí hiển thị
                </label>
                <input
                  type="number"
                  name="position"
                  value={formData.position || ""}
                  onChange={handleInputChange}
                  placeholder="Nếu bỏ trống, hệ thống sẽ tự thêm ở cuối"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* --- Trạng thái sản phẩm --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trạng thái
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      Hoạt động
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={handleInputChange}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      Dừng hoạt động
                    </span>
                  </label>
                </div>
              </div>

              {/* --- Nút hành động --- */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Bộ lọc trạng thái */}
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
      <div className="flex items-center gap-2">
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

            setCurrentPage(1); // ✅ reset về trang đầu
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
                  let body = {
                    ids: selectedProducts,
                    updated_by_id: 1, // ✅ tạm thời cố định, sau này lấy từ user login
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

                  const res = await fetch("/api/v1/admin/products/bulk-edit", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });

                  const json = await res.json();
                  if (json.success) {
                    alert("Cập nhật thành công!");
                    setSelectedProducts([]);
                    fetchProducts();
                  } else {
                    alert(json.message || "Không thể cập nhật!");
                  }
                } catch (err) {
                  console.error(err);
                  alert("Lỗi kết nối server!");
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
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={
                            product.thumbnail ||
                            "https://via.placeholder.com/50"
                          }
                          alt={product.title}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            #{product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="number"
                        value={product.position || ""}
                        onChange={(e) => {
                          const newPos = e.target.value;
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
                      {product.category_name || "—"}
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
