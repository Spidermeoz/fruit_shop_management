import type { DashboardData, DashboardQueryInput } from "./types";

export interface DashboardRepository {
  getAdminDashboard(input: DashboardQueryInput): Promise<DashboardData>;
}
