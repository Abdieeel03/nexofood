import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { apiServer, ApiError } from "@/lib/api-server";
import { getAccessToken, getRefreshToken } from "@/lib/auth-cookies";
import {
  SuperadminProvider,
  SuperadminShell,
} from "@/modules/superadmin";
import {
  userProfileResponseSchema,
  type UserProfileResponse,
} from "@/schemas/auth.schema";

export const dynamic = "force-dynamic";

export default async function SuperadminLayout({
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
      redirect("/api/auth/refresh?next=/superadmin");
    }
    redirect("/");
  }

  let initialUser: UserProfileResponse | null = null;
  let redirectTarget: string | null = null;
  let fatalError: string | null = null;

  try {
    initialUser = await apiServer.get<UserProfileResponse>("/auth/me", {
      schema: userProfileResponseSchema,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirectTarget = refreshToken
        ? "/api/auth/refresh?next=/superadmin"
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
              "No fue posible cargar tu perfil de administrador en este momento."}
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/superadmin"
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

  if (initialUser.systemRole !== "SUPERADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-card p-6 shadow-level-2 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <Icon name="gpp_maybe" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-on-surface">
                Acceso restringido
              </h1>
              <p className="text-xs text-on-surface-variant">
                Consola exclusiva para administradores globales (SUPERADMIN)
              </p>
            </div>
          </div>

          <Alert variant="danger" title="Permisos insuficientes (403)">
            Tu cuenta ({initialUser.email}) tiene el rol{" "}
            <strong>{initialUser.systemRole}</strong> y no cuenta con
            privilegios de Superadministrador de plataforma.
          </Alert>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-on-primary-fixed-variant"
            >
              <Icon name="dashboard" size={18} />
              <span>Ir al Backoffice</span>
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <Icon name="storefront" size={18} />
              <span>Ir al Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SuperadminProvider initialUser={initialUser}>
      <SuperadminShell>{children}</SuperadminShell>
    </SuperadminProvider>
  );
}
