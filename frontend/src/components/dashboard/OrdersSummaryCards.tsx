import React from "react";

interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  pendingOrders: number;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  color,
}) => {
  // Thêm các class dark: cho từng màu để tương thích giao diện tối
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    green:
      "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    red: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    orange:
      "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          {/* Thêm dark:text-gray-400 cho tiêu đề */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          {/* Thêm text-gray-900 và dark:text-white để đảm bảo màu chữ chính chính xác */}
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        {/* Thêm nền tối mờ cho khung chứa Icon */}
        <div className="p-2 rounded-full bg-white bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-50">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function OrdersSummaryCards({
  summary,
}: {
  summary: OrdersSummary;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SummaryCard
        title="Tổng đơn hàng tháng"
        value={summary.totalOrders}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        }
        color="blue"
      />
      <SummaryCard
        title="Doanh thu tháng"
        value={`${summary.totalRevenue.toLocaleString()}₫`}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        color="green"
      />
      <SummaryCard
        title="Đơn pending"
        value={summary.pendingOrders}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        color="orange"
      />
    </div>
  );
}
