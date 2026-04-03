// src/pages/ProductTagPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  Tags,
  Layers,
  AlertCircle,
  LayoutGrid,
  Search,
  ShieldAlert,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ProductTag {
  id: number;
  name: string;
  slug?: string | null;
  productTagGroupId: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductTagGroup {
  id: number;
  name: string;
  slug?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tags?: ProductTag[];
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = {
  success: true;
  data?: any;
  message?: string;
  errors?: Record<string, string>;
};

const ProductTagPage: React.FC = () => {
  const [groups, setGroups] = useState<ProductTagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [flashNewGroup, setFlashNewGroup] = useState(false);

  const [savingGroupIds, setSavingGroupIds] = useState<number[]>([]);
  const [deletingGroupIds, setDeletingGroupIds] = useState<number[]>([]);
  const [deleteBlockedGroupIds, setDeleteBlockedGroupIds] = useState<number[]>(
    [],
  );
  const [editingGroupValues, setEditingGroupValues] = useState<
    Record<number, string>
  >({});

  const [savingTagIds, setSavingTagIds] = useState<number[]>([]);
  const [deletingTagIds, setDeletingTagIds] = useState<number[]>([]);
  const [creatingTagGroupIds, setCreatingTagGroupIds] = useState<number[]>([]);
  const [flashingTagGroupIds, setFlashingTagGroupIds] = useState<number[]>([]);

  const [editingTagValues, setEditingTagValues] = useState<
    Record<number, string>
  >({});
  const [createTagValues, setCreateTagValues] = useState<
    Record<number, string>
  >({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode] = useState<"all" | "empty" | "populated">(
    "all",
  );

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setPageError("");
      const res = await http<ApiList<ProductTagGroup>>(
        "GET",
        "/api/v1/admin/product-tag-groups?limit=1000&sortBy=name&order=ASC&includeTags=true",
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      const normalizedRows = rows.map((group) => ({
        ...group,
        tags: Array.isArray(group.tags)
          ? [...group.tags].sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", "vi"),
            )
          : [],
      }));

      setGroups(normalizedRows);

      const newEditingGroupValues: Record<number, string> = {};
      const newEditingTagValues: Record<number, string> = {};

      normalizedRows.forEach((group) => {
        newEditingGroupValues[group.id] = group.name ?? "";
        (group.tags || []).forEach((tag) => {
          newEditingTagValues[tag.id] = tag.name ?? "";
        });
      });

      setEditingGroupValues(newEditingGroupValues);
      setEditingTagValues(newEditingTagValues);
    } catch (err: any) {
      setPageError(err?.message || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 🔹 DATA DERIVATION
  const insights = useMemo(() => {
    let totalTags = 0,
      emptyGroups = 0;
    groups.forEach((g) => {
      const len = g.tags?.length || 0;
      totalTags += len;
      if (len === 0) emptyGroups++;
    });
    const avgTags =
      groups.length > 0 ? (totalTags / groups.length).toFixed(1) : 0;
    return { totalGroups: groups.length, totalTags, emptyGroups, avgTags };
  }, [groups]);

  const filteredGroups = useMemo(() => {
    let result = [...groups];

    // Quick Filter
    if (filterMode === "empty")
      result = result.filter((g) => !g.tags || g.tags.length === 0);
    else if (filterMode === "populated")
      result = result.filter((g) => g.tags && g.tags.length > 0);

    // Search Logic
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (g) =>
          (g.name || "").toLowerCase().includes(term) ||
          (g.tags || []).some((t) =>
            (t.name || "").toLowerCase().includes(term),
          ),
      );
    }

    return result.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "vi"),
    );
  }, [groups, searchTerm, filterMode]);

  // 🔹 STATE HELPERS
  const markState = (
    setState: React.Dispatch<React.SetStateAction<number[]>>,
    id: number,
    value: boolean,
  ) => {
    setState((prev) =>
      value ? [...new Set([...prev, id])] : prev.filter((item) => item !== id),
    );
  };

  const isGroupDirty = (group: ProductTagGroup) =>
    (editingGroupValues[group.id] ?? "").trim() !== (group.name ?? "").trim();
  const isTagDirty = (tag: ProductTag) =>
    (editingTagValues[tag.id] ?? "").trim() !== (tag.name ?? "").trim();

  // 🔹 API HANDLERS
  const handleCreateGroup = async () => {
    const value = newGroupName.trim();
    if (!value) return showErrorToast("Vui lòng nhập tên nhóm Tag.");
    if (groups.some((g) => g.name.trim().toLowerCase() === value.toLowerCase()))
      return showErrorToast("Nhóm này đã tồn tại.");

    try {
      setCreatingGroup(true);
      const res = await http<ApiOk>(
        "POST",
        "/api/v1/admin/product-tag-groups/create",
        { name: value },
      );
      if (res?.success) {
        setNewGroupName("");
        setFlashNewGroup(true);
        setTimeout(() => setFlashNewGroup(false), 500);
        await fetchGroups();
      } else showErrorToast(res?.message || "Thêm nhóm thất bại.");
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối máy chủ.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSaveGroup = async (group: ProductTagGroup) => {
    const nextName = (editingGroupValues[group.id] ?? "").trim();
    if (!nextName) return showErrorToast("Tên nhóm không được để trống.");
    if (!isGroupDirty(group)) return;

    try {
      markState(setSavingGroupIds, group.id, true);
      const res = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/product-tag-groups/edit/${group.id}`,
        { name: nextName },
      );
      if (res?.success) {
        setGroups((prev) =>
          prev.map((item) =>
            item.id === group.id ? { ...item, name: nextName } : item,
          ),
        );
        showSuccessToast({ message: "Đã cập nhật tên nhóm!" });
      } else showErrorToast(res?.message || "Cập nhật nhóm thất bại.");
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối.");
    } finally {
      markState(setSavingGroupIds, group.id, false);
    }
  };

  const handleDeleteGroup = async (group: ProductTagGroup) => {
    const tagCount = group.tags?.length || 0;
    if (tagCount > 0) {
      markState(setDeleteBlockedGroupIds, group.id, true);
      setTimeout(
        () => markState(setDeleteBlockedGroupIds, group.id, false),
        3000,
      );
      return showErrorToast(
        `Không thể xóa nhánh "${group.name}". Hãy xóa hết ${tagCount} tag bên trong trước.`,
      );
    }

    if (!window.confirm(`Bạn có chắc muốn xóa nhóm "${group.name}" không?`))
      return;

    try {
      markState(setDeletingGroupIds, group.id, true);
      const res = await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/product-tag-groups/${group.id}`,
      );
      if (res?.success) {
        setGroups((prev) => prev.filter((item) => item.id !== group.id));
        setEditingGroupValues((prev) => {
          const next = { ...prev };
          delete next[group.id];
          return next;
        });
        markState(setDeleteBlockedGroupIds, group.id, false);
        showSuccessToast({ message: "Đã xóa nhóm thành công!" });
      } else showErrorToast(res?.message || "Xóa nhóm thất bại.");
    } catch (err: any) {
      showErrorToast("Không thể xóa nhóm.");
    } finally {
      markState(setDeletingGroupIds, group.id, false);
    }
  };

  const handleSaveTag = async (tag: ProductTag) => {
    const nextName = (editingTagValues[tag.id] ?? "").trim();
    if (!nextName) return showErrorToast("Tên tag không được để trống.");
    if (!isTagDirty(tag)) return;

    try {
      markState(setSavingTagIds, tag.id, true);
      const res = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/product-tags/edit/${tag.id}`,
        { name: nextName, productTagGroupId: tag.productTagGroupId },
      );
      if (res?.success) {
        setGroups((prev) =>
          prev.map((group) => ({
            ...group,
            tags: (group.tags || []).map((item) =>
              item.id === tag.id ? { ...item, name: nextName } : item,
            ),
          })),
        );
        showSuccessToast({ message: "Cập nhật tag thành công!" });
      } else showErrorToast(res?.message || "Cập nhật tag thất bại.");
    } catch (err: any) {
      showErrorToast("Lỗi kết nối.");
    } finally {
      markState(setSavingTagIds, tag.id, false);
    }
  };

  const handleDeleteTag = async (tag: ProductTag) => {
    if (!window.confirm(`Xóa tag "${tag.name}"?`)) return;
    try {
      markState(setDeletingTagIds, tag.id, true);
      const res = await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/product-tags/${tag.id}`,
      );
      if (res?.success) {
        setGroups((prev) =>
          prev.map((group) => {
            if (group.id !== tag.productTagGroupId) return group;
            const nextTags = (group.tags || []).filter(
              (item) => item.id !== tag.id,
            );
            if (nextTags.length === 0)
              markState(setDeleteBlockedGroupIds, group.id, false);
            return { ...group, tags: nextTags };
          }),
        );
        setEditingTagValues((prev) => {
          const next = { ...prev };
          delete next[tag.id];
          return next;
        });
      } else showErrorToast(res?.message || "Xóa tag thất bại.");
    } catch (err: any) {
      showErrorToast("Lỗi khi xóa tag.");
    } finally {
      markState(setDeletingTagIds, tag.id, false);
    }
  };

  const handleCreateTag = async (group: ProductTagGroup) => {
    const value = (createTagValues[group.id] ?? "").trim();
    if (!value) return showErrorToast("Vui lòng nhập tên tag.");
    if (
      (group.tags || []).some(
        (item) => item.name.trim().toLowerCase() === value.toLowerCase(),
      )
    )
      return showErrorToast("Tag này đã có trong nhóm.");

    try {
      markState(setCreatingTagGroupIds, group.id, true);
      const res = await http<ApiOk>(
        "POST",
        "/api/v1/admin/product-tags/create",
        { name: value, productTagGroupId: group.id },
      );
      if (res?.success) {
        setCreateTagValues((prev) => ({ ...prev, [group.id]: "" }));
        setFlashingTagGroupIds((prev) => [...prev, group.id]);
        setTimeout(
          () =>
            setFlashingTagGroupIds((prev) =>
              prev.filter((id) => id !== group.id),
            ),
          500,
        );
        await fetchGroups();
      } else showErrorToast(res?.message || "Thêm tag thất bại.");
    } catch (err: any) {
      showErrorToast("Lỗi khi thêm tag.");
    } finally {
      markState(setCreatingTagGroupIds, group.id, false);
    }
  };

  return (
    <div className="w-full pb-16 space-y-6">
      {/* 🔹 TẦNG 1: HEADER */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Tag System Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Xây dựng hệ thống nhãn và ngữ nghĩa để phân loại linh hoạt sản phẩm.
          </p>
        </div>
      </section>

      {/* 🔹 TẦNG 2: KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-center border-l-4 border-blue-500 bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Nhóm phân loại
            </span>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.totalGroups}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-center border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Tổng số Tag
            </span>
            <Tags className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.totalTags}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-center border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Nhóm đang rỗng
            </span>
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-500">
            {insights.emptyGroups}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-center border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Tag / Nhóm (TB)
            </span>
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.avgTags}
          </p>
        </Card>
      </section>

      {/* 🔹 TẦNG 3: QUICK CREATE ZONE */}
      <Card className="p-5 border border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-900/10">
        <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Bắt đầu xây dựng bằng cách tạo Nhóm Tag
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            disabled={creatingGroup}
            placeholder="Ví dụ: Phong cách, Chất liệu, Theo Mùa..."
            className={`flex-1 w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-all outline-none disabled:opacity-60 dark:bg-gray-800 dark:text-white ${flashNewGroup ? "border-emerald-500 ring-2 ring-emerald-200" : "border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-600"}`}
          />
          <button
            onClick={handleCreateGroup}
            disabled={creatingGroup}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {creatingGroup ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Tạo nhóm mới"
            )}
          </button>
        </div>
      </Card>

      {/* 🔹 TẦNG 4: CONTROL BAR */}
      <section className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên nhóm hoặc tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </section>

      {/* 🔹 TẦNG 5: TAG SYSTEM MAIN AREA */}
      {loading ? (
        <div className="flex py-24 justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : pageError ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{pageError}</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Không tìm thấy nhóm phân loại nào.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredGroups.map((group) => {
            const isBlocked = deleteBlockedGroupIds.includes(group.id);
            const isFlashing = flashingTagGroupIds.includes(group.id);
            const groupDirty = isGroupDirty(group);

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className={`p-4 border-b transition-colors ${groupDirty ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" : "bg-gray-50/50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700"}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingGroupValues[group.id] ?? ""}
                        onChange={(e) => {
                          setEditingGroupValues((p) => ({
                            ...p,
                            [group.id]: e.target.value,
                          }));
                          markState(setDeleteBlockedGroupIds, group.id, false);
                        }}
                        className={`text-lg font-bold bg-transparent border-b-2 focus:outline-none transition-colors w-full pb-0.5 ${groupDirty ? "text-amber-700 border-amber-400 dark:text-amber-400" : "text-gray-900 border-transparent hover:border-gray-300 focus:border-blue-500 dark:text-white dark:hover:border-gray-600"}`}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleSaveGroup(group)}
                        disabled={
                          !groupDirty || savingGroupIds.includes(group.id)
                        }
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 disabled:opacity-30 transition-colors"
                        title="Lưu tên nhóm"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        disabled={deletingGroupIds.includes(group.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                        title="Xóa toàn bộ nhóm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${group.tags?.length ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
                    >
                      {group.tags?.length || 0} Tags
                    </span>
                    {group.tags?.length === 0 && (
                      <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Nhóm trống
                      </span>
                    )}
                  </div>
                  {isBlocked && (
                    <p className="text-xs text-red-500 mt-2 font-medium">
                      Cần xóa tất cả tag bên dưới trước khi xóa nhóm.
                    </p>
                  )}
                </div>

                {/* Tags List */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  {(group.tags || []).map((tag) => {
                    const tagDirty = isTagDirty(tag);
                    return (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group/tag"
                      >
                        <input
                          type="text"
                          value={editingTagValues[tag.id] ?? ""}
                          onChange={(e) =>
                            setEditingTagValues((p) => ({
                              ...p,
                              [tag.id]: e.target.value,
                            }))
                          }
                          className={`flex-1 bg-transparent border rounded px-2 py-1 text-sm font-medium focus:outline-none transition-colors ${tagDirty ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200" : "border-transparent hover:border-gray-200 focus:border-blue-400 text-gray-700 dark:text-gray-300"}`}
                        />
                        <div className="flex items-center opacity-0 group-hover/tag:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleSaveTag(tag)}
                            disabled={
                              !tagDirty || savingTagIds.includes(tag.id)
                            }
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-30"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            disabled={deletingTagIds.includes(tag.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Create Tag Row */}
                  <div
                    className={`mt-auto pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex items-center gap-2 ${isFlashing ? "bg-emerald-50/50 rounded-lg p-2" : ""}`}
                  >
                    <input
                      type="text"
                      value={createTagValues[group.id] ?? ""}
                      onChange={(e) =>
                        setCreateTagValues((p) => ({
                          ...p,
                          [group.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateTag(group)
                      }
                      placeholder="+ Nhập tên tag mới..."
                      className="flex-1 bg-transparent border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => handleCreateTag(group)}
                      disabled={
                        creatingTagGroupIds.includes(group.id) ||
                        !(createTagValues[group.id] || "").trim()
                      }
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductTagPage;
