import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Shield,
  UserPlus,
  ShieldAlert,
  PhoneOff,
  GitBranch,
  AlertTriangle,
  ArrowRight,
  User,
  LayoutDashboard,
  PowerOff,
  Loader2,
  Clock,
  Layers,
  CheckCircle2,
  X,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { fetchUsers } from "./shared/userApi";
import { getUserBranchScopeHealth } from "./shared/userMappers";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// INTERFACES FOR HUB STATS
// ==========================================
interface HubStats {
  total: number;
  customers: number;
  internal: number;
  inactive: number;
  attentionRequired: number;

  alerts: {
    noBranches: number;
    missingPrimary: number;
    missingPhone: number;
    recentUsers: number;
  };
}

const initialStats: HubStats = {
  total: 0,
  customers: 0,
  internal: 0,
  inactive: 0,
  attentionRequired: 0,
  alerts: { noBranches: 0, missingPrimary: 0, missingPhone: 0, recentUsers: 0 },
};

// ==========================================
// MAIN HUB PAGE COMPONENT
// ==========================================
const UsersHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HubStats>(initialStats);

  // --- Data Aggregation Strategy ---
  useEffect(() => {
    const loadHubStats = async () => {
      try {
        setLoading(true);
        // Fetch samples of both types to build the operational overview
        const [customerRes, internalRes] = await Promise.all([
          fetchUsers({ userType: "customer", limit: 1000 }),
          fetchUsers({ userType: "internal", limit: 1000 }),
        ]);

        const customers = customerRes.rows;
        const internals = internalRes.rows;
        const allUsers = [...customers, ...internals];

        // Calculate specific operational signals
        let noBranches = 0;
        let missingPrimary = 0;

        internals.forEach((u) => {
          const health = getUserBranchScopeHealth(u);
          if (health === "no-branches") noBranches++;
          if (health === "missing-primary" || health === "orphan-primary")
            missingPrimary++;
        });

        const missingPhone = customers.filter((c) => !c.phone).length;
        const inactive = allUsers.filter((u) => u.status === "inactive").length;

        // Users created in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = allUsers.filter(
          (u) => u.createdAt && new Date(u.createdAt) >= sevenDaysAgo,
        ).length;

        setStats({
          total: customerRes.total + internalRes.total, // Use real total from meta
          customers: customerRes.total,
          internal: internalRes.total,
          inactive,
          attentionRequired: noBranches + missingPrimary + missingPhone,
          alerts: { noBranches, missingPrimary, missingPhone, recentUsers },
        });
      } catch (error: any) {
        showErrorToast("Không thể tải dữ liệu tổng quan hệ thống user.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadHubStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Đang tải User Administration Hub...
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Đang phân tích dữ liệu phân quyền và tín hiệu vận hành.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-10 space-y-6">
      {/* 🔹 TẦNG A: HEADER WORKSPACE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              User Administration Hub
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
              <LayoutDashboard className="w-3.5 h-3.5" /> Tổng quan
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Theo dõi toàn bộ hệ thống người dùng, phát hiện nhóm cần chú ý và đi
            nhanh đến đúng luồng quản trị.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors text-sm shadow-sm"
          >
            Mở danh sách Users
          </button>

          <div className="relative group flex-1 md:flex-none">
            <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Tạo tài khoản
            </button>
            {/* Dropdown for creation */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 transform origin-top-right">
              <div className="p-1">
                <button
                  onClick={() => navigate("/admin/users/create?type=customer")}
                  className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4 text-blue-500" /> Khách hàng
                </button>
                <button
                  onClick={() => navigate("/admin/users/create?type=internal")}
                  className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-purple-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-2 transition-colors mt-1"
                >
                  <Shield className="w-4 h-4 text-purple-500" /> Nhân sự nội bộ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 TẦNG B: SYSTEM SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          {
            label: "Tổng hệ thống",
            value: stats.total,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Khách hàng",
            value: stats.customers,
            icon: User,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
          {
            label: "Nhân sự nội bộ",
            value: stats.internal,
            icon: Shield,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Đang tạm dừng",
            value: stats.inactive,
            icon: PowerOff,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Cần rà soát",
            value: stats.attentionRequired,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: stats.attentionRequired > 0,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${kpi.bg} dark:bg-gray-800`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-xl font-black truncate ${
                kpi.isWarning
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 TẦNG C: ENTRY CARDS / QUICK NAVIGATION */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
          Lối tắt vận hành
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/admin/users?type=customer")}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Quản lý Khách hàng
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1 leading-relaxed font-medium">
              Xem, lọc và quản lý hồ sơ của toàn bộ tài khoản khách hàng trên hệ
              thống.
            </p>
            <div className="mt-4 flex items-center text-[13px] font-bold text-blue-600 dark:text-blue-400">
              Mở danh sách{" "}
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/users?type=internal")}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Nhân sự nội bộ
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1 leading-relaxed font-medium">
              Quản lý vai trò, trạng thái và Access Scope (Chi nhánh) của các
              staff.
            </p>
            <div className="mt-4 flex items-center text-[13px] font-bold text-purple-600 dark:text-purple-400">
              Mở danh sách{" "}
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/users/create?type=customer")}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                Tạo Khách hàng
              </h3>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300/80 flex-1 leading-relaxed font-medium">
              Khởi tạo nhanh tài khoản customer mới và thiết lập thông tin cơ
              bản.
            </p>
          </div>

          <div
            onClick={() => navigate("/admin/users/create?type=internal")}
            className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-purple-900 dark:text-purple-100 text-sm">
                Tạo Nhân sự
              </h3>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300/80 flex-1 leading-relaxed font-medium">
              Khởi tạo tài khoản nội bộ và gán Role & Branch Scope vận hành trực
              tiếp.
            </p>
          </div>
        </div>
      </div>

      {/* 🔹 TẦNG D: ALERTS & CAPABILITY SPLIT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Triage Alerts (2 columns wide) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Cần chú ý (Triage)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alert 1: No branches */}
            <div
              className={`p-4 rounded-xl border shadow-sm flex flex-col ${
                stats.alerts.noBranches > 0
                  ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-red-500" /> Nội bộ thiếu
                  Scope
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stats.alerts.noBranches > 0
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {stats.alerts.noBranches}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1 leading-relaxed font-medium">
                Tài khoản nhân sự chưa được gán bất kỳ chi nhánh nào, không thể
                thao tác vận hành hệ thống.
              </p>
              <button
                disabled={stats.alerts.noBranches === 0}
                onClick={() =>
                  navigate("/admin/users?type=internal&smartFilter=no-branches")
                }
                className="text-[13px] font-bold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                Rà soát ngay <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert 2: Missing Primary */}
            <div
              className={`p-4 rounded-xl border shadow-sm flex flex-col ${
                stats.alerts.missingPrimary > 0
                  ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" /> Thiếu Primary
                  Branch
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stats.alerts.missingPrimary > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {stats.alerts.missingPrimary}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1 leading-relaxed font-medium">
                Nhân sự đã được gán chi nhánh nhưng chưa thiết lập chi nhánh
                chính làm scope mặc định.
              </p>
              <button
                disabled={stats.alerts.missingPrimary === 0}
                onClick={() =>
                  navigate(
                    "/admin/users?type=internal&smartFilter=missing-primary",
                  )
                }
                className="text-[13px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                Rà soát ngay <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert 3: Missing Phone */}
            <div
              className={`p-4 rounded-xl border shadow-sm flex flex-col ${
                stats.alerts.missingPhone > 0
                  ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <PhoneOff className="w-4 h-4 text-amber-500" /> Khách thiếu
                  SĐT
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stats.alerts.missingPhone > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {stats.alerts.missingPhone}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1 leading-relaxed font-medium">
                Tài khoản khách hàng chưa hoàn thiện thông tin liên hệ cơ bản
                (SĐT) trong hồ sơ.
              </p>
              <button
                disabled={stats.alerts.missingPhone === 0}
                onClick={() =>
                  navigate(
                    "/admin/users?type=customer&smartFilter=missing-phone",
                  )
                }
                className="text-[13px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                Mở danh sách <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert 4: Inactive & Recent */}
            <div className="p-4 rounded-xl border bg-blue-50/30 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Vận hành chung
                  </h4>
                </div>
                <div className="flex flex-col gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  <span
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit"
                    onClick={() => navigate("/admin/users?status=inactive")}
                  >
                    <PowerOff className="w-3.5 h-3.5" /> {stats.inactive} Tài
                    khoản đang tạm dừng
                  </span>
                  <span
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit"
                    onClick={() =>
                      navigate("/admin/users?sort=created_at:desc")
                    }
                  >
                    <UserPlus className="w-3.5 h-3.5" />{" "}
                    {stats.alerts.recentUsers} Tài khoản mới (7 ngày)
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/users?sort=created_at:desc")}
                className="text-[13px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Xem Users mới nhất <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Capability Split (1 column wide) */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Cấu trúc hệ thống
            </h2>
          </div>

          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-[calc(100%-2rem)]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-sky-50/50 dark:bg-sky-900/10 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Customer Capability
                </h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />{" "}
                  Quản lý hồ sơ định danh & Liên hệ
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />{" "}
                  Tra cứu lịch sử đơn hàng
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                  <X className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />{" "}
                  Không có quyền truy cập hệ thống Admin
                </li>
              </ul>
            </div>

            <div className="p-5 bg-purple-50/50 dark:bg-purple-900/10 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Internal Capability
                </h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />{" "}
                  Role-based Access Control (RBAC)
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />{" "}
                  Gán <strong>Branch Scope</strong> vận hành
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />{" "}
                  Bắt buộc cấu hình <strong>Primary Branch</strong>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UsersHubPage;
