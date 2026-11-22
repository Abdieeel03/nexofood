"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/auth-actions";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

export interface LogoutButtonProps {
  redirectTo?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  label?: string;
}

export const LogoutButton = ({
  redirectTo = "/",
  variant = "outline",
  size = "md",
  className = "",
  label = "Cerrar sesión",
}: LogoutButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction(redirectTo);
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      icon="logout"
      iconPosition="left"
      onClick={handleLogout}
      isLoading={isPending}
      className={`text-error border-error/30 hover:bg-error-container/40 hover:text-on-error-container hover:border-error/50 ${className}`}
    >
      {isPending ? "Cerrando sesión..." : label}
    </Button>
  );
};
