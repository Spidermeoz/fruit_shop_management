import React from "react";
import {
  ArrowRight,
  Boxes,
  Building2,
  Megaphone,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import type { DashboardQuickLink } from "../types/dashboard";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type DashboardQuickLinksGridProps = {
  links: DashboardQuickLink[];
  className?: string;
};

const iconMap: Record<DashboardQuickLink["module"], React.ReactNode> = {
  orders: <ShoppingCart className="h-5 w-5" />,
  inventory: <Boxes className="h-5 w-5" />,
  users: <ShieldCheck className="h-5 w-5" />,
  branches: <Building2 className="h-5 w-5" />,
  shipping: <Truck className="h-5 w-5" />,
  promotions: <Megaphone className="h-5 w-5" />,
  reviews: <Star className="h-5 w-5" />,
  content: <PackageCheck className="h-5 w-5" />,
};

const toneMap: Record<DashboardQuickLink["module"], string> = {
  orders:
    "from-sky-500/10 to-sky-100/60 text-sky-700 dark:from-sky-500/10 dark:to-sky-900/10 dark:text-sky-300",
  inventory:
    "from-amber-500/10 to-amber-100/60 text-amber-700 dark:from-amber-500/10 dark:to-amber-900/10 dark:text-amber-300",
  users:
    "from-emerald-500/10 to-emerald-100/60 text-emerald-700 dark:from-emerald-500/10 dark:to-emerald-900/10 dark:text-emerald-300",
  branches:
    "from-violet-500/10 to-violet-100/60 text-violet-700 dark:from-violet-500/10 dark:to-violet-900/10 dark:text-violet-300",
  shipping:
    "from-cyan-500/10 to-cyan-100/60 text-cyan-700 dark:from-cyan-500/10 dark:to-cyan-900/10 dark:text-cyan-300",
  promotions:
    "from-fuchsia-500/10 to-fuchsia-100/60 text-fuchsia-700 dark:from-fuchsia-500/10 dark:to-fuchsia-900/10 dark:text-fuchsia-300",
  reviews:
    "from-rose-500/10 to-rose-100/60 text-rose-700 dark:from-rose-500/10 dark:to-rose-900/10 dark:text-rose-300",
  content:
    "from-slate-500/10 to-slate-100/60 text-slate-700 dark:from-slate-500/10 dark:to-slate-900/10 dark:text-slate-300",
};

export default function DashboardQuickLinksGrid({
  links,
  className = "",
}: DashboardQuickLinksGridProps) {
  if (!links.length) {
    return (
      <DashboardEmptyState
        compact
        title="Chưa có lối tắt"
        description="Hiện chưa có workspace phù hợp để hiển thị trong phạm vi này."
        className={className}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 ${className}`.trim()}
    >
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          className="group block rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
        >
          <div
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${toneMap[link.module]}`}
          >
            {iconMap[link.module]}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {link.label}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Mở nhanh workspace liên quan để xử lý sâu hơn.
            </p>
          </div>

          <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
            Truy cập
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </a>
      ))}
    </div>
  );
}
