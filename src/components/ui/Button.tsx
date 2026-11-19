import React from "react";
import { Icon } from "./Icon";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "dark"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-secondary-container text-on-secondary shadow-[0_2px_4px_rgba(254,106,52,0.2)] hover:bg-secondary-accent hover:shadow-cta hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-primary text-on-primary shadow-[0_2px_4px_rgba(0,108,73,0.2)] hover:bg-on-primary-fixed-variant hover:shadow-[0_4px_12px_rgba(0,108,73,0.28)] hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "bg-transparent text-on-surface border border-outline-variant hover:bg-surface-container-low hover:border-outline hover:text-primary",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-primary",
  dark: "bg-inverse-surface text-inverse-on-surface border border-outline/40 hover:bg-inverse-surface-dark",
  danger:
    "bg-error text-on-error shadow-[0_2px_4px_rgba(186,26,26,0.2)] hover:bg-on-error-container hover:-translate-y-0.5 active:translate-y-0",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-2 px-3.5 text-xs rounded-lg min-h-[36px]",
  md: "py-2.5 px-5 text-sm rounded-xl min-h-[42px]",
  lg: "py-3.5 px-6 text-base font-bold rounded-2xl min-h-[48px]",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = "right",
  href,
  target,
  rel,
  type = "button",
  disabled,
  className = "",
  children,
  ...rest
}) => {
  const combinedClassName = [
    "inline-flex items-center justify-center gap-2 font-semibold border border-transparent no-underline cursor-pointer whitespace-nowrap transition-all duration-200 leading-none relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 18;
  const iconElement = isLoading ? (
    <span
      className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
      aria-hidden="true"
    />
  ) : icon ? (
    <Icon name={icon} size={iconSize} />
  ) : null;

  const content = (
    <>
      {(isLoading || (icon && iconPosition === "left")) && iconElement}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === "right" && iconElement}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : rel}
        className={combinedClassName}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={combinedClassName}
      {...rest}
    >
      {content}
    </button>
  );
};
