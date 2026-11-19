import React from "react";

export type BadgeVariant =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "primary"
  | "secondary";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    "bg-surface-container-high text-on-surface-variant border-outline-variant",
  info: "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]",
  warning: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
  success:
    "bg-mint-subtle text-on-primary-fixed-variant border-primary-fixed-dim/60",
  danger:
    "bg-error-container text-on-error-container border-error/25",
  primary:
    "bg-primary-fixed/60 text-on-primary-fixed border-primary-fixed-dim",
  secondary:
    "bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-fixed-dim",
};

const dotClasses: Record<BadgeVariant, string> = {
  neutral: "bg-outline",
  info: "bg-[#0284c7]",
  warning: "bg-[#d97706]",
  success: "bg-primary",
  danger: "bg-error",
  primary: "bg-primary",
  secondary: "bg-secondary",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  children,
}) => {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-bold leading-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClasses[variant]}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
