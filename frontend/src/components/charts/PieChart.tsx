import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface TrafficSource {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // 👈 fix lỗi type Recharts
}

const data: TrafficSource[] = [
  { name: "Direct", value: 400, color: "#3b82f6" },
  { name: "Social", value: 300, color: "#10b981" },
  { name: "Referral", value: 300, color: "#f59e0b" },
  { name: "Organic", value: 200, color: "#ef4444" },
];

const TrafficSourcesChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props: any) =>
            `${props.name} ${(props.percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#333",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TrafficSourcesChart;
