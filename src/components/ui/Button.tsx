import React from "react";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
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
    "bg-primary-container text-on-secondary shadow-[0_2px_4px_rgba(16,185,129,0.2)] hover:bg-[#059669] hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "bg-transparent text-on-surface border border-outline-variant hover:bg-surface-container-low hover:border-outline hover:text-primary",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-primary",
  dark:
    "bg-white/12 text-inverse-on-surface border border-white/20 backdrop-blur-md hover:bg-white/20 hover:border-white/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-2 px-3.5 text-xs rounded-lg",
  md: "py-3 px-5 text-sm rounded-xl",
  lg: "py-4 px-7 text-base font-bold rounded-2xl",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  iconPosition = "right",
  href,
  target,
  rel,
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

  const iconElement = icon ? (
    <Icon
      name={icon}
      size={size === "sm" ? 16 : size === "lg" ? 22 : 18}
    />
  ) : null;

  const content = (
    <>
      {icon && iconPosition === "left" && iconElement}
      <span>{children}</span>
      {icon && iconPosition === "right" && iconElement}
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
    <button className={combinedClassName} {...rest}>
      {content}
    </button>
  );
};

export { LogoutButton } from "./LogoutButton";
