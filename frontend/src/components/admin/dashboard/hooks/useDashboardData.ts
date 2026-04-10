import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../context/AuthContextAdmin";
import { dashboardApi } from "../../../../services/api/dashboardApi";
import type {
  DashboardData,
  DashboardHookState,
  DashboardRange,
} from "../types/dashboard";

type UseDashboardDataOptions = {
  initialRange?: DashboardRange;
};

type UseDashboardDataResult = DashboardHookState & {
  range: DashboardRange;
  selectedBranchId: number | null;
  isBranchLocked: boolean;
  setRange: (range: DashboardRange) => void;
  setSelectedBranchId: (branchId: number | null) => void;
  refresh: () => Promise<void>;
  resetFilters: () => void;
};

const normalizeRange = (value?: DashboardRange): DashboardRange => {
  if (value === "today" || value === "30d") return value;
  return "7d";
};

export const useDashboardData = (
  options?: UseDashboardDataOptions,
): UseDashboardDataResult => {
  const { user, branches, currentBranchId, setCurrentBranchId } = useAuth();

  const initialRange = useMemo(
    () => normalizeRange(options?.initialRange),
    [options?.initialRange],
  );

  const [range, setRangeState] = useState<DashboardRange>(initialRange);
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(
    currentBranchId ?? null,
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const requestIdRef = useRef(0);

  const isSuperAdmin = Number(user?.role_id ?? 0) === 1;
  const hasSingleBranch = branches.length <= 1;
  const isBranchLocked = !isSuperAdmin && hasSingleBranch;

  useEffect(() => {
    if (isSuperAdmin) {
      setSelectedBranchIdState((prev) => prev ?? null);
      return;
    }

    setSelectedBranchIdState(currentBranchId ?? null);
  }, [currentBranchId, isSuperAdmin]);

  const fetchDashboard = useCallback(
    async (opts?: { silent?: boolean }) => {
      const requestId = ++requestIdRef.current;

      try {
        setError("");

        if (opts?.silent) setRefreshing(true);
        else setLoading(true);

        const nextData = await dashboardApi.getAdminDashboard({
          range,
          branchId: selectedBranchId,
        });

        if (requestId !== requestIdRef.current) return;

        setData(nextData);
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return;
        setData(null);
        setError(err?.message || "Không thể tải dashboard");
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, selectedBranchId],
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const setRange = useCallback((nextRange: DashboardRange) => {
    setRangeState(normalizeRange(nextRange));
  }, []);

  const setSelectedBranchId = useCallback(
    (branchId: number | null) => {
      const normalized =
        branchId !== null && branchId !== undefined && Number(branchId) > 0
          ? Number(branchId)
          : null;

      setSelectedBranchIdState(normalized);

      // Đồng bộ current branch toàn admin shell nếu user chọn branch cụ thể.
      // Với super admin, null nghĩa là All branches nên không push vào context.
      if (normalized) {
        setCurrentBranchId(normalized);
      } else if (!isSuperAdmin) {
        setCurrentBranchId(currentBranchId ?? null);
      }
    },
    [currentBranchId, isSuperAdmin, setCurrentBranchId],
  );

  const refresh = useCallback(async () => {
    await fetchDashboard({ silent: true });
  }, [fetchDashboard]);

  const resetFilters = useCallback(() => {
    setRangeState(initialRange);
    setSelectedBranchIdState(isSuperAdmin ? null : (currentBranchId ?? null));
  }, [currentBranchId, initialRange, isSuperAdmin]);

  return {
    data,
    loading,
    refreshing,
    error,
    range,
    selectedBranchId,
    isBranchLocked,
    setRange,
    setSelectedBranchId,
    refresh,
    resetFilters,
  };
};
