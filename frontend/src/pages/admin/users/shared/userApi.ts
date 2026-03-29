import { http } from "../../../../services/http";
import type {
  BranchOption,
  RoleOption,
  UserApiItem,
  UserListItem,
  UserType,
} from "./userMappers";
import { mapUserFromApi } from "./userMappers";

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
};

type ApiDetail<T> = {
  success: true;
  data: T;
  meta?: any;
};

type ApiOk = {
  success: true;
  data?: any;
  url?: string;
  meta?: any;
  errors?: Record<string, string>;
};

export type FetchUsersParams = {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  sort?: string;
  userType: UserType;
  branchId?: string | number | null;
};

export type FetchUsersResult = {
  rows: UserListItem[];
  total: number;
  page: number;
  limit: number;
};

export const fetchUsers = async (
  params: FetchUsersParams,
): Promise<FetchUsersResult> => {
  const search = new URLSearchParams();

  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 10));
  search.set("type", params.userType);

  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }

  if (params.keyword?.trim()) {
    search.set("keyword", params.keyword.trim());
  }

  if (params.sort) {
    const [field, dir] = String(params.sort).split(":");
    if (field) search.set("sortBy", field);
    if (dir) search.set("order", dir.toUpperCase());
  }

  if (
    params.userType === "internal" &&
    params.branchId !== undefined &&
    params.branchId !== null &&
    String(params.branchId) !== "all"
  ) {
    search.set("branchId", String(params.branchId));
  }

  const res = await http<ApiList<UserApiItem>>(
    "GET",
    `/api/v1/admin/users?${search.toString()}`,
  );

  const rows = Array.isArray(res.data) ? res.data.map(mapUserFromApi) : [];
  const total = Number(res.meta?.total ?? 0);
  const page = Number(res.meta?.page ?? params.page ?? 1);
  const limit = Number(res.meta?.limit ?? params.limit ?? 10);

  return { rows, total, page, limit };
};

export const fetchUserDetail = async (id: number | string) => {
  const res = await http<ApiDetail<UserApiItem>>(
    "GET",
    `/api/v1/admin/users/detail/${id}`,
  );
  return mapUserFromApi(res.data);
};

export const fetchUserEditDetail = async (id: number | string) => {
  const res = await http<ApiDetail<UserApiItem>>(
    "GET",
    `/api/v1/admin/users/edit/${id}`,
  );
  return mapUserFromApi(res.data);
};

export const createUser = async (payload: Record<string, any>) => {
  return http<ApiOk>("POST", "/api/v1/admin/users/create", payload);
};

export const updateUser = async (
  id: number | string,
  payload: Record<string, any>,
) => {
  return http<ApiOk>("PATCH", `/api/v1/admin/users/edit/${id}`, payload);
};

export const deleteUser = async (id: number | string) => {
  return http<ApiOk>("DELETE", `/api/v1/admin/users/delete/${id}`);
};

export const updateUserStatus = async (
  id: number | string,
  status: "active" | "inactive",
) => {
  return http<ApiOk>("PATCH", `/api/v1/admin/users/${id}/status`, { status });
};

export const bulkEditUsers = async (body: {
  ids: number[];
  action: "status" | "delete" | "restore" | "role";
  value?: any;
}) => {
  return http<ApiOk>("PATCH", "/api/v1/admin/users/bulk-edit", body);
};

export const fetchRoles = async (): Promise<RoleOption[]> => {
  const res = await http<ApiList<RoleOption>>("GET", "/api/v1/admin/roles");
  return Array.isArray(res.data) ? res.data : [];
};

export const fetchBranches = async (): Promise<BranchOption[]> => {
  const res = await http<ApiList<BranchOption>>(
    "GET",
    "/api/v1/admin/branches?limit=100&status=active",
  );
  return Array.isArray(res.data) ? res.data : [];
};

export const uploadUserAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await http<ApiOk>("POST", "/api/v1/admin/upload", formData);
  const url = res?.data?.url || res?.url || "";

  if (!url) {
    throw new Error("Không thể upload ảnh đại diện.");
  }

  return url;
};
