import React from "react";
import { Icon } from "./Icon";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  icon?: string;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { container: string; iconName: string; iconColor: string }
> = {
  info: {
    container: "bg-[#f0f9ff] border-[#bae6fd] text-[#0c4a6e]",
    iconName: "info",
    iconColor: "text-[#0284c7]",
  },
  success: {
    container:
      "bg-mint-subtle border-primary-fixed-dim text-on-primary-fixed",
    iconName: "check_circle",
    iconColor: "text-primary",
  },
  warning: {
    container: "bg-[#fffbeb] border-[#fde68a] text-[#78350f]",
    iconName: "warning",
    iconColor: "text-[#d97706]",
  },
  danger: {
    container: "bg-error-container/70 border-error/30 text-on-error-container",
    iconName: "error",
    iconColor: "text-error",
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  icon,
  onDismiss,
  action,
  className = "",
  children,
}) => {
  const cfg = variantConfig[variant];
  const role =
    variant === "warning" || variant === "danger" ? "alert" : "status";

  return (
    <div
      role={role}
      className={[
        "flex items-start gap-3 rounded-xl border p-4 text-sm",
        cfg.container,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon
        name={icon || cfg.iconName}
        size={20}
        className={`shrink-0 mt-0.5 ${cfg.iconColor}`}
      />
      <div className="flex-1 min-w-0">
        {title && <p className="font-bold leading-snug mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded-lg p-1 opacity-75 hover:opacity-100 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
};
