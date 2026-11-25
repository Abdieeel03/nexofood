"use client";

import React, { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { LegalConsentNotice } from "@/components/legal/LegalLinks";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { registerAction } from "@/lib/auth-actions";
import { storeKeys } from "@/modules/store/queries/keys";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/schemas/auth.schema";

const inputClass =
  "w-full min-h-[46px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const baseId = useId();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: RegisterFormValues) => {
    if (retryCountdown > 0) return;
    setGlobalError(null);

    const result = await registerAction(data);

    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: storeKeys.me });
      router.push("/onboarding");
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
      result.error || "Ocurrió un error al intentar crear tu cuenta."
    );
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-outline-variant/70 shadow-level-2 p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-level-1">
          <Icon name="restaurant" size={26} />
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
          Crea tu cuenta en NexoFood
        </h1>
        <p className="text-sm text-on-surface-variant">
          Regístrate para configurar tu restaurante o gestionar tus pedidos.
        </p>
      </div>

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
            htmlFor={`${baseId}-fullName`}
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Nombre completo <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${baseId}-fullName`}
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            required
            maxLength={150}
            placeholder="Carlos Rodríguez"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? `${baseId}-fullName-err` : undefined
            }
            {...register("fullName")}
            className={inputClass}
          />
          {errors.fullName && (
            <p
              id={`${baseId}-fullName-err`}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
            >
              <Icon name="error" size={14} />
              <span>{errors.fullName.message}</span>
            </p>
          )}
        </div>

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
            maxLength={255}
            placeholder="carlos@ejemplo.com"
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
            htmlFor={`${baseId}-phone`}
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Teléfono{" "}
            <span className="font-normal text-on-surface-variant">
              (opcional)
            </span>
          </label>
          <input
            id={`${baseId}-phone`}
            type="tel"
            autoComplete="tel"
            enterKeyHint="next"
            maxLength={20}
            placeholder="+51 999 888 777"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${baseId}-phone-err` : undefined}
            {...register("phone")}
            className={inputClass}
          />
          {errors.phone && (
            <p
              id={`${baseId}-phone-err`}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
            >
              <Icon name="error" size={14} />
              <span>{errors.phone.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${baseId}-password`}
            className="block text-sm font-semibold text-on-surface mb-1"
          >
            Contraseña <span aria-hidden="true">*</span>
          </label>
          <p
            id={`${baseId}-password-policy`}
            className="text-xs text-on-surface-variant mb-1.5"
          >
            Entre 8 y 100 caracteres, al menos 1 letra y 1 número, sin espacios.
          </p>
          <div className="relative">
            <input
              id={`${baseId}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="next"
              required
              maxLength={100}
              placeholder="Mínimo 8 caracteres"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? `${baseId}-password-policy ${baseId}-password-err`
                  : `${baseId}-password-policy`
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

        <div>
          <label
            htmlFor={`${baseId}-confirmPassword`}
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Confirmar contraseña <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              id={`${baseId}-confirmPassword`}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="done"
              required
              maxLength={100}
              placeholder="Repite tu contraseña"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? `${baseId}-confirmPassword-err`
                  : undefined
              }
              {...register("confirmPassword")}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              aria-pressed={showConfirmPassword}
              aria-label={
                showConfirmPassword
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            >
              <Icon
                name={showConfirmPassword ? "visibility_off" : "visibility"}
                size={20}
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              id={`${baseId}-confirmPassword-err`}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
            >
              <Icon name="error" size={14} />
              <span>{errors.confirmPassword.message}</span>
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
          icon="person_add"
          className="mt-1"
        >
          {retryCountdown > 0
            ? `Espera ${retryCountdown} s`
            : isSubmitting
              ? "Creando cuenta..."
              : "Crear cuenta"}
        </Button>
        <LegalConsentNotice className="text-center" />
      </form>

      <div className="pt-2 border-t border-outline-variant/50 text-center text-sm">
        <p className="text-on-surface-variant">
          ¿Ya tienes cuenta?{" "}
          <Link href="/" className="text-primary font-bold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
