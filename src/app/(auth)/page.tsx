import React from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Inicia sesión en NexoFood para administrar tu restaurante o gestionar tus pedidos.",
};

interface LoginPageProps {
  searchParams: Promise<{
    session_expired?: string;
    password_changed?: string;
    callbackUrl?: string;
  }>;
}

export default async function HomeLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      sessionExpired={params.session_expired === "true"}
      passwordChanged={params.password_changed === "true"}
      callbackUrl={
        typeof params.callbackUrl === "string" ? params.callbackUrl : undefined
      }
    />
  );
}
