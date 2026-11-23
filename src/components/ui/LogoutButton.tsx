"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch {
        // Redirigir de todas formas aunque falle la petición
      }
      queryClient.clear();
      router.replace(redirectTo);
      router.refresh();
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
