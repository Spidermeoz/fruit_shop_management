import React, { useEffect, useState } from "react";
import Card from "../../../components/layouts/Card";
import { Search, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";

interface ProductCategory {
  id: number;
  title: string;
  description?: string;
  slug?: string;
  thumbnail?: string;
  status: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

const ProductCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("keyword") || ""
  );

  const currentPage = Number(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  // ✅ Fetch danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/product-category?page=${currentPage}&limit=10`;
      if (searchTerm.trim())
        url += `&keyword=${encodeURIComponent(searchTerm.trim())}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
        setTotalPages(json.meta?.totalPages || 1);
      } else {
        setError(json.message || "Không thể tải danh mục.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, currentPage]);

  // ✅ debounce cập nhật URL khi tìm kiếm
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

  // ✅ Xử lý xóa danh mục
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này không?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/product-category/delete/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        alert("Đã xóa danh mục thành công!");
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(json.message || "Xóa thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle trạng thái
  const handleToggleStatus = async (category: ProductCategory) => {
    const newStatus =
      category.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      const res = await fetch(
        `/api/v1/admin/product-category/${category.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const json = await res.json();

      if (json.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === category.id ? { ...c, status: newStatus } : c
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

  // ✅ Bulk Action
  const handleBulkAction = async () => {
    if (!bulkAction) {
      alert("Vui lòng chọn hành động!");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Chưa chọn danh mục nào!");
      return;
    }

    if (
      !window.confirm(
        `Xác nhận thực hiện '${bulkAction}' cho ${selectedCategories.length} danh mục?`
      )
    )
      return;

    try {
      let body: any = {
        ids: selectedCategories,
        updated_by_id: 1,
      };

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
          categories
            .filter((c) => selectedCategories.includes(c.id))
            .forEach((c) => {
              body.value[c.id] = Number(c.position) || 0;
            });
          break;
        default:
          alert("Hành động không hợp lệ!");
          return;
      }

      const res = await fetch("/api/v1/admin/product-category/bulk-edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        alert("Cập nhật thành công!");
        setSelectedCategories([]);
        fetchCategories();
      } else {
        alert(json.message || "Không thể cập nhật!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Danh mục sản phẩm
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
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Category */}
          <button
            onClick={() => navigate("/admin/product-category/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Đã chọn <strong>{selectedCategories.length}</strong> danh mục
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
              onClick={handleBulkAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải danh mục...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Không có danh mục nào.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedCategories.length > 0 &&
                        selectedCategories.length === categories.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories(categories.map((c) => c.id));
                        } else {
                          setSelectedCategories([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vị trí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((cat, index) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories((prev) => [...prev, cat.id]);
                          } else {
                            setSelectedCategories((prev) =>
                              prev.filter((id) => id !== cat.id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={
                          cat.thumbnail ||
                          "https://via.placeholder.com/60x60?text=No+Image"
                        }
                        alt={cat.title}
                        className="h-10 w-10 rounded-md object-cover border border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {cat.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <input
                        type="number"
                        value={cat.position || ""}
                        onChange={(e) => {
                          const newPos = Number(e.target.value);
                          setCategories((prev) =>
                            prev.map((c) =>
                              c.id === cat.id ? { ...c, position: newPos } : c
                            )
                          );
                        }}
                        className="w-20 border border-gray-300 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                      />
                    </td>
                    <td className="px-6 py-4 cursor-pointer">
                      <span
                        onClick={() => handleToggleStatus(cat)}
                        title="Click để đổi trạng thái"
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          cat.status?.toLowerCase() === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200"
                        }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/product-category/${cat.id}`)
                          }
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/product-category/edit/${cat.id}`)
                          }
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Xóa"
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

      {/* Pagination */}
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

export default ProductCategoryPage;
