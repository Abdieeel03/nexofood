"use client";

import { LegalConsentNotice } from "@/components/legal/LegalLinks";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { cleanPayload } from "@/schemas/common.schema";
import {
  storeLoginRequestSchema,
  storeRegisterFormSchema,
  type StoreLoginRequest,
  type StoreRegisterFormValues,
} from "@/schemas/tenant.schema";
import { storeLoginAction, storeRegisterAction } from "@/lib/auth-actions";
import { useStoreUi, type StoreAuthTab } from "@/stores/store-ui.store";
import { storeKeys } from "../../queries/keys";
import { useTenantBySlugQuery } from "../../queries/use-storefront-catalog-queries";

const inputClass =
  "w-full rounded-xl bg-surface-container-low border border-outline-variant px-3.5 py-2.5 text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none transition-colors";

const labelClass = "block text-sm font-semibold text-on-surface mb-1";

export const StoreAuthDialog: React.FC = () => {
  const open = useStoreUi((s) => s.authDialogOpen);
  const slug = useStoreUi((s) => s.authDialogSlug);
  const tab = useStoreUi((s) => s.authDialogTab);
  const setTab = useStoreUi((s) => s.setAuthDialogTab);
  const closeDialog = useStoreUi((s) => s.closeAuthDialog);
  const consumeCallback = useStoreUi((s) => s.consumePendingAuthCallback);

  const { data: tenant } = useTenantBySlugQuery(slug);
  const storeTitle = tenant?.name || slug || "la tienda";

  return (
    <Dialog
      open={open && Boolean(slug)}
      onClose={closeDialog}
      title={
        tab === "login"
          ? `Inicia sesión en ${storeTitle}`
          : `Crea tu cuenta en ${storeTitle}`
      }
      description="Tu carrito y pedidos se sincronizan con tu cuenta en este restaurante."
      size="sm"
    >
      {open && slug && (
        <StoreAuthDialogContent
          key={slug}
          slug={slug}
          tab={tab}
          onChangeTab={setTab}
          onClose={closeDialog}
          consumeCallback={consumeCallback}
        />
      )}
    </Dialog>
  );
};

interface StoreAuthDialogContentProps {
  slug: string;
  tab: StoreAuthTab;
  onChangeTab: (tab: StoreAuthTab) => void;
  onClose: () => void;
  consumeCallback: () => (() => void | Promise<void>) | null;
}

const StoreAuthDialogContent: React.FC<StoreAuthDialogContentProps> = ({
  slug,
  tab,
  onChangeTab,
  onClose,
  consumeCallback,
}) => {
  const queryClient = useQueryClient();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isConflictError, setIsConflictError] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginForm = useForm<StoreLoginRequest>({
    resolver: zodResolver(storeLoginRequestSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<StoreRegisterFormValues>({
    resolver: zodResolver(storeRegisterFormSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const handleTabSwitch = (nextTab: StoreAuthTab) => {
    setServerError(null);
    setIsConflictError(false);
    onChangeTab(nextTab);
  };

  const finalizeAuthSuccess = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: storeKeys.me }),
      queryClient.invalidateQueries({ queryKey: storeKeys.cart(slug) }),
      queryClient.invalidateQueries({ queryKey: storeKeys.addresses }),
      queryClient.invalidateQueries({ queryKey: storeKeys.ordersRoot(slug) }),
    ]);
    const cb = consumeCallback();
    onClose();
    if (cb) {
      await cb();
    }
  };

  const onLoginSubmit = async (values: StoreLoginRequest) => {
    setServerError(null);
    setIsConflictError(false);

    const res = await storeLoginAction(slug, {
      email: values.email.trim(),
      password: values.password,
    });

    if (!res.success) {
      if (res.status === 429) {
        setRetryCountdown(res.retryAfter ?? 60);
      }
      setServerError(res.error);
      return;
    }

    await finalizeAuthSuccess();
  };

  const onRegisterSubmit = async (values: StoreRegisterFormValues) => {
    setServerError(null);
    setIsConflictError(false);

    const cleanRegisterPayload = cleanPayload({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
      phone:
        typeof values.phone === "string" && values.phone.trim().length > 0
          ? values.phone.trim()
          : undefined,
    });

    const res = await storeRegisterAction(
      slug,
      cleanRegisterPayload as StoreRegisterFormValues
    );

    if (!res.success) {
      if (res.status === 429) {
        setRetryCountdown(res.retryAfter ?? 60);
      }
      if (res.status === 409) {
        setIsConflictError(true);
      }
      setServerError(res.error);
      return;
    }

    await finalizeAuthSuccess();
  };

  const switchToLoginWithEmail = () => {
    const email = registerForm.getValues("email");
    if (email) {
      loginForm.setValue("email", email);
    }
    handleTabSwitch("login");
  };

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Modo de acceso a la tienda"
        className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-container border border-outline-variant/60"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "login"}
          onClick={() => handleTabSwitch("login")}
          className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
            tab === "login"
              ? "bg-surface-card text-primary shadow-level-1"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "register"}
          onClick={() => handleTabSwitch("register")}
          className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
            tab === "register"
              ? "bg-surface-card text-primary shadow-level-1"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {serverError && (
        <Alert
          variant="danger"
          action={
            isConflictError ? (
              <button
                type="button"
                onClick={switchToLoginWithEmail}
                className="text-xs font-bold underline text-on-error-container cursor-pointer"
              >
                Cambiar a Iniciar sesión con este correo
              </button>
            ) : undefined
          }
        >
          <p>{serverError}</p>
          {retryCountdown > 0 && (
            <p className="mt-1 text-xs font-bold tabular-nums">
              Podrás reintentar en {retryCountdown} segundos.
            </p>
          )}
        </Alert>
      )}

      {tab === "login" ? (
        <form
          onSubmit={loginForm.handleSubmit(onLoginSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="store-login-email" className={labelClass}>
              Correo electrónico
            </label>
            <input
              id="store-login-email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="next"
              required
              aria-invalid={
                Boolean(loginForm.formState.errors.email) || undefined
              }
              aria-describedby={
                loginForm.formState.errors.email
                  ? "store-login-email-error"
                  : undefined
              }
              placeholder="tucorreo@ejemplo.com"
              className={inputClass}
              {...loginForm.register("email")}
            />
            {loginForm.formState.errors.email && (
              <p
                id="store-login-email-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="store-login-password" className={labelClass}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="store-login-password"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                enterKeyHint="done"
                required
                aria-invalid={
                  Boolean(loginForm.formState.errors.password) || undefined
                }
                aria-describedby={
                  loginForm.formState.errors.password
                    ? "store-login-password-error"
                    : undefined
                }
                placeholder="••••••••"
                className={`${inputClass} pr-11`}
                {...loginForm.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                aria-pressed={showLoginPassword}
                aria-label={
                  showLoginPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <Icon
                  name={showLoginPassword ? "visibility_off" : "visibility"}
                  size={19}
                />
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p
                id="store-login-password-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loginForm.formState.isSubmitting}
            disabled={retryCountdown > 0}
          >
            Iniciar sesión
          </Button>
        </form>
      ) : (
        <form
          onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
          className="space-y-3.5"
          noValidate
        >
          <div>
            <label htmlFor="store-register-fullname" className={labelClass}>
              Nombre completo
            </label>
            <input
              id="store-register-fullname"
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              maxLength={150}
              required
              aria-invalid={
                Boolean(registerForm.formState.errors.fullName) || undefined
              }
              aria-describedby={
                registerForm.formState.errors.fullName
                  ? "store-register-fullname-error"
                  : undefined
              }
              placeholder="Mariana Vega"
              className={inputClass}
              {...registerForm.register("fullName")}
            />
            {registerForm.formState.errors.fullName && (
              <p
                id="store-register-fullname-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {registerForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="store-register-email" className={labelClass}>
              Correo electrónico
            </label>
            <input
              id="store-register-email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="next"
              maxLength={255}
              required
              aria-invalid={
                Boolean(registerForm.formState.errors.email) || undefined
              }
              aria-describedby={
                registerForm.formState.errors.email
                  ? "store-register-email-error"
                  : undefined
              }
              placeholder="mariana@ejemplo.com"
              className={inputClass}
              {...registerForm.register("email")}
            />
            {registerForm.formState.errors.email && (
              <p
                id="store-register-email-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {registerForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="store-register-phone" className={labelClass}>
              Teléfono{" "}
              <span className="font-normal text-on-surface-variant">
                (opcional)
              </span>
            </label>
            <input
              id="store-register-phone"
              type="tel"
              autoComplete="tel"
              enterKeyHint="next"
              maxLength={20}
              aria-invalid={
                Boolean(registerForm.formState.errors.phone) || undefined
              }
              aria-describedby={
                registerForm.formState.errors.phone
                  ? "store-register-phone-error"
                  : undefined
              }
              placeholder="+51999888777"
              className={inputClass}
              {...registerForm.register("phone")}
            />
            {registerForm.formState.errors.phone && (
              <p
                id="store-register-phone-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {registerForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="store-register-password" className={labelClass}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="store-register-password"
                type={showRegisterPassword ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="next"
                maxLength={100}
                required
                aria-invalid={
                  Boolean(registerForm.formState.errors.password) || undefined
                }
                aria-describedby="store-register-password-help store-register-password-error"
                placeholder="Mínimo 8 caracteres"
                className={`${inputClass} pr-11`}
                {...registerForm.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
                aria-pressed={showRegisterPassword}
                aria-label={
                  showRegisterPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <Icon
                  name={
                    showRegisterPassword ? "visibility_off" : "visibility"
                  }
                  size={19}
                />
              </button>
            </div>
            <p
              id="store-register-password-help"
              className="mt-1 text-xs text-on-surface-variant"
            >
              Entre 8 y 100 caracteres, con al menos 1 letra y 1 número, sin
              espacios.
            </p>
            {registerForm.formState.errors.password && (
              <p
                id="store-register-password-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {registerForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="store-register-confirm-password"
              className={labelClass}
            >
              Confirmar contraseña
            </label>
            <input
              id="store-register-confirm-password"
              type={showRegisterPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="done"
              maxLength={100}
              required
              aria-invalid={
                Boolean(registerForm.formState.errors.confirmPassword) ||
                undefined
              }
              aria-describedby={
                registerForm.formState.errors.confirmPassword
                  ? "store-register-confirm-error"
                  : undefined
              }
              placeholder="Repite tu contraseña"
              className={inputClass}
              {...registerForm.register("confirmPassword")}
            />
            {registerForm.formState.errors.confirmPassword && (
              <p
                id="store-register-confirm-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-error"
              >
                {registerForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={registerForm.formState.isSubmitting}
            disabled={retryCountdown > 0}
          >
            Crear cuenta y continuar
          </Button>
          <LegalConsentNotice className="text-center" />
        </form>
      )}
    </div>
  );
};
