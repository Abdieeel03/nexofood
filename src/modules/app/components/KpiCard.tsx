import React from "react";

interface KpiCardProps {
  label: string;
  value?: string | number;
  emptyHint?: string;
  icon: string;
  accentColor?: "primary" | "secondary" | "tertiary" | "neutral";
  badgeText?: string;
  badgeType?: "info" | "warning" | "success" | "neutral";
}

export function KpiCard({
  label,
  value,
  emptyHint = "Sin datos registrados",
  icon,
  accentColor = "primary",
  badgeText,
  badgeType = "neutral",
}: KpiCardProps) {
  const isZeroOrEmpty = value === undefined || value === null || value === "" || value === 0 || value === "0" || value === "$0.00" || value === "—";

  const colorStyles = {
    primary: {
      iconBg: "bg-primary/10 text-primary",
      activeText: "text-primary",
    },
    secondary: {
      iconBg: "bg-secondary-accent/10 text-secondary-accent",
      activeText: "text-secondary-accent",
    },
    tertiary: {
      iconBg: "bg-tertiary/10 text-tertiary",
      activeText: "text-tertiary",
    },
    neutral: {
      iconBg: "bg-surface-container text-outline",
      activeText: "text-on-surface",
    },
  }[accentColor];

  const badgeStyles = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-surface-container text-outline border-outline-variant/40",
  }[badgeType];

  return (
    <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorStyles.iconBg}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {badgeText && (
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-on-surface">
            {isZeroOrEmpty && (value === undefined || value === null || value === "") ? "0" : value}
          </p>
        </div>
        <p className="text-xs text-outline/80 mt-1.5 line-clamp-1">{emptyHint}</p>
      </div>
    </div>
  );
}
