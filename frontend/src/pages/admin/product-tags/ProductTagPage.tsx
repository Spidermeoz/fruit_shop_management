import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import { Plus, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ProductTag {
  id: number;
  name: string;
  slug?: string | null;
  group: string;
  status: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};

type ApiOk = { success: true; data?: any; meta?: any };

const ProductTagPage: React.FC = () => {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [groupFilter, setGroupFilter] = useState<string>("all");

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiList<ProductTag>>(
        "GET",
        "/api/v1/admin/product-tags?limit=1000",
      );

      setTags(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa product tag này không?")) return;

    try {
      setLoading(true);
      await http<ApiOk>("DELETE", `/api/v1/admin/product-tags/delete/${id}`);
      showSuccessToast({ message: "Đã xóa product tag thành công!" });
      setTags((prev) => prev.filter((item) => item.id !== id));
      setSelectedTags((prev) => prev.filter((x) => x !== id));
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tag: ProductTag) => {
    const newStatus =
      tag.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/product-tags/${tag.id}/status`,
        {
          status: newStatus,
        },
      );

      setTags((prev) =>
        prev.map((item) =>
          item.id === tag.id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) {
      showErrorToast("Vui lòng chọn hành động!");
      return;
    }

    if (selectedTags.length === 0) {
      showErrorToast("Chưa chọn product tag nào!");
      return;
    }

    if (
      !window.confirm(
        `Xác nhận thực hiện '${bulkAction}' cho ${selectedTags.length} product tag?`,
      )
    ) {
      return;
    }

    try {
      const body: any = {
        ids: selectedTags,
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
          body.patch = { deleted: true };
          break;
        case "update_position":
          body.action = "position";
          body.value = {};
          tags
            .filter((item) => selectedTags.includes(item.id))
            .forEach((item) => {
              body.value[item.id] = Number(item.position) || 0;
            });
          break;
        default:
          showErrorToast("Hành động không hợp lệ!");
          return;
      }

      await http<ApiOk>("PATCH", "/api/v1/admin/product-tags/bulk-edit", body);
      showSuccessToast({ message: "Cập nhật thành công!" });
      setSelectedTags([]);
      fetchTags();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi kết nối server!");
    }
  };

  const availableGroups = useMemo(() => {
    return Array.from(
      new Set(tags.map((item) => item.group).filter(Boolean)),
    ).sort();
  }, [tags]);

  const filteredTags =
    groupFilter === "all"
      ? tags
      : tags.filter((item) => item.group === groupFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Product Tags
        </h1>

        <button
          onClick={() => navigate("/admin/product-tags/create")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm product tag
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setGroupFilter("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            groupFilter === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Tất cả
        </button>

        {availableGroups.map((group) => (
          <button
            key={group}
            onClick={() => setGroupFilter(group)}
            className={`px-4 py-2 rounded-md text-sm font-medium border ${
              groupFilter === group
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Đã chọn <strong>{selectedTags.length}</strong> product tag
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

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải product tags...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : filteredTags.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Không có product tag nào.
            </p>
          ) : (
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="w-[50px] px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedTags.length > 0 &&
                        selectedTags.length === filteredTags.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags(filteredTags.map((item) => item.id));
                        } else {
                          setSelectedTags([]);
                        }
                      }}
                    />
                  </th>
                  <th className="w-[80px] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tên tag
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Group
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Vị trí
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTags.map((tag, index) => (
                  <tr
                    key={tag.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags((prev) => [...prev, tag.id]);
                          } else {
                            setSelectedTags((prev) =>
                              prev.filter((id) => id !== tag.id),
                            );
                          }
                        }}
                      />
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {tag.name}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {tag.slug || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300">
                        {tag.group || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {tag.position ?? 0}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(tag)}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                          tag.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {tag.status === "active"
                          ? "Hoạt động"
                          : "Dừng hoạt động"}
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/product-tags/detail/${tag.id}`)
                          }
                          className="p-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/admin/product-tags/edit/${tag.id}`)
                          }
                          className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default ProductTagPage;
