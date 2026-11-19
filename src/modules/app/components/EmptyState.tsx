import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = "",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-outline-variant bg-surface-card transition-all ${
        compact ? "p-6" : "p-10 md:p-12"
      } ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mb-4 text-primary">
        <Icon name={icon} size={28} />
      </div>
      <h2 className="text-base font-bold text-on-surface mb-1">{title}</h2>
      <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
        {description}
      </p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary-container text-on-secondary shadow-xs hover:bg-secondary-accent transition-all"
        >
          <span>{actionText}</span>
          <Icon name="arrow_forward" size={18} />
        </Link>
      )}
      {actionText && !actionHref && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all shadow-xs cursor-pointer"
        >
          <Icon name="add" size={18} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
