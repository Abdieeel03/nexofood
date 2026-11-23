"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";

export type SortDirection = "ascending" | "descending";

export interface SuperadminSortableThProps {
  label: string;
  isActive: boolean;
  direction?: SortDirection;
  onSort: () => void;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SuperadminSortableTh({
  label,
  isActive,
  direction,
  onSort,
  align = "left",
  className = "",
}: SuperadminSortableThProps) {
  const justifyClass =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  const sortIcon = !isActive
    ? "unfold_more"
    : direction === "ascending"
      ? "arrow_upward"
      : "arrow_downward";

  return (
    <th
      scope="col"
      {...(isActive && direction ? { "aria-sort": direction } : {})}
      className={`border-b border-outline-variant/60 whitespace-nowrap p-0 ${className}`}
    >
      <button
        type="button"
        onClick={onSort}
        className={`w-full min-h-[38px] px-4 py-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${justifyClass} ${
          isActive
            ? "text-primary bg-mint-subtle/35"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
        }`}
      >
        <span>{label}</span>
        <Icon
          name={sortIcon}
          size={15}
          className={isActive ? "text-primary" : "text-outline"}
        />
      </button>
    </th>
  );
}
