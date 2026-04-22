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
  const { branches, currentBranchId, setCurrentBranchId } = useAuth();

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

  const isSuperAdmin = data?.viewer.tier === "super_admin";
  const hasSingleBranch = branches.length <= 1;
  const isBranchLocked = !isSuperAdmin && hasSingleBranch;

  useEffect(() => {
    if (isSuperAdmin) return;
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

        if (
          nextData.viewer.tier === "super_admin" &&
          selectedBranchId === null &&
          nextData.viewer.resolvedBranchId == null
        ) {
          return;
        }

        if (
          nextData.viewer.tier !== "super_admin" &&
          nextData.viewer.resolvedBranchId &&
          nextData.viewer.resolvedBranchId !== selectedBranchId
        ) {
          setSelectedBranchIdState(nextData.viewer.resolvedBranchId);
        }
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
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetchDashboard({ silent: true });
    }, 30000);

    return () => window.clearInterval(timer);
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

      if (normalized) {
        setCurrentBranchId(normalized);
        return;
      }

      if (!isSuperAdmin) {
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
