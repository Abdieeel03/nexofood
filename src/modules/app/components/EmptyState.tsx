import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = "info",
  title,
  description,
  actionText,
  onAction,
  className = "",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-lowest/70 backdrop-blur-xs transition-all ${
        compact ? "p-6" : "p-10 md:p-12"
      } ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mb-4 text-outline shadow-inner">
        <span className="material-symbols-outlined text-3xl opacity-75">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-outline max-w-md leading-relaxed">{description}</p>
      {actionText && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-xs active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          {actionText}
        </button>
      )}
    </div>
  );
}
