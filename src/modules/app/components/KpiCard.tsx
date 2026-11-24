import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export interface KpiCardProps {
  label: string;
  value?: string | number;
  emptyHint?: string;
  icon: string;
  accentColor?: "primary" | "secondary" | "tertiary" | "neutral";
  badgeText?: string;
  badgeType?: "info" | "warning" | "success" | "neutral" | "danger";
  className?: string;
}

const iconBoxStyles: Record<
  NonNullable<KpiCardProps["accentColor"]>,
  string
> = {
  primary: "bg-mint-subtle text-primary border border-primary-fixed-dim/50",
  secondary:
    "bg-tangerine-subtle text-secondary border border-secondary-fixed-dim/60",
  tertiary:
    "bg-tertiary-fixed/50 text-tertiary border border-tertiary-fixed-dim/60",
  neutral:
    "bg-surface-container text-on-surface-variant border border-outline-variant/60",
};

const badgeMap: Record<
  NonNullable<KpiCardProps["badgeType"]>,
  BadgeVariant
> = {
  info: "info",
  warning: "warning",
  success: "success",
  neutral: "neutral",
  danger: "danger",
};

export function KpiCard({
  label,
  value,
  emptyHint,
  icon,
  accentColor = "primary",
  badgeText,
  badgeType = "neutral",
  className = "",
}: KpiCardProps) {
  const displayValue =
    value === undefined || value === null || value === "" ? "0" : value;

  return (
    <div
      className={`bg-surface-card rounded-2xl border border-outline-variant/60 p-5 shadow-level-1 transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBoxStyles[accentColor]}`}
        >
          <Icon name={icon} size={22} />
        </div>
        {badgeText && (
          <Badge variant={badgeMap[badgeType]} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-2xl font-extrabold tracking-tight text-on-surface tabular-nums">
          {displayValue}
        </p>
        {emptyHint && (
          <p className="text-xs text-on-surface-variant mt-1.5 leading-snug">
            {emptyHint}
          </p>
        )}
      </div>
    </div>
  );
}
