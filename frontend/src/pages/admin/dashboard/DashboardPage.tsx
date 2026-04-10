import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useAuth } from "../../../context/AuthContextAdmin";
import DashboardHeroSection from "../../../components/admin/dashboard/sections/DashboardHeroSection";
import SuperAdminDashboardSection from "../../../components/admin/dashboard/sections/SuperAdminDashboardSection";
import BranchAdminDashboardSection from "../../../components/admin/dashboard/sections/BranchAdminDashboardSection";
import FunctionalDashboardSection from "../../../components/admin/dashboard/sections/FunctionalDashboardSection";
import DashboardEmptyState from "../../../components/admin/dashboard/shared/DashboardEmptyState";
import DashboardSkeleton from "../../../components/admin/dashboard/shared/DashboardSkeleton";
import { useDashboardData } from "../../../components/admin/dashboard/hooks/useDashboardData";
import { useDashboardVisibility } from "../../../components/admin/dashboard/hooks/useDashboardVisibility";
import {
  resolveDashboardSubtitle,
  resolveDashboardTitle,
} from "../../../components/admin/dashboard/utils/dashboardGuards";

export default function DashboardPage() {
  const { branches, currentBranch } = useAuth();

  const {
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
  } = useDashboardData({
    initialRange: "7d",
  });

  const visibility = useDashboardVisibility(data?.widgets, data?.viewer);

  const branchOptions = branches.map((branch) => ({
    id: branch.id,
    name: branch.name || `Branch #${branch.id}`,
    code: branch.code ?? null,
  }));

  const branchName =
    data?.viewer.resolvedBranchId != null
      ? (branches.find((b) => b.id === data.viewer.resolvedBranchId)?.name ??
        currentBranch?.name ??
        null)
      : visibility.isSuperAdmin
        ? "Tất cả chi nhánh"
        : (currentBranch?.name ?? null);

  const title = resolveDashboardTitle(visibility);
  const subtitle = resolveDashboardSubtitle(visibility);

  const handleRetry = async () => {
    await refresh();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <DashboardSkeleton lines={2} className="min-h-[148px]" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardSkeleton className="min-h-[160px]" />
          <DashboardSkeleton className="min-h-[160px]" />
          <DashboardSkeleton className="min-h-[160px]" />
          <DashboardSkeleton className="min-h-[160px]" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardSkeleton lines={6} className="min-h-[320px]" />
          <DashboardSkeleton lines={6} className="min-h-[320px]" />
        </div>

        <DashboardSkeleton lines={10} className="min-h-[420px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardHeroSection
        title={title}
        subtitle={subtitle}
        tier={data?.viewer.tier ?? visibility.tier}
        scopeMode={data?.viewer.scopeMode ?? visibility.scopeMode}
        branchName={branchName}
        range={range}
        onRangeChange={setRange}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        branches={branchOptions}
        canAccessBranchSwitcher={visibility.canAccessBranchSwitcher}
        canSeeAllBranches={visibility.canSeeAllBranches}
        isBranchLocked={isBranchLocked}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 dark:bg-slate-950/40 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-red-800 dark:text-red-200">
                Không thể tải dashboard
              </h2>
              <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-300">
                {error}
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => void handleRetry()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!error && !data ? (
        <DashboardEmptyState
          title="Dashboard chưa sẵn sàng"
          description="Hiện chưa có dữ liệu phù hợp để hiển thị dashboard trong phạm vi này."
        />
      ) : null}

      {!error && data && !visibility.hasAnyVisibleWidget ? (
        <DashboardEmptyState
          title="Không có widget phù hợp với quyền hiện tại"
          description="Tài khoản của bạn đã đăng nhập thành công nhưng hiện chưa có module dashboard nào được bật theo phạm vi quyền hiện tại."
        />
      ) : null}

      {!error && data && visibility.hasAnyVisibleWidget ? (
        <>
          {visibility.showExecutiveBoard ? (
            <SuperAdminDashboardSection data={data} />
          ) : null}

          {!visibility.showExecutiveBoard && visibility.showBranchOpsBoard ? (
            <BranchAdminDashboardSection data={data} />
          ) : null}

          {!visibility.showExecutiveBoard && visibility.showFunctionalBoard ? (
            <FunctionalDashboardSection data={data} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
