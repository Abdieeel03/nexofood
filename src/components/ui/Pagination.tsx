"use client";

import React from "react";
import { Icon } from "./Icon";

export interface PaginationProps {
  /** Página actual (0-indexed) */
  page: number;
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  first?: boolean;
  last?: boolean;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

function buildPageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: Array<number | "ellipsis"> = [0];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  if (start > 1) pages.push("ellipsis");
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  if (end < total - 2) pages.push("ellipsis");
  pages.push(total - 1);

  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalElements,
  pageSize = 20,
  first,
  last,
  isLoading = false,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1 && (totalElements === undefined || totalElements === 0)) {
    return null;
  }

  const isFirst = first ?? page <= 0;
  const isLast = last ?? page >= totalPages - 1;
  const pageItems = buildPageNumbers(page, Math.max(1, totalPages));

  const startItem =
    totalElements && totalElements > 0 ? page * pageSize + 1 : 0;
  const endItem =
    totalElements !== undefined
      ? Math.min((page + 1) * pageSize, totalElements)
      : 0;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 pt-2 ${className}`}
    >
      {totalElements !== undefined ? (
        <p className="text-xs font-medium text-on-surface-variant tabular-nums">
          {totalElements === 0
            ? "Sin resultados"
            : `Mostrando ${startItem}–${endItem} de ${totalElements}`}
        </p>
      ) : (
        <span />
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Paginación"
          className="inline-flex items-center gap-1"
        >
          <button
            type="button"
            disabled={isFirst || isLoading}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
            className="inline-flex items-center justify-center h-9 px-2.5 rounded-lg border border-outline-variant bg-surface-card text-xs font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-45 disabled:pointer-events-none cursor-pointer transition-colors"
          >
            <Icon name="chevron_left" size={18} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-xs text-outline select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Página ${item + 1}`}
                className={`inline-flex items-center justify-center h-9 min-w-[36px] px-2.5 rounded-lg border text-xs font-bold tabular-nums transition-colors cursor-pointer disabled:pointer-events-none ${
                  item === page
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-card text-on-surface border-outline-variant hover:bg-surface-container-low"
                }`}
              >
                {item + 1}
              </button>
            )
          )}

          <button
            type="button"
            disabled={isLast || isLoading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
            className="inline-flex items-center justify-center h-9 px-2.5 rounded-lg border border-outline-variant bg-surface-card text-xs font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-45 disabled:pointer-events-none cursor-pointer transition-colors"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <Icon name="chevron_right" size={18} />
          </button>
        </nav>
      )}
    </div>
  );
};
