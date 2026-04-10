import React from "react";
import type { DashboardKpiItem } from "../types/dashboard";
import DashboardKpiCard from "./DashboardKpiCard";

type DashboardKpiGridItem = DashboardKpiItem & {
  icon?: React.ReactNode;
  onClick?: () => void;
};

type DashboardKpiGridProps = {
  items: DashboardKpiGridItem[];
  className?: string;
  columns?: 2 | 3 | 4;
};

const getGridClasses = (columns: 2 | 3 | 4) => {
  switch (columns) {
    case 2:
      return "grid-cols-1 md:grid-cols-2";
    case 3:
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
    default:
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
  }
};

export default function DashboardKpiGrid({
  items,
  className = "",
  columns = 4,
}: DashboardKpiGridProps) {
  if (!items.length) return null;

  return (
    <div
      className={`grid gap-4 ${getGridClasses(columns)} ${className}`.trim()}
    >
      {items.map((item) => {
        const { key, ...cardProps } = item;
        return <DashboardKpiCard key={key} {...cardProps} />;
      })}
    </div>
  );
}
