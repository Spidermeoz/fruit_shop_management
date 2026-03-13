import { useEffect, useState } from "react";
import { getAllProducts } from "../../services/api/dashboardProductService";
import type { Product } from "../../types/products";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
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

export default function ProductsOverview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Không có sản phẩm nào
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bắt đầu bằng cách thêm sản phẩm mới.
          </p>
        </div>
      </div>
    );
  }

  // SUMMARY
  const total = products.length;
  const active = products.filter((p) => p.status === "active").length;
  const inactive = products.filter((p) => p.status === "inactive").length;
  const featured = products.filter((p) => p.featured).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

  // Tính giá trung bình
  const avgPrice =
    products.reduce((sum, p) => sum + p.price, 0) / products.length;

  // PIE (category distribution)
  const categoryMap: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category?.title ?? "Khác";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Sắp xếp dữ liệu theo giá trị giảm dần để dễ xem
  pieData.sort((a, b) => b.value - a.value);

  // BAR (status distribution)
  const statusData = [
    { name: "Hoạt động", value: active },
    { name: "Không hoạt động", value: inactive },
  ];

  // TOP DISCOUNT
  const topDiscount = [...products]
    .sort((a, b) => b.discount_percentage - a.discount_percentage)
    .slice(0, 5);

  // TOP UPDATED
  const topUpdated = [...products]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 5);

  // TOP SELLING
  const topPrice = [...products].sort((a, b) => b.price - a.price).slice(0, 5);

  // Custom tooltip cho PieChart (Thêm nền tối và chữ trắng/xám cho dark mode)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 shadow rounded border dark:border-gray-700">
          <p className="font-semibold dark:text-gray-100">{`${payload[0].name}`}</p>
          <p className="text-blue-600 dark:text-blue-400">{`Số lượng: ${payload[0].value}`}</p>
          <p className="text-gray-500 dark:text-gray-400">{`Tỷ lệ: ${((payload[0].value / total) * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* Thêm dark:text-white */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Tổng quan sản phẩm
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <SummaryCard label="Tổng sản phẩm" value={total} color="blue" />
        <SummaryCard label="Hoạt động" value={active} color="green" />
        <SummaryCard label="Không hoạt động" value={inactive} color="red" />
        <SummaryCard label="Nổi bật" value={featured} color="purple" />
        <SummaryCard label="Hết hàng" value={outOfStock} color="orange" />
        <SummaryCard label="Sắp hết hàng" value={lowStock} color="yellow" />
        <SummaryCard
          label="Giá trung bình"
          value={`${avgPrice.toLocaleString("vi-VN")}đ`}
          color="indigo"
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIE */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
            Phân bố theo danh mục
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
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
                {pieData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={pieData} />
        </div>

        {/* BAR */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
            Phân bố theo trạng thái
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              {/* Thêm màu chữ cho trục X, Y nếu cần */}
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
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Tỷ lệ hoạt động: {((active / total) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* TOP LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopList
          title="Top 5 giảm giá cao nhất"
          items={topDiscount}
          type="discount"
        />
        <TopList
          title="Top 5 cập nhật gần nhất"
          items={topUpdated}
          type="updated"
        />
        <TopList title="Top 5 giá cao nhất" items={topPrice} type="price" />
      </div>
    </div>
  );
}

// Cải thiện SummaryCard với màu sắc hỗ trợ dark mode
const SummaryCard = ({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: string | number;
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
    yellow:
      "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
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

// Cải thiện TopList với dark mode
const TopList = ({
  title,
  items,
  type = "discount",
}: {
  title: string;
  items: Product[];
  type?: "discount" | "updated" | "price";
}) => (
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
    <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
      {title}
    </h3>
    <ul className="space-y-3">
      {items.map((p: Product, index) => (
        <li
          key={p.id}
          className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {p.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {p.category?.title || "Không có danh mục"}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            {type === "discount" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                {p.discount_percentage ? `${p.discount_percentage}%` : "0%"}
              </span>
            )}
            {type === "updated" && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(p.updated_at).toLocaleDateString("vi-VN")}
              </span>
            )}
            {type === "price" && (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {p.price.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
