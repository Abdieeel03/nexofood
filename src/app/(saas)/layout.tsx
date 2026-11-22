import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiServer, ApiError } from "@/lib/api-server";
import { getAccessToken, getRefreshToken } from "@/lib/auth-cookies";
import {
  userProfileResponseSchema,
  type UserProfileResponse,
} from "@/schemas/auth.schema";
import {
  tenantResponseSchema,
  type TenantResponse,
} from "@/schemas/tenant.schema";
import { SessionTenantProvider } from "@/modules/app/components/SessionTenantProvider";
import { AppShell } from "@/modules/app/components/AppShell";
import { Alert } from "@/components/ui/Alert";

export const dynamic = "force-dynamic";

export default async function SaaSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [accessToken, refreshToken] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
  ]);

  if (!accessToken) {
    if (refreshToken) {
      redirect("/api/auth/refresh?next=/dashboard");
    }
    redirect("/");
  }

  let initialUser: UserProfileResponse | null = null;
  let initialTenant: TenantResponse | null = null;
  let redirectTarget: string | null = null;
  let fatalError: string | null = null;

  try {
    initialUser = await apiServer.get<UserProfileResponse>("/auth/me", {
      schema: userProfileResponseSchema,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirectTarget = refreshToken
        ? "/api/auth/refresh?next=/dashboard"
        : "/?session_expired=true";
    } else {
      fatalError =
        error instanceof Error
          ? error.message
          : "No se pudo verificar tu sesión en el servidor de NexoFood.";
    }
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  if (fatalError || !initialUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-card p-6 shadow-level-2 space-y-4">
          <Alert variant="danger" title="Error de conexión con NexoFood">
            {fatalError ??
              "No fue posible cargar tu perfil de usuario en este momento."}
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-on-primary-fixed-variant"
            >
              Reintentar
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    initialTenant = await apiServer.get<TenantResponse>("/tenants/me", {
      schema: tenantResponseSchema,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      initialTenant = null;
    } else if (error instanceof ApiError && error.status === 401) {
      redirectTarget = refreshToken
        ? "/api/auth/refresh?next=/dashboard"
        : "/?session_expired=true";
    } else {
      initialTenant = null;
    }
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <SessionTenantProvider
      initialUser={initialUser}
      initialTenant={initialTenant}
    >
      <AppShell>{children}</AppShell>
    </SessionTenantProvider>
  );
}
