import React, { useEffect, useState } from "react";
import Card from "../../../components/layouts/Card";
import { Plus, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";
import {
  buildCategoryTree,
  CategoryTreeTableBody,
} from "../../../utils/categoryTree";

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
  const currentPage = Number(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  // ✅ Fetch danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/product-category?page=${currentPage}&limit=10`;

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
  }, [currentPage]);

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
      {/* Header - Remove search box */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Danh mục sản phẩm
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Add Category button only */}
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

      {/* Nút mở/thu tất cả */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => (window as any).expandAllCategories?.()}
          className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition mr-2"
        >
          Mở tất cả
        </button>
        <button
          onClick={() => (window as any).collapseAllCategories?.()}
          className="px-3 py-1 text-xs rounded-md bg-gray-500 text-white hover:bg-gray-600 transition"
        >
          Thu gọn tất cả
        </button>
      </div>

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
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="w-[50px] px-3 py-3 text-center">
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
                  <th className="w-[80px] px-3 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Ảnh
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Tên danh mục
                  </th>
                  <th className="w-[120px] text-center px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Vị trí
                  </th>
                  <th className="w-[130px] text-center px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="w-[150px] text-right px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <CategoryTreeTableBody
                  categories={buildCategoryTree(categories)}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  setCategories={setCategories}
                  navigate={navigate}
                  handleToggleStatus={handleToggleStatus}
                  handleDelete={handleDelete}
                />
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
