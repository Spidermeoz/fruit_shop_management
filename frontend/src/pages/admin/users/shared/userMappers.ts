export type UserType = "internal" | "customer";

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
  status: "active" | "inactive" | "banned" | string;

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
  status: "active" | "inactive" | "banned" | string;

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

export const mapUserFromApi = (raw: UserApiItem): UserListItem => {
  const roleId =
    raw.role_id !== undefined && raw.role_id !== null
      ? Number(raw.role_id)
      : raw.role?.id !== undefined && raw.role?.id !== null
        ? Number(raw.role.id)
        : null;

  const branchIds = Array.isArray(raw.branch_ids)
    ? raw.branch_ids.map(Number).filter((x) => Number.isFinite(x) && x > 0)
    : Array.isArray(raw.branches)
      ? raw.branches
          .map((b) => Number(b.id))
          .filter((x) => Number.isFinite(x) && x > 0)
      : [];

  const primaryBranchId =
    raw.primary_branch_id !== undefined && raw.primary_branch_id !== null
      ? Number(raw.primary_branch_id)
      : Array.isArray(raw.branches)
        ? (raw.branches.find((b) => b.is_primary)?.id ?? null)
        : null;

  return {
    id: Number(raw.id),
    fullName: raw.full_name ?? null,
    email: raw.email,
    avatar: raw.avatar ?? null,
    phone: raw.phone ?? null,
    status: raw.status,
    roleId,
    role: raw.role ?? null,
    createdAt: raw.created_at ?? null,
    updatedAt: raw.updated_at ?? null,
    primaryBranchId:
      primaryBranchId !== null && primaryBranchId !== undefined
        ? Number(primaryBranchId)
        : null,
    branchIds,
    branches: Array.isArray(raw.branches) ? raw.branches : [],
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
    branchIds: isInternal ? branchIds : [],
    primaryBranchId:
      isInternal && primaryBranchId !== "" ? Number(primaryBranchId) : null,
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
