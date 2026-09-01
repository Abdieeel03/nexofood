import React from "react";
import styles from "./Button.module.css";
import { Icon } from "../Icon";

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
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth ? styles.fullWidth : "",
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
