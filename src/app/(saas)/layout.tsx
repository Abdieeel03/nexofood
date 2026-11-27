import React from "react";
import { redirect } from "next/navigation";
import { apiServer, ApiError } from "@/lib/api-server";
import { getAccessToken, getRefreshToken } from "@/lib/auth-cookies";
import { extractErrorStatus } from "@/lib/error-messages";
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
import { ErrorStateView } from "@/components/ui/ErrorStateView";

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
  let fatalStatus: number | null = null;

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
      fatalStatus = extractErrorStatus(error) ?? 500;
    }
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  if (fatalStatus !== null || !initialUser) {
    return (
      <ErrorStateView
        status={fatalStatus ?? 500}
        context="saas"
        homeHref="/"
        homeLabel="Volver al inicio de sesión"
        fullPage
        showBrandHeader
      />
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
