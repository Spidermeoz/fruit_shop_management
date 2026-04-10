import type {
  DashboardAlertSeverity,
  DashboardStatTone,
} from "../types/dashboard";

const LOCALE = "vi-VN";
const CURRENCY = "VND";

export const formatNumber = (value: number | null | undefined): string => {
  const safe = Number(value ?? 0);
  return new Intl.NumberFormat(LOCALE).format(Number.isFinite(safe) ? safe : 0);
};

export const formatCurrency = (value: number | null | undefined): string => {
  const safe = Number(value ?? 0);
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safe) ? safe : 0);
};

export const formatPercent = (
  value: number | null | undefined,
  digits = 0,
): string => {
  const safe = Number(value ?? 0);
  return `${safe.toFixed(digits)}%`;
};

export const formatCompactNumber = (
  value: number | null | undefined,
): string => {
  const safe = Number(value ?? 0);
  return new Intl.NumberFormat(LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(safe) ? safe : 0);
};

export const formatDateTime = (
  value: string | Date | null | undefined,
): string => {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
  }).format(date);
};

export const pluralizeVi = (
  count: number,
  singular: string,
  plural?: string,
): string => {
  if (count === 1) return singular;
  return plural ?? singular;
};

export const getSeverityClasses = (
  severity: DashboardAlertSeverity,
): {
  container: string;
  dot: string;
  text: string;
  badge: string;
} => {
  switch (severity) {
    case "critical":
      return {
        container:
          "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
        dot: "bg-red-500",
        text: "text-red-700 dark:text-red-300",
        badge:
          "border-red-200 bg-white text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",
      };

    case "warning":
      return {
        container:
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
        dot: "bg-amber-500",
        text: "text-amber-700 dark:text-amber-300",
        badge:
          "border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      };

    default:
      return {
        container:
          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100",
        dot: "bg-sky-500",
        text: "text-sky-700 dark:text-sky-300",
        badge:
          "border-sky-200 bg-white text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
      };
  }
};

export const getToneClasses = (
  tone: DashboardStatTone = "default",
): {
  ring: string;
  iconBg: string;
  value: string;
  accent: string;
} => {
  switch (tone) {
    case "blue":
      return {
        ring: "ring-sky-100 dark:ring-sky-900/40",
        iconBg: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
        value: "text-sky-700 dark:text-sky-300",
        accent: "bg-sky-500",
      };

    case "emerald":
      return {
        ring: "ring-emerald-100 dark:ring-emerald-900/40",
        iconBg:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        value: "text-emerald-700 dark:text-emerald-300",
        accent: "bg-emerald-500",
      };

    case "amber":
      return {
        ring: "ring-amber-100 dark:ring-amber-900/40",
        iconBg:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        value: "text-amber-700 dark:text-amber-300",
        accent: "bg-amber-500",
      };

    case "red":
      return {
        ring: "ring-red-100 dark:ring-red-900/40",
        iconBg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        value: "text-red-700 dark:text-red-300",
        accent: "bg-red-500",
      };

    case "violet":
      return {
        ring: "ring-violet-100 dark:ring-violet-900/40",
        iconBg:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        value: "text-violet-700 dark:text-violet-300",
        accent: "bg-violet-500",
      };

    default:
      return {
        ring: "ring-slate-100 dark:ring-slate-800/60",
        iconBg:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        value: "text-slate-900 dark:text-slate-100",
        accent: "bg-slate-500",
      };
  }
};

export const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export const calcPercent = (
  value: number,
  total: number,
  digits = 0,
): string => {
  if (!Number.isFinite(total) || total <= 0)
    return `0${digits > 0 ? `.0`.repeat(0) : ""}%`;
  const percent = (value / total) * 100;
  return `${clampPercent(percent).toFixed(digits)}%`;
};
