// src/pages/DashboardPage.jsx
import React from "react";
import Card from "../../components/layouts/Card";
import RevenueChart from "../../components/charts/LineChart";
import SalesByCategoryChart from "../../components/charts/BarChart";
import TrafficSourcesChart from "../../components/charts/PieChart";
import RecentTransactions from "../../components/layouts/RecentTransactions";
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react";

const statCards = [
  {
    title: "Total Revenue",
    value: "$54,239",
    icon: DollarSign,
    change: "+12.5%",
    changeType: "positive",
  },
  {
    title: "Total Users",
    value: "8,549",
    icon: Users,
    change: "+2.1%",
    changeType: "positive",
  },
  {
    title: "Total Sales",
    value: "1,423",
    icon: ShoppingCart,
    change: "-5.4%",
    changeType: "negative",
  },
  {
    title: "Growth Rate",
    value: "23.5%",
    icon: TrendingUp,
    change: "+8.2%",
    changeType: "positive",
  },
];

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <p
                    className={`text-sm mt-2 ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change} from last month
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Revenue Over Time
          </h2>
          <RevenueChart />
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Sales by Category
          </h2>
          <SalesByCategoryChart />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Recent Transactions
          </h2>
          <RecentTransactions />
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Traffic Sources
          </h2>
          <TrafficSourcesChart />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
