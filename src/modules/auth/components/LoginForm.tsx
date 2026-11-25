"use client";

import React, { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { loginAction } from "@/lib/auth-actions";
import { isSafeInternalRedirect } from "@/lib/auth-constants";
import { getDefaultRoleHomePath } from "@/lib/permissions";
import { storeKeys } from "@/modules/store/queries/keys";
import { loginRequestSchema, type LoginRequest } from "@/schemas/auth.schema";

export interface LoginFormProps {
  sessionExpired?: boolean;
  passwordChanged?: boolean;
  callbackUrl?: string;
}

const inputClass =
  "w-full min-h-[46px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

export function LoginForm({
  sessionExpired = false,
  passwordChanged = false,
  callbackUrl,
}: LoginFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const baseId = useId();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: LoginRequest) => {
    if (retryCountdown > 0) return;
    setGlobalError(null);

    const result = await loginAction(data);

    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: storeKeys.me });
      let target = "/dashboard";
      if (isSafeInternalRedirect(callbackUrl) && callbackUrl !== "/") {
        target = callbackUrl;
      } else if (
        result.user.systemRole === "SUPERADMIN" &&
        result.staffMemberships.length === 0
      ) {
        target = "/superadmin";
      } else if (
        result.user.systemRole === "USER" &&
        result.staffMemberships.length === 0
      ) {
        target = "/onboarding";
      } else if (result.staffMemberships.length === 1) {
        target = getDefaultRoleHomePath(
          result.staffMemberships[0].staffRole,
          result.user.systemRole
        );
      }

      router.push(target);
      router.refresh();
      return;
    }

    if (result.status === 429) {
      const waitSeconds = result.retryAfter ?? 60;
      setRetryCountdown(waitSeconds);
      setGlobalError(result.error);
      return;
    }

    setGlobalError(
      result.error || "No pudimos validar tus credenciales. Intenta nuevamente."
    );
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-outline-variant/70 shadow-level-2 p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <Image
          src="/images/nexofood-logo.png"
          alt="Logo de NexoFood"
          width={52}
          height={52}
          className="mx-auto w-13 h-13 rounded-2xl shadow-level-1 object-contain"
        />
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
          Inicia sesión en NexoFood
        </h1>
        <p className="text-sm text-on-surface-variant">
          Gestiona tu restaurante, cocina KDS, entregas y pagos en un solo lugar.
        </p>
      </div>

      {sessionExpired && (
        <Alert variant="warning">
          Tu sesión expiró por seguridad. Inicia sesión nuevamente para
          continuar.
        </Alert>
      )}

      {passwordChanged && (
        <Alert variant="success">
          Tu contraseña se actualizó correctamente. Ingresa con tu nueva
          contraseña.
        </Alert>
      )}

      {retryCountdown > 0 ? (
        <Alert variant="danger" title="Demasiados intentos">
          Por seguridad, espera{" "}
          <strong className="tabular-nums">{retryCountdown} s</strong> antes de
          volver a intentarlo.
        </Alert>
      ) : (
        globalError && <Alert variant="danger">{globalError}</Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label
            htmlFor={`${baseId}-email`}
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Correo electrónico <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${baseId}-email`}
            type="email"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            required
            placeholder="tu@restaurante.pe"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${baseId}-email-err` : undefined}
            {...register("email")}
            className={inputClass}
          />
          {errors.email && (
            <p
              id={`${baseId}-email-err`}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
            >
              <Icon name="error" size={14} />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${baseId}-password`}
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Contraseña <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              id={`${baseId}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              enterKeyHint="done"
              required
              placeholder="Ingresa tu contraseña"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? `${baseId}-password-err` : undefined
              }
              {...register("password")}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              aria-pressed={showPassword}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            >
              <Icon
                name={showPassword ? "visibility_off" : "visibility"}
                size={20}
              />
            </button>
          </div>
          {errors.password && (
            <p
              id={`${baseId}-password-err`}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
            >
              <Icon name="error" size={14} />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={retryCountdown > 0}
          icon="login"
          className="mt-1"
        >
          {retryCountdown > 0
            ? `Espera ${retryCountdown} s`
            : isSubmitting
              ? "Ingresando..."
              : "Iniciar sesión"}
        </Button>
      </form>

      <div className="pt-2 border-t border-outline-variant/50 text-center text-sm">
        <p className="text-on-surface-variant">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline"
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
