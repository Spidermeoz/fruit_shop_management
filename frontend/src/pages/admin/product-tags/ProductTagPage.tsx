import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
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

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};

type ApiOk = {
  success: true;
  data?: any;
  meta?: any;
  message?: string;
  errors?: Record<string, string>;
};

const ProductTagPage: React.FC = () => {
  const [groups, setGroups] = useState<ProductTagGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  // State quản lý hiệu ứng nhấp nháy khi thêm group thành công
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
  // State quản lý hiệu ứng nhấp nháy khi thêm tag thành công (lưu theo id của group)
  const [flashingTagGroupIds, setFlashingTagGroupIds] = useState<number[]>([]);

  const [editingTagValues, setEditingTagValues] = useState<
    Record<number, string>
  >({});
  const [createTagValues, setCreateTagValues] = useState<
    Record<number, string>
  >({});

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const getErrorMessage = (err: any, fallback = "Đã có lỗi xảy ra.") => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.data?.message ||
      err?.message ||
      fallback
    );
  };

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

      setEditingGroupValues((prev) => {
        const next = { ...prev };
        for (const group of normalizedRows) {
          next[group.id] = group.name ?? "";
        }
        return next;
      });

      setEditingTagValues((prev) => {
        const next = { ...prev };
        for (const group of normalizedRows) {
          for (const tag of group.tags || []) {
            next[tag.id] = tag.name ?? "";
          }
        }
        return next;
      });
    } catch (err: any) {
      console.error("fetchGroups error:", err);
      setPageError(
        err?.message || "Lỗi kết nối server hoặc API không phản hồi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const orderedGroups = useMemo(() => {
    return [...groups].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "vi"),
    );
  }, [groups]);

  const isSavingGroup = (id: number) => savingGroupIds.includes(id);
  const isDeletingGroup = (id: number) => deletingGroupIds.includes(id);
  const isDeleteBlockedGroup = (id: number) =>
    deleteBlockedGroupIds.includes(id);
  const isSavingTag = (id: number) => savingTagIds.includes(id);
  const isDeletingTag = (id: number) => deletingTagIds.includes(id);
  const isCreatingTag = (groupId: number) =>
    creatingTagGroupIds.includes(groupId);

  const markSavingGroup = (id: number, value: boolean) => {
    setSavingGroupIds((prev) =>
      value ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const markDeletingGroup = (id: number, value: boolean) => {
    setDeletingGroupIds((prev) =>
      value ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const markDeleteBlockedGroup = (id: number, value: boolean) => {
    setDeleteBlockedGroupIds((prev) =>
      value ? [...new Set([...prev, id])] : prev.filter((item) => item !== id),
    );
  };

  const markSavingTag = (id: number, value: boolean) => {
    setSavingTagIds((prev) =>
      value ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const markDeletingTag = (id: number, value: boolean) => {
    setDeletingTagIds((prev) =>
      value ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const markCreatingTag = (groupId: number, value: boolean) => {
    setCreatingTagGroupIds((prev) =>
      value ? [...prev, groupId] : prev.filter((item) => item !== groupId),
    );
  };

  const handleChangeGroupInlineValue = (id: number, value: string) => {
    setEditingGroupValues((prev) => ({
      ...prev,
      [id]: value,
    }));
    markDeleteBlockedGroup(id, false);
  };

  const handleChangeTagInlineValue = (id: number, value: string) => {
    setEditingTagValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleChangeCreateTagValue = (groupId: number, value: string) => {
    setCreateTagValues((prev) => ({
      ...prev,
      [groupId]: value,
    }));
  };

  const isGroupDirty = (group: ProductTagGroup) => {
    const current = (editingGroupValues[group.id] ?? "").trim();
    const original = (group.name ?? "").trim();
    return current !== original;
  };

  const isTagDirty = (tag: ProductTag) => {
    const current = (editingTagValues[tag.id] ?? "").trim();
    const original = (tag.name ?? "").trim();
    return current !== original;
  };

  const handleCreateGroup = async () => {
    const value = newGroupName.trim();

    if (!value) {
      showErrorToast("Vui lòng nhập tên group.");
      return;
    }

    const duplicated = groups.some(
      (group) => group.name.trim().toLowerCase() === value.toLowerCase(),
    );

    if (duplicated) {
      showErrorToast("Group này đã tồn tại.");
      return;
    }

    try {
      setCreatingGroup(true);

      const res = await http<ApiOk>(
        "POST",
        "/api/v1/admin/product-tag-groups/create",
        {
          name: value,
        },
      );

      if (res?.success) {
        setNewGroupName("");
        // Bật hiệu ứng nhấp nháy xanh
        setFlashNewGroup(true);
        setTimeout(() => setFlashNewGroup(false), 500);

        await fetchGroups();
      } else {
        showErrorToast(res?.message || "Thêm group thất bại.");
      }
    } catch (err: any) {
      console.error("handleCreateGroup error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSaveGroup = async (group: ProductTagGroup) => {
    const nextName = (editingGroupValues[group.id] ?? "").trim();

    if (!nextName) {
      showErrorToast("Tên group không được để trống.");
      return;
    }

    if (!isGroupDirty(group)) return;

    try {
      markSavingGroup(group.id, true);

      const res = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/product-tag-groups/edit/${group.id}`,
        {
          name: nextName,
        },
      );

      if (res?.success) {
        setGroups((prev) =>
          prev.map((item) =>
            item.id === group.id ? { ...item, name: nextName } : item,
          ),
        );
        showSuccessToast({ message: "Cập nhật group thành công!" });
      } else {
        showErrorToast(res?.message || "Cập nhật group thất bại.");
      }
    } catch (err: any) {
      console.error("handleSaveGroup error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      markSavingGroup(group.id, false);
    }
  };

  const handleDeleteGroup = async (group: ProductTagGroup) => {
    const tagCount = Array.isArray(group.tags) ? group.tags.length : 0;

    if (tagCount > 0) {
      markDeleteBlockedGroup(group.id, true);
      showErrorToast(
        `Không thể xóa group "${group.name}" vì group này vẫn còn ${tagCount} tag. Vui lòng xóa hoặc chuyển toàn bộ tag sang group khác trước.`,
      );
      return;
    }

    markDeleteBlockedGroup(group.id, false);

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa group "${group.name}" không?`,
    );
    if (!confirmed) return;

    try {
      markDeletingGroup(group.id, true);

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

        setDeleteBlockedGroupIds((prev) =>
          prev.filter((item) => item !== group.id),
        );

        showSuccessToast({ message: "Đã xóa group thành công!" });
      } else {
        showErrorToast(res?.message || "Xóa group thất bại.");
      }
    } catch (err: any) {
      console.error("handleDeleteGroup error:", err);
      showErrorToast(getErrorMessage(err, "Không thể xóa group."));
    } finally {
      markDeletingGroup(group.id, false);
    }
  };

  const handleSaveTag = async (tag: ProductTag) => {
    const nextName = (editingTagValues[tag.id] ?? "").trim();

    if (!nextName) {
      showErrorToast("Tên tag không được để trống.");
      return;
    }

    if (!isTagDirty(tag)) return;

    try {
      markSavingTag(tag.id, true);

      const res = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/product-tags/edit/${tag.id}`,
        {
          name: nextName,
          productTagGroupId: tag.productTagGroupId,
        },
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
      } else {
        showErrorToast(res?.message || "Cập nhật tag thất bại.");
      }
    } catch (err: any) {
      console.error("handleSaveTag error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      markSavingTag(tag.id, false);
    }
  };

  const handleDeleteTag = async (tag: ProductTag) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tag "${tag.name}" không?`,
    );
    if (!confirmed) return;

    try {
      markDeletingTag(tag.id, true);

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

            if (nextTags.length === 0) {
              markDeleteBlockedGroup(group.id, false);
            }

            return {
              ...group,
              tags: nextTags,
            };
          }),
        );

        setEditingTagValues((prev) => {
          const next = { ...prev };
          delete next[tag.id];
          return next;
        });

        showSuccessToast({ message: "Đã xóa tag thành công!" });
      } else {
        showErrorToast(res?.message || "Xóa tag thất bại.");
      }
    } catch (err: any) {
      console.error("handleDeleteTag error:", err);
      showErrorToast(err?.message || "Không thể xóa tag.");
    } finally {
      markDeletingTag(tag.id, false);
    }
  };

  const handleCreateTag = async (group: ProductTagGroup) => {
    const value = (createTagValues[group.id] ?? "").trim();

    if (!value) {
      showErrorToast("Vui lòng nhập giá trị tag.");
      return;
    }

    const duplicated = (group.tags || []).some(
      (item) => item.name.trim().toLowerCase() === value.toLowerCase(),
    );

    if (duplicated) {
      showErrorToast("Tag này đã tồn tại trong group.");
      return;
    }

    try {
      markCreatingTag(group.id, true);

      const res = await http<ApiOk>(
        "POST",
        "/api/v1/admin/product-tags/create",
        {
          name: value,
          productTagGroupId: group.id,
        },
      );

      if (res?.success) {
        setCreateTagValues((prev) => ({
          ...prev,
          [group.id]: "",
        }));

        // Bật hiệu ứng nhấp nháy xanh cho ô input của group này
        setFlashingTagGroupIds((prev) => [...prev, group.id]);
        setTimeout(() => {
          setFlashingTagGroupIds((prev) =>
            prev.filter((id) => id !== group.id),
          );
        }, 500);

        await fetchGroups();
      } else {
        showErrorToast(res?.message || "Thêm tag thất bại.");
      }
    } catch (err: any) {
      console.error("handleCreateTag error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      markCreatingTag(group.id, false);
    }
  };

  const handleCreateTagKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    group: ProductTagGroup,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleCreateTag(group);
    }
  };

  const handleCreateGroupKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleCreateGroup();
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Product Tags
          </h1>
        </div>

        <Card>
          <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={handleCreateGroupKeyDown}
                disabled={creatingGroup}
                className={`w-full rounded-md border px-3 py-2 text-gray-900 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-white ${
                  flashNewGroup
                    ? "border-green-500 ring-2 ring-green-500 dark:border-green-500"
                    : "border-gray-300 focus:ring-2 focus:ring-green-500 dark:border-gray-600"
                }`}
                placeholder="Nhập tên group mới"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50 dark:disabled:bg-gray-600"
              >
                {creatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang thêm group...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Thêm group
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Đang tải product tag groups...
            </span>
          </div>
        </Card>
      ) : pageError ? (
        <Card>
          <p className="py-8 text-center text-red-500 dark:text-red-400">
            {pageError}
          </p>
        </Card>
      ) : orderedGroups.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">
            Chưa có group nào.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {orderedGroups.map((group) => {
            const groupItems = [...(group.tags || [])].sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", "vi"),
            );

            const currentGroupValue = editingGroupValues[group.id] ?? "";
            const groupDirty = isGroupDirty(group);
            const savingGroup = isSavingGroup(group.id);
            const deletingGroup = isDeletingGroup(group.id);
            const hasTags = groupItems.length > 0;
            const showDeleteBlockedMessage =
              isDeleteBlockedGroup(group.id) && hasTags;
            const isFlashingTagInput = flashingTagGroupIds.includes(group.id);

            return (
              <Card key={group.id}>
                <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={currentGroupValue}
                        onChange={(e) =>
                          handleChangeGroupInlineValue(group.id, e.target.value)
                        }
                        disabled={savingGroup || deletingGroup}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-semibold text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Nhập tên group"
                      />

                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {groupItems.length} tag
                        {group.slug ? (
                          <>
                            {" "}
                            • slug:{" "}
                            <span className="font-medium">{group.slug}</span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveGroup(group)}
                          disabled={!groupDirty || savingGroup || deletingGroup}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50 dark:disabled:bg-gray-600"
                        >
                          {savingGroup ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Lưu group
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group)}
                          disabled={savingGroup || deletingGroup}
                          aria-disabled={hasTags}
                          title={
                            hasTags
                              ? "Không thể xóa group khi vẫn còn tag"
                              : "Xóa group"
                          }
                          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
        ${
          hasTags
            ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
        }
        ${savingGroup || deletingGroup ? "opacity-50 cursor-not-allowed" : ""}
      `}
                        >
                          {deletingGroup ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang xóa...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Xóa group
                            </>
                          )}
                        </button>
                      </div>

                      {showDeleteBlockedMessage ? (
                        <p className="text-right text-xs text-red-500 dark:text-red-400">
                          Không thể xóa group này vì vẫn còn tag bên trong. Hãy
                          xóa hoặc chuyển hết tag sang group khác trước.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    {groupItems.length === 0 ? (
                      <div className="rounded-md border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Chưa có tag nào trong group này.
                      </div>
                    ) : (
                      groupItems.map((tag) => {
                        const currentTagValue = editingTagValues[tag.id] ?? "";
                        const tagDirty = isTagDirty(tag);
                        const savingTag = isSavingTag(tag.id);
                        const deletingTag = isDeletingTag(tag.id);

                        return (
                          <div
                            key={tag.id}
                            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:flex-row md:items-center"
                          >
                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={currentTagValue}
                                onChange={(e) =>
                                  handleChangeTagInlineValue(
                                    tag.id,
                                    e.target.value,
                                  )
                                }
                                disabled={savingTag || deletingTag}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder="Nhập giá trị tag"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveTag(tag)}
                                disabled={!tagDirty || savingTag || deletingTag}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50 dark:disabled:bg-gray-600"
                              >
                                {savingTag ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    Lưu
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTag(tag)}
                                disabled={savingTag || deletingTag}
                                className="inline-flex items-center gap-2 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                              >
                                {deletingTag ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang xóa...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4" />
                                    Xóa
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={createTagValues[group.id] ?? ""}
                            onChange={(e) =>
                              handleChangeCreateTagValue(
                                group.id,
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => handleCreateTagKeyDown(e, group)}
                            disabled={isCreatingTag(group.id)}
                            className={`w-full rounded-md border px-3 py-2 text-gray-900 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-white ${
                              isFlashingTagInput
                                ? "border-green-500 ring-2 ring-green-500 dark:border-green-500"
                                : "border-gray-300 focus:ring-2 focus:ring-green-500 dark:border-gray-600"
                            }`}
                            placeholder={`Thêm tag mới cho group ${currentGroupValue || group.name}`}
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCreateTag(group)}
                            disabled={isCreatingTag(group.id)}
                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50 dark:disabled:bg-gray-600"
                          >
                            {isCreatingTag(group.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang thêm...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Thêm tag
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductTagPage;
