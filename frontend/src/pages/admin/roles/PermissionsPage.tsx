import React, { useEffect, useState } from "react";
import { Shield, Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { useNavigate } from "react-router-dom";

interface Role {
  id: number;
  title: string;
  permissions: Record<string, string[]>; // ví dụ: { product: ["read", "update"] }
}

interface Action {
  action_key: string;
  action_label: string;
}

interface PermissionGroup {
  group: string;
  key: string;
  actions: Action[];
}

const normalizeKey = (key: string) => key.replace(/s$/, "").toLowerCase();

const PermissionsPage: React.FC = () => {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
    []
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // 🔹 Fetch dữ liệu phân quyền
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/roles/permissions");
      const json = await res.json();

      if (json.success) {
        const groups = json.data || [];

        // 💡 SỬA: Chuẩn hóa các khóa trong object permissions của Role
        const parsedRoles = (json.roles || []).map((r: any) => {
          const rawPermissions =
            typeof r.permissions === "string"
              ? JSON.parse(r.permissions || "{}")
              : r.permissions || {};

          // Chuẩn hóa key permissions: "products" -> "product", "users" -> "user"
          const normalizedPermissions: Record<string, string[]> = {};
          for (const key in rawPermissions) {
            if (Object.prototype.hasOwnProperty.call(rawPermissions, key)) {
              normalizedPermissions[normalizeKey(key)] = rawPermissions[key];
            }
          }

          return {
            ...r,
            permissions: normalizedPermissions, // Gán permissions đã chuẩn hóa
          };
        });

        setPermissionGroups(groups);
        setRoles(parsedRoles);
      } else {
        alert(json.message || "Không thể tải dữ liệu phân quyền!");
      }
    } catch (err) {
      console.error("fetchPermissions error:", err);
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // ✅ Kiểm tra checkbox có được tick không
  const isChecked = (role: Role, moduleKey: string, actionKey: string) => {
    const normalizedKey = normalizeKey(moduleKey);
    const perms = role.permissions?.[normalizedKey] || [];
    return (
      perms.includes(actionKey) || perms.includes(mapLegacyAction(actionKey))
    );
  };

  // 🔹 Một số hệ thống backend có thể trả “read” thay vì “view”
  const mapLegacyAction = (action: string) => {
    if (action === "view") return "read";
    if (action === "read") return "view";
    if (action === "edit") return "update";
    if (action === "update") return "edit";
    return action;
  };

  // ✅ Toggle quyền
  const handleToggle = (
    roleId: number,
    moduleKey: string,
    actionKey: string
  ) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;

        const normalizedKey = normalizeKey(moduleKey);
        const current = role.permissions?.[normalizedKey] || [];
        const mappedAction = mapLegacyAction(actionKey);

        let newActions: string[];
        if (current.includes(actionKey) || current.includes(mappedAction)) {
          // Bỏ quyền
          newActions = current.filter(
            (a) => a !== actionKey && a !== mappedAction
          );
        } else {
          // Thêm quyền
          newActions = [...current, actionKey];
        }

        return {
          ...role,
          permissions: { ...role.permissions, [normalizedKey]: newActions },
        };
      })
    );
  };

  // ✅ Gửi cập nhật lên backend
  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/v1/admin/roles/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Cập nhật phân quyền thành công!");
      } else {
        alert(json.message || "Không thể lưu thay đổi!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu phân quyền...
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800 dark:text-white">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Phân quyền
        </h1>

        <div className="flex flex-wrap gap-3">
          {/* 🔙 Quay lại */}
          <button
            onClick={() => navigate("/admin/roles")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          {/* 💾 Cập nhật */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Cập nhật
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bảng phân quyền */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">
                  Tính năng
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold text-gray-800 dark:text-gray-200"
                  >
                    {role.title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {permissionGroups.map((group) => (
                <React.Fragment key={group.key}>
                  {/* Nhóm module */}
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-100"
                    >
                      {group.group}
                    </td>
                  </tr>

                  {/* Các hành động */}
                  {group.actions.map((action) => (
                    <tr key={action.action_key}>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">
                        {action.action_label}
                      </td>
                      {roles.map((role) => (
                        <td
                          key={role.id}
                          className="border border-gray-200 dark:border-gray-700 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked(
                              role,
                              group.key,
                              action.action_key
                            )}
                            onChange={() =>
                              handleToggle(
                                role.id,
                                group.key,
                                action.action_key
                              )
                            }
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PermissionsPage;
