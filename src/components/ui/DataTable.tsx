import React, { useId } from "react";
import { Icon } from "./Icon";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  /** Etiqueta textual usada para `data-label` en tarjetas móviles (`@container < 600px`) */
  headerLabel?: string;
  align?: "left" | "center" | "right";
  isRowHeader?: boolean;
  className?: string;
  headerClassName?: string;
  render: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  caption: string;
  hideCaption?: boolean;
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  emptyState?: React.ReactNode;
  className?: string;
}

const alignClasses: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function DataTable<T>({
  caption,
  hideCaption = true,
  columns,
  data,
  keyExtractor,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = "No hay registros disponibles",
  emptyDescription = "Cuando existan datos aparecerán listados aquí.",
  emptyIcon = "inbox",
  emptyState,
  className = "",
}: DataTableProps<T>) {
  const captionId = useId();
  const explicitRowHeaderIdx = columns.findIndex((c) => c.isRowHeader);
  const rowHeaderIdx = explicitRowHeaderIdx >= 0 ? explicitRowHeaderIdx : 0;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      aria-busy={isLoading || undefined}
      className={`table-wrapper rounded-2xl border border-outline-variant/70 bg-surface-card shadow-level-1 ${className}`}
    >
      <table className="text-sm text-on-surface">
        <caption
          id={captionId}
          className={
            hideCaption
              ? "sr-only"
              : "px-5 py-3 text-left text-sm font-bold text-on-surface bg-surface-container-low/70 border-b border-outline-variant/50"
          }
        >
          {caption}
        </caption>

        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant/60">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/60 whitespace-nowrap ${
                  alignClasses[col.align ?? "left"]
                } ${col.headerClassName ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-outline-variant/40">
          {isLoading ? (
            Array.from({ length: skeletonRows }, (_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`} className="animate-pulse">
                {columns.map((col, colIdx) =>
                  colIdx === rowHeaderIdx ? (
                    <th
                      key={col.key}
                      scope="row"
                      className="px-4 py-3.5 text-left font-semibold"
                    >
                      <div className="h-4 w-28 rounded bg-surface-container-high" />
                    </th>
                  ) : (
                    <td
                      key={col.key}
                      data-label={
                        col.headerLabel ??
                        (typeof col.header === "string" ? col.header : "")
                      }
                      className="px-4 py-3.5"
                    >
                      <div className="h-4 w-20 rounded bg-surface-container-high" />
                    </td>
                  )
                )}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} data-label="" className="p-8">
                {emptyState ?? (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="h-12 w-12 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
                      <Icon name={emptyIcon} size={26} />
                    </div>
                    <p className="text-sm font-bold text-on-surface">
                      {emptyTitle}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
                      {emptyDescription}
                    </p>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row, rowIdx)}
                className="hover:bg-surface-container-low/50 transition-colors"
              >
                {columns.map((col, colIdx) => {
                  const alignment = alignClasses[col.align ?? "left"];
                  const cellContent = col.render(row, rowIdx);

                  if (colIdx === rowHeaderIdx) {
                    return (
                      <th
                        key={col.key}
                        scope="row"
                        className={`px-4 py-3.5 font-semibold text-on-surface align-middle ${alignment} ${
                          col.className ?? ""
                        }`}
                      >
                        {cellContent}
                      </th>
                    );
                  }

                  const dataLabel =
                    col.headerLabel ??
                    (typeof col.header === "string" ? col.header : "");

                  return (
                    <td
                      key={col.key}
                      data-label={dataLabel}
                      className={`px-4 py-3.5 text-on-surface-variant align-middle ${alignment} ${
                        col.className ?? ""
                      }`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
