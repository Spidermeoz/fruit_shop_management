import React, { useEffect, useState } from "react";
import { http } from "../../services/http";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

// Tăng số lượng màu sắc để tránh trùng lặp
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
  "#e11d48",
  "#0ea5e9",
  "#22c55e",
  "#facc15",
  "#f43f5e",
  "#7c3aed",
  "#ec4899",
  "#0891b2",
  "#65a30d",
  "#c026d3",
  "#dc2626",
  "#2563eb",
  "#059669",
  "#d97706",
  "#be123c",
  "#4c1d95",
  "#db2777",
  "#0e7490",
  "#15803d",
];

interface User {
  id: number;
  role_id: number | null;
  full_name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: string;
  deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  role: { id: number; title: string } | null;
}

// Component để hiển thị chú thích màu sắc
const CustomLegend = ({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) => (
  <div className="mt-4 flex flex-wrap gap-2 justify-center">
    {data.map((entry, index) => (
      <div key={entry.name} className="flex items-center gap-1">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: COLORS[index % COLORS.length] }}
        />
        {/* Thêm dark:text-gray-300 */}
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {entry.name} ({entry.value})
        </span>
      </div>
    ))}
  </div>
);

// Custom tooltip cho PieChart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      // Thêm màu nền và viền cho dark mode
      <div className="bg-white dark:bg-gray-800 p-2 shadow rounded border dark:border-gray-700">
        <p className="font-semibold dark:text-gray-100">{`${payload[0].name}`}</p>
        <p className="text-blue-600 dark:text-blue-400">{`Số lượng: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const UsersOverview: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    http<{ data: User[] }>("GET", "/api/v1/admin/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Summary
  const total = users.length;
  const active = users.filter((u) => u.status === "active").length;
  const inactive = users.filter((u) => u.status === "inactive").length;

  const withRole = users.filter((u) => u.role !== null).length;
  const withoutRole = users.filter((u) => u.role === null).length;

  // PIE — Users by Role
  const roleMap: Record<string, number> = {};
  users.forEach((u) => {
    const role = u.role?.title ?? "Không có quyền";
    roleMap[role] = (roleMap[role] || 0) + 1;
  });

  const rolePieData = Object.entries(roleMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Sắp xếp dữ liệu theo giá trị giảm dần để dễ xem
  rolePieData.sort((a, b) => b.value - a.value);

  // BAR — Status Distribution
  const statusData = [
    { name: "Hoạt động", value: active },
    { name: "Không hoạt động", value: inactive },
  ];

  // TOP — Latest Updated Users
  const latestUpdated = [...users]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 5);

  // TOP — Users with Role
  const importantUsers = users.filter((u) => u.role != null).slice(0, 5);

  // TOP — Recently Registered Users
  const recentlyRegistered = [...users]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  // Tính toán số lượng người dùng đăng ký trong 7 ngày qua
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newUsersThisWeek = users.filter(
    (u) => new Date(u.created_at) > sevenDaysAgo,
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          {/* Thêm dark:text-gray-400 */}
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          {/* Thêm dark:text-gray-600 */}
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          {/* Thêm dark:text-white */}
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Không có người dùng nào
          </h3>
          {/* Thêm dark:text-gray-400 */}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bắt đầu bằng cách thêm người dùng mới.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* Thêm dark:text-white */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Tổng quan người dùng
        </h2>
        {/* Thêm dark:text-gray-400 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard label="Tổng người dùng" value={total} color="blue" />
        <SummaryCard label="Hoạt động" value={active} color="green" />
        <SummaryCard label="Không hoạt động" value={inactive} color="red" />
        <SummaryCard label="Có phân quyền" value={withRole} color="purple" />
        <SummaryCard
          label="Chưa phân quyền"
          value={withoutRole}
          color="orange"
        />
        <SummaryCard
          label="Mới trong tuần"
          value={newUsersThisWeek}
          color="indigo"
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Users by Role */}
        {/* Thêm dark:bg-gray-800 */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
          {/* Thêm dark:text-white */}
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
            Người dùng theo quyền
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={rolePieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                // Thêm viền trắng hoặc tối cho các múi biểu đồ để dễ nhìn hơn
                stroke="currentColor"
                className="text-white dark:text-gray-800"
              >
                {rolePieData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={rolePieData} />
        </div>

        {/* Bar: Status */}
        {/* Thêm dark:bg-gray-800 */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
          {/* Thêm dark:text-white */}
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
            Trạng thái tài khoản
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              {/* Thêm class dark mode cho màu chữ trục X, Y */}
              <XAxis
                dataKey="name"
                stroke="#8884d8"
                className="dark:text-gray-400"
              />
              <YAxis stroke="#8884d8" className="dark:text-gray-400" />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(156, 163, 175, 0.2)" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Thêm dark:text-gray-400 */}
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Tỷ lệ hoạt động: {((active / total) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* TOP LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserList
          title="Người dùng cập nhật gần nhất"
          items={latestUpdated}
          type="updated"
        />
        <UserList
          title="Người dùng có phân quyền"
          items={importantUsers}
          type="role"
          showRole
        />
        <UserList
          title="Người dùng mới đăng ký"
          items={recentlyRegistered}
          type="created"
        />
      </div>
    </div>
  );
};

// Cải thiện SummaryCard với màu sắc hỗ trợ dark mode
const SummaryCard = ({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number;
  color?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    green:
      "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    red: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    purple:
      "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    orange:
      "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      {/* Thêm dark:text-gray-300 */}
      <p className="text-sm font-medium dark:text-gray-300">{label}</p>
      {/* Thêm dark:text-white */}
      <h3 className="text-xl font-bold mt-1 dark:text-white">{value}</h3>
    </div>
  );
};

// Cải thiện UserList với dark mode
const UserList = ({
  title,
  items,
  type = "updated",
  showRole = false,
}: {
  title: string;
  items: User[];
  type?: "updated" | "role" | "created";
  showRole?: boolean;
}) => (
  // Thêm dark:bg-gray-800
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
    {/* Thêm dark:text-white */}
    <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
      {title}
    </h3>
    <ul className="space-y-3">
      {items.map((u: User) => (
        // Thêm dark:border-gray-700
        <li
          key={u.id}
          className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div className="flex-shrink-0">
            <img
              src={u.avatar || `https://i.pravatar.cc/100?u=${u.id}`}
              // Thêm dark:border-gray-700
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              alt={u.full_name}
            />
          </div>
          <div className="flex-1 min-w-0">
            {/* Thêm dark:text-white */}
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {u.full_name}
            </p>
            {/* Thêm dark:text-gray-400 */}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {u.email}
            </p>
            {showRole && (
              // Thêm dark mode cho nhãn phân quyền
              <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                {u.role?.title ?? "Không có quyền"}
              </span>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                u.status === "active"
                  ? // Thêm dark mode cho nhãn trạng thái
                    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {u.status === "active" ? "Hoạt động" : "Không hoạt động"}
            </div>
            {/* Thêm dark:text-gray-400 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {type === "updated" &&
                new Date(u.updated_at).toLocaleDateString("vi-VN")}
              {type === "created" &&
                new Date(u.created_at).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default UsersOverview;
