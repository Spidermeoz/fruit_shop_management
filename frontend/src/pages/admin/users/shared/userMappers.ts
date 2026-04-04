export type UserType = "internal" | "customer";

export type UserStatus = "active" | "inactive" | "banned" | string;

export interface RoleOption {
  id: number;
  title: string;
}

export interface BranchOption {
  id: number;
  name: string;
  code: string;
  status?: string;
}

export interface UserBranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
  is_primary?: boolean;
}

export interface UserApiItem {
  id: number;
  full_name?: string | null;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  status: UserStatus;

  role_id?: number | null;
  role?: {
    id: number;
    title: string;
  } | null;

  created_at?: string;
  updated_at?: string;

  primary_branch_id?: number | null;
  branch_ids?: number[];
  branches?: UserBranchSummary[];
}

export interface UserListItem {
  id: number;
  fullName: string | null;
  email: string;
  avatar: string | null;
  phone: string | null;
  status: UserStatus;

  roleId: number | null;
  role: {
    id: number;
    title: string;
  } | null;

  createdAt: string | null;
  updatedAt: string | null;

  primaryBranchId: number | null;
  branchIds: number[];
  branches: UserBranchSummary[];

  userType: UserType;
}

export interface UserFormValues {
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  status: "active" | "inactive";
  roleId: number | "";
}

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>> & {
  password?: string;
  confirmPassword?: string;
  branches?: string;
  primaryBranchId?: string;
  avatarUrl?: string;
};

export type UserStatusMeta = {
  label: string;
  tone: "green" | "yellow" | "red" | "gray";
  className: string;
};

export type UserScopeHealth =
  | "customer"
  | "single"
  | "multi"
  | "missing-primary"
  | "orphan-primary"
  | "no-branches";

const STATUS_META_MAP: Record<string, UserStatusMeta> = {
  active: {
    label: "Hoạt động",
    tone: "green",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  inactive: {
    label: "Tạm dừng",
    tone: "yellow",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  banned: {
    label: "Bị khóa",
    tone: "red",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
};

export const inferUserType = (user: {
  role_id?: number | null;
  roleId?: number | null;
  role?: unknown;
}): UserType => {
  const roleId =
    user.roleId !== undefined
      ? user.roleId
      : user.role_id !== undefined
        ? user.role_id
        : null;

  return roleId !== null && roleId !== undefined ? "internal" : "customer";
};

export const isInternalUser = (user: {
  role_id?: number | null;
  roleId?: number | null;
  role?: unknown;
}) => inferUserType(user) === "internal";

export const isStaffRole = (roleId: number | "" | null | undefined) =>
  roleId !== "" && roleId !== null && roleId !== undefined;

export const normalizeBranchIds = (arr?: number[] | null): number[] =>
  Array.isArray(arr)
    ? [...arr]
        .map(Number)
        .filter((x) => Number.isFinite(x) && x > 0)
        .sort((a, b) => a - b)
    : [];

export const mapUserFromApi = (raw: UserApiItem): UserListItem => {
  const roleId =
    raw.role_id !== undefined && raw.role_id !== null
      ? Number(raw.role_id)
      : raw.role?.id !== undefined && raw.role?.id !== null
        ? Number(raw.role.id)
        : null;

  const branches = Array.isArray(raw.branches) ? raw.branches : [];

  const branchIds = Array.isArray(raw.branch_ids)
    ? normalizeBranchIds(raw.branch_ids)
    : normalizeBranchIds(branches.map((b) => Number(b.id)));

  const primaryBranchId =
    raw.primary_branch_id !== undefined && raw.primary_branch_id !== null
      ? Number(raw.primary_branch_id)
      : branches.find((b) => b.is_primary)?.id !== undefined
        ? Number(branches.find((b) => b.is_primary)?.id)
        : null;

  return {
    id: Number(raw.id),
    fullName: raw.full_name ?? null,
    email: raw.email ?? "",
    avatar: raw.avatar ?? null,
    phone: raw.phone ?? null,
    status: raw.status ?? "inactive",
    roleId,
    role: raw.role ?? null,
    createdAt: raw.created_at ?? null,
    updatedAt: raw.updated_at ?? null,
    primaryBranchId:
      primaryBranchId !== null && primaryBranchId !== undefined
        ? Number(primaryBranchId)
        : null,
    branchIds,
    branches,
    userType: roleId !== null ? "internal" : "customer",
  };
};

export const mapUserFormFromApi = (raw: UserApiItem): UserFormValues => ({
  fullName: raw.full_name ?? "",
  email: raw.email ?? "",
  phone: raw.phone ?? "",
  avatar: raw.avatar ?? "",
  status:
    raw.status === "inactive" || raw.status === "active"
      ? raw.status
      : "active",
  roleId:
    raw.role_id !== undefined && raw.role_id !== null
      ? Number(raw.role_id)
      : raw.role?.id !== undefined && raw.role?.id !== null
        ? Number(raw.role.id)
        : "",
});

export const buildUserPayload = (input: {
  values: UserFormValues;
  userType: UserType;
  avatarUrl?: string | null;
  branchIds?: number[];
  primaryBranchId?: number | "";
  password?: string;
}) => {
  const {
    values,
    userType,
    avatarUrl,
    branchIds = [],
    primaryBranchId = "",
    password,
  } = input;

  const normalizedBranchIds = normalizeBranchIds(branchIds);
  const isInternal = userType === "internal" && isStaffRole(values.roleId);

  return {
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    avatar: avatarUrl || null,
    status: values.status,
    role_id:
      userType === "customer"
        ? null
        : values.roleId === ""
          ? null
          : Number(values.roleId),
    ...(password !== undefined ? { password } : {}),
    branchIds: isInternal ? normalizedBranchIds : [],
    primaryBranchId:
      isInternal &&
      primaryBranchId !== "" &&
      normalizedBranchIds.includes(Number(primaryBranchId))
        ? Number(primaryBranchId)
        : null,
  };
};

export const getPrimaryBranch = (user: {
  primaryBranchId?: number | null;
  primary_branch_id?: number | null;
  branches?: UserBranchSummary[];
}) => {
  const branches = Array.isArray(user.branches) ? user.branches : [];
  const primaryId =
    user.primaryBranchId ??
    user.primary_branch_id ??
    branches.find((b) => b.is_primary)?.id ??
    null;

  return (
    branches.find((b) => b.is_primary) ??
    branches.find((b) => b.id === primaryId) ??
    null
  );
};

export const getUserDisplayName = (user: {
  fullName?: string | null;
  email?: string | null;
}) => {
  const name = user.fullName?.trim();
  if (name) return name;

  const email = user.email?.trim();
  return email || "Người dùng chưa đặt tên";
};

export const getUserInitials = (value?: string | null) => {
  const text = (value || "").trim();
  if (!text) return "U";

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

export const getUserTypeLabel = (userType: UserType) =>
  userType === "internal" ? "Nhân sự nội bộ" : "Khách hàng";

export const getUserStatusMeta = (status?: string | null): UserStatusMeta => {
  const key = String(status || "")
    .toLowerCase()
    .trim();
  return (
    STATUS_META_MAP[key] || {
      label: status || "Không xác định",
      tone: "gray",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    }
  );
};

export const getUserBranchScopeHealth = (user: {
  userType?: UserType;
  branchIds?: number[];
  primaryBranchId?: number | null;
  branches?: UserBranchSummary[];
}): UserScopeHealth => {
  if (user.userType === "customer") return "customer";

  const branchIds = normalizeBranchIds(
    user.branchIds ??
      (Array.isArray(user.branches)
        ? user.branches.map((b) => Number(b.id))
        : []),
  );
  const primaryBranchId =
    user.primaryBranchId ??
    user.branches?.find((b) => b.is_primary)?.id ??
    null;

  if (!branchIds.length) return "no-branches";
  if (primaryBranchId === null || primaryBranchId === undefined) {
    return "missing-primary";
  }
  if (!branchIds.includes(Number(primaryBranchId))) {
    return "orphan-primary";
  }
  if (branchIds.length === 1) return "single";
  return "multi";
};

export const getUserBranchScopeSummary = (user: {
  userType?: UserType;
  branchIds?: number[];
  primaryBranchId?: number | null;
  branches?: UserBranchSummary[];
}) => {
  const health = getUserBranchScopeHealth(user);

  switch (health) {
    case "customer":
      return {
        label: "Không áp dụng branch scope",
        description: "Tài khoản khách hàng không gắn chi nhánh cố định.",
      };
    case "no-branches":
      return {
        label: "Chưa có chi nhánh",
        description: "Tài khoản nội bộ này chưa được gán chi nhánh nào.",
      };
    case "missing-primary":
      return {
        label: "Thiếu chi nhánh chính",
        description: "Đã gán chi nhánh nhưng chưa chọn primary branch.",
      };
    case "orphan-primary":
      return {
        label: "Primary branch không hợp lệ",
        description: "Chi nhánh chính hiện không nằm trong danh sách được gán.",
      };
    case "single":
      return {
        label: "Single-branch scope",
        description: "Người dùng đang hoạt động trong phạm vi 1 chi nhánh.",
      };
    case "multi":
      return {
        label: "Multi-branch scope",
        description: "Người dùng đang được gán nhiều chi nhánh.",
      };
    default:
      return {
        label: "Không xác định",
        description: "Không thể xác định phạm vi chi nhánh.",
      };
  }
};

export const getUserWorkspaceWarnings = (user: {
  userType: UserType;
  phone?: string | null;
  status?: string | null;
  branchIds?: number[];
  primaryBranchId?: number | null;
  branches?: UserBranchSummary[];
}) => {
  const warnings: string[] = [];

  if (!user.phone?.trim()) {
    warnings.push("Chưa có số điện thoại.");
  }

  if (String(user.status || "").toLowerCase() === "inactive") {
    warnings.push("Tài khoản đang ở trạng thái tạm dừng.");
  }

  if (user.userType === "internal") {
    const scopeHealth = getUserBranchScopeHealth(user);

    if (scopeHealth === "no-branches") {
      warnings.push("Nhân sự nội bộ chưa được gán chi nhánh.");
    }

    if (scopeHealth === "missing-primary") {
      warnings.push("Nhân sự nội bộ chưa có chi nhánh chính.");
    }

    if (scopeHealth === "orphan-primary") {
      warnings.push(
        "Chi nhánh chính hiện không hợp lệ so với danh sách được gán.",
      );
    }
  }

  return warnings;
};

export const formatUserDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatUserDateTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN");
};
