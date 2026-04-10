import { http } from "../http";
import type {
  DashboardApiResponse,
  DashboardData,
  DashboardRange,
} from "../../components/admin/dashboard/types/dashboard";

export type GetDashboardParams = {
  range?: DashboardRange;
  branchId?: number | null;
};

const buildDashboardUrl = (params?: GetDashboardParams) => {
  const query = new URLSearchParams();

  if (params?.range) {
    query.set("range", params.range);
  }

  if (
    params?.branchId !== undefined &&
    params?.branchId !== null &&
    Number(params.branchId) > 0
  ) {
    query.set("branchId", String(params.branchId));
  }

  const qs = query.toString();
  return qs ? `/api/v1/admin/dashboard?${qs}` : "/api/v1/admin/dashboard";
};

export const getAdminDashboard = async (
  params?: GetDashboardParams,
): Promise<DashboardData> => {
  const url = buildDashboardUrl(params);
  const res = await http<DashboardApiResponse>("GET", url);

  if (!res?.success || !res?.data) {
    throw new Error(res?.message || "Không thể tải dashboard");
  }

  return res.data;
};

export const dashboardApi = {
  getAdminDashboard,
};
