"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { MapPicker } from "@/components/ui/MapPicker";
import {
  apiClient,
  getApiErrorMessage,
  isApiError,
} from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  changePasswordFormSchema,
  customerAddressRequestSchema,
  customerAddressResponseSchema,
  userProfileResponseSchema,
  userResponseSchema,
  userUpdateRequestSchema,
  type ChangePasswordFormValues,
  type CustomerAddressRequest,
  type CustomerAddressResponse,
  type UserProfileResponse,
  type UserResponse,
  type UserUpdateRequest,
} from "@/schemas/auth.schema";
import { cleanPayload } from "@/schemas/common.schema";
import { NotificationsCenterView } from "@/modules/notifications";

export interface AccountManagerProps {
  context?: "saas" | "store";
  slug?: string;
  onProfileUpdated?: () => Promise<void> | void;
}

type AccountTab = "profile" | "security" | "addresses" | "notifications";

const DEFAULT_LIMA_COORDS = { latitude: -12.046374, longitude: -77.042793 };

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

export function AccountManager({
  context = "saas",
  slug,
  onProfileUpdated,
}: AccountManagerProps) {
  const queryClient = useQueryClient();
  const baseId = useId();

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const tabRefs = useRef<Record<AccountTab, HTMLButtonElement | null>>({
    profile: null,
    security: null,
    addresses: null,
    notifications: null,
  });

  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null
  );

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] =
    useState<CustomerAddressResponse | null>(null);
  const [addressToDelete, setAddressToDelete] =
    useState<CustomerAddressResponse | null>(null);
  const [addressFeedback, setAddressFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () =>
      apiClient.get<UserProfileResponse>("/auth/me", {
        schema: userProfileResponseSchema,
      }),
    retry: false,
  });

  const addressesQuery = useQuery({
    queryKey: ["users", "me", "addresses"],
    queryFn: () =>
      apiClient.get<CustomerAddressResponse[]>("/users/me/addresses", {
        schema: z.array(customerAddressResponseSchema),
      }),
    enabled: profileQuery.isSuccess,
    retry: false,
  });

  // ─── Formulario de Perfil ──────────────────────────────────────────────────
  const profileForm = useForm<UserUpdateRequest>({
    resolver: zodResolver(userUpdateRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        fullName: profileQuery.data.fullName,
        phone: profileQuery.data.phone ?? "",
      });
    }
  }, [profileQuery.data, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: (values: UserUpdateRequest) => {
      const normalizedPhone =
        typeof values.phone === "string" && values.phone.trim().length > 0
          ? values.phone.trim()
          : null;
      return apiClient.put<UserResponse>(
        "/users/me",
        cleanPayload({
          fullName: values.fullName.trim(),
          phone: normalizedPhone,
        }),
        { schema: userResponseSchema }
      );
    },
    onSuccess: async () => {
      setProfileFeedback({
        type: "success",
        message: "Tus datos personales fueron actualizados correctamente.",
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await onProfileUpdated?.();
    },
    onError: (err) => {
      setProfileFeedback({
        type: "danger",
        message: getApiErrorMessage(err, "No se pudo actualizar tu perfil."),
      });
    },
  });

  // ─── Formulario de Cambio de Contraseña ────────────────────────────────────
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      await apiClient.patchRaw<null>(
        "/users/me/password",
        cleanPayload({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      );
      await fetch("/api/auth/clear", { method: "POST" });
    },
    onSuccess: () => {
      window.location.assign("/?password_changed=true");
    },
    onError: (err) => {
      setPasswordError(
        getApiErrorMessage(err, "No se pudo cambiar la contraseña.")
      );
    },
  });

  // ─── Eliminación de Cuenta ─────────────────────────────────────────────────
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiClient.deleteRaw<null>("/users/me");
      await fetch("/api/auth/clear", { method: "POST" });
    },
    onSuccess: () => {
      window.location.assign("/");
    },
    onError: (err) => {
      setDeleteAccountError(
        getApiErrorMessage(err, "No se pudo eliminar la cuenta.")
      );
    },
  });

  // ─── Formulario de Direcciones ─────────────────────────────────────────────
  const addressForm = useForm<CustomerAddressRequest>({
    resolver: zodResolver(customerAddressRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      addressLine: "",
      reference: "",
      latitude: DEFAULT_LIMA_COORDS.latitude,
      longitude: DEFAULT_LIMA_COORDS.longitude,
    },
  });

  const addressLat = useWatch({
    control: addressForm.control,
    name: "latitude",
  });
  const addressLng = useWatch({
    control: addressForm.control,
    name: "longitude",
  });

  const openCreateAddress = () => {
    setEditingAddress(null);
    setAddressFeedback(null);
    addressForm.reset({
      title: "",
      addressLine: "",
      reference: "",
      latitude: DEFAULT_LIMA_COORDS.latitude,
      longitude: DEFAULT_LIMA_COORDS.longitude,
    });
    setAddressDialogOpen(true);
  };

  const openEditAddress = (addr: CustomerAddressResponse) => {
    setEditingAddress(addr);
    setAddressFeedback(null);
    addressForm.reset({
      title: addr.title ?? "",
      addressLine: addr.addressLine,
      reference: addr.reference ?? "",
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
    setAddressDialogOpen(true);
  };

  const saveAddressMutation = useMutation({
    mutationFn: (values: CustomerAddressRequest) => {
      const trimmedTitle = values.title?.trim();
      const trimmedRef = values.reference?.trim();
      const payload = cleanPayload({
        title: trimmedTitle && trimmedTitle.length > 0 ? trimmedTitle : undefined,
        addressLine: values.addressLine.trim(),
        reference:
          trimmedRef && trimmedRef.length > 0
            ? trimmedRef
            : editingAddress
              ? null
              : undefined,
        latitude: values.latitude,
        longitude: values.longitude,
      });

      if (editingAddress) {
        return apiClient.put<CustomerAddressResponse>(
          `/users/me/addresses/${encodeURIComponent(editingAddress.id)}`,
          payload,
          { schema: customerAddressResponseSchema }
        );
      }

      return apiClient.post<CustomerAddressResponse>(
        "/users/me/addresses",
        payload,
        { schema: customerAddressResponseSchema }
      );
    },
    onSuccess: async () => {
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressFeedback({
        type: "success",
        message: editingAddress
          ? "Dirección actualizada exitosamente."
          : "Dirección agregada exitosamente.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "me", "addresses"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ]);
      await onProfileUpdated?.();
    },
    onError: (err) => {
      setAddressFeedback({
        type: "danger",
        message: getApiErrorMessage(err, "No se pudo guardar la dirección."),
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) =>
      apiClient.deleteRaw<null>(
        `/users/me/addresses/${encodeURIComponent(addressId)}`
      ),
    onSuccess: async () => {
      setAddressToDelete(null);
      setAddressFeedback({
        type: "success",
        message: "Dirección eliminada de tu libreta.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "me", "addresses"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ]);
      await onProfileUpdated?.();
    },
    onError: (err) => {
      setAddressFeedback({
        type: "danger",
        message: getApiErrorMessage(err, "No se pudo eliminar la dirección."),
      });
      setAddressToDelete(null);
    },
  });

  // ─── Teclado en Tabs ───────────────────────────────────────────────────────
  const tabsOrder: Array<{ id: AccountTab; label: string; icon: string }> = [
    { id: "profile", label: "Perfil", icon: "person" },
    { id: "security", label: "Seguridad", icon: "lock" },
    { id: "addresses", label: "Libreta de direcciones", icon: "location_on" },
    {
      id: "notifications",
      label: "Notificaciones e invitaciones",
      icon: "notifications",
    },
  ];

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabsOrder.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabsOrder.length) % tabsOrder.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabsOrder.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextTab = tabsOrder[nextIndex].id;
      setActiveTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  // ─── Estados de Carga y 401 en Storefront ──────────────────────────────────
  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4 max-w-4xl" aria-busy="true">
        <div className="h-8 w-56 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="h-64 rounded-2xl bg-surface-card border border-outline-variant/60 animate-pulse" />
      </div>
    );
  }

  if (profileQuery.isError) {
    const isUnauthorized =
      isApiError(profileQuery.error) && profileQuery.error.status === 401;

    if (isUnauthorized && context === "store") {
      const storeReturn = slug ? `/store/${encodeURIComponent(slug)}` : "/";
      return (
        <div className="max-w-xl mx-auto rounded-2xl border border-outline-variant bg-surface-card p-8 text-center shadow-level-1 space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-mint-subtle text-primary flex items-center justify-center">
            <Icon name="account_circle" size={30} />
          </div>
          <h1 className="text-xl font-extrabold text-on-surface">
            Inicia sesión para gestionar tu cuenta
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Necesitas una sesión activa para editar tu perfil, cambiar tu
            contraseña y administrar tus direcciones de entrega.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/?callbackUrl=${encodeURIComponent(
                slug
                  ? `/store/${encodeURIComponent(slug)}/account`
                  : "/account"
              )}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-5 py-2.5 text-sm font-semibold text-on-secondary shadow-xs hover:bg-secondary-accent transition-colors"
            >
              <span>Iniciar sesión</span>
              <Icon name="login" size={18} />
            </Link>
            <Link
              href={storeReturn}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span>{slug ? "Volver al restaurante" : "Ir al inicio"}</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl space-y-4">
        <Alert variant="danger" title="No pudimos cargar tu cuenta">
          {getApiErrorMessage(
            profileQuery.error,
            "Ocurrió un problema al consultar tu información."
          )}
        </Alert>
        <Button
          type="button"
          variant="secondary"
          onClick={() => profileQuery.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data!;
  const addresses = addressesQuery.data ?? profile.addresses ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Mi Cuenta
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Administra tus datos personales, credenciales de acceso y libreta de
            direcciones para entregas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={profile.isActive ? "success" : "danger"} dot>
            {profile.isActive ? "Cuenta activa" : "Cuenta inactiva"}
          </Badge>
          <Badge variant="primary">{profile.systemRole}</Badge>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-outline-variant/60">
        <div
          role="tablist"
          aria-label="Secciones de configuración de cuenta"
          className="flex overflow-x-auto hide-scrollbar gap-1"
        >
          {tabsOrder.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tab.id}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`relative shrink-0 inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selected
                    ? "text-primary after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:border-b-[3px] after:border-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon name={tab.icon} size={18} fill={selected} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel 1: Perfil */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-profile`}
        aria-labelledby={`${baseId}-tab-profile`}
        hidden={activeTab !== "profile"}
      >
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              Información personal
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Estos datos se muestran en tus restaurantes y comprobantes de
              pedido.
            </p>
          </div>

          {profileFeedback && (
            <Alert
              variant={profileFeedback.type}
              onDismiss={() => setProfileFeedback(null)}
            >
              {profileFeedback.message}
            </Alert>
          )}

          <form
            onSubmit={profileForm.handleSubmit((data) => {
              setProfileFeedback(null);
              updateProfileMutation.mutate(data);
            })}
            noValidate
            className="space-y-5 max-w-xl"
          >
            <div>
              <label
                htmlFor={`${baseId}-email`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id={`${baseId}-email`}
                type="email"
                value={profile.email}
                readOnly
                className="w-full min-h-[44px] rounded-xl border border-outline-variant/70 bg-surface-container text-on-surface-variant px-3.5 py-2.5 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                El correo electrónico identifica tu cuenta global y no se puede
                modificar.
              </p>
            </div>

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
                required
                maxLength={150}
                aria-invalid={Boolean(profileForm.formState.errors.fullName)}
                aria-describedby={
                  profileForm.formState.errors.fullName
                    ? `${baseId}-fullName-error`
                    : undefined
                }
                {...profileForm.register("fullName")}
                className={inputClass}
              />
              {profileForm.formState.errors.fullName && (
                <p
                  id={`${baseId}-fullName-error`}
                  className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
                >
                  <Icon name="error" size={14} />
                  <span>{profileForm.formState.errors.fullName.message}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-phone`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Teléfono de contacto
              </label>
              <input
                id={`${baseId}-phone`}
                type="tel"
                autoComplete="tel"
                maxLength={20}
                placeholder="+51 999 888 777"
                aria-invalid={Boolean(profileForm.formState.errors.phone)}
                aria-describedby={
                  profileForm.formState.errors.phone
                    ? `${baseId}-phone-error`
                    : `${baseId}-phone-help`
                }
                {...profileForm.register("phone")}
                className={inputClass}
              />
              <p
                id={`${baseId}-phone-help`}
                className="mt-1 text-xs text-on-surface-variant"
              >
                Déjalo vacío si deseas borrar tu teléfono guardado.
              </p>
              {profileForm.formState.errors.phone && (
                <p
                  id={`${baseId}-phone-error`}
                  className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                >
                  <Icon name="error" size={14} />
                  <span>{profileForm.formState.errors.phone.message}</span>
                </p>
              )}
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                isLoading={updateProfileMutation.isPending}
                icon="save"
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel 2: Seguridad */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-security`}
        aria-labelledby={`${baseId}-tab-security`}
        hidden={activeTab !== "security"}
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Cambiar contraseña
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Al actualizar tu contraseña se cerrarán todas tus sesiones
                activas y deberás volver a iniciar sesión.
              </p>
            </div>

            {passwordError && (
              <Alert
                variant="danger"
                onDismiss={() => setPasswordError(null)}
              >
                {passwordError}
              </Alert>
            )}

            <form
              onSubmit={passwordForm.handleSubmit((data) => {
                setPasswordError(null);
                changePasswordMutation.mutate(data);
              })}
              noValidate
              className="space-y-4 max-w-xl"
            >
              <div>
                <label
                  htmlFor={`${baseId}-currentPassword`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Contraseña actual <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id={`${baseId}-currentPassword`}
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    aria-invalid={Boolean(
                      passwordForm.formState.errors.currentPassword
                    )}
                    aria-describedby={
                      passwordForm.formState.errors.currentPassword
                        ? `${baseId}-currentPassword-error`
                        : undefined
                    }
                    {...passwordForm.register("currentPassword")}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    aria-pressed={showCurrentPassword}
                    aria-label={
                      showCurrentPassword
                        ? "Ocultar contraseña actual"
                        : "Mostrar contraseña actual"
                    }
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
                  >
                    <Icon
                      name={
                        showCurrentPassword ? "visibility_off" : "visibility"
                      }
                      size={20}
                    />
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p
                    id={`${baseId}-currentPassword-error`}
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>
                      {passwordForm.formState.errors.currentPassword.message}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-newPassword`}
                  className="block text-sm font-semibold text-on-surface mb-1"
                >
                  Nueva contraseña <span aria-hidden="true">*</span>
                </label>
                <p
                  id={`${baseId}-password-policy`}
                  className="text-xs text-on-surface-variant mb-1.5"
                >
                  Entre 8 y 100 caracteres, al menos 1 letra y 1 número, sin
                  espacios y distinta a tu contraseña actual.
                </p>
                <div className="relative">
                  <input
                    id={`${baseId}-newPassword`}
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(
                      passwordForm.formState.errors.newPassword
                    )}
                    aria-describedby={
                      passwordForm.formState.errors.newPassword
                        ? `${baseId}-password-policy ${baseId}-newPassword-error`
                        : `${baseId}-password-policy`
                    }
                    {...passwordForm.register("newPassword")}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    aria-pressed={showNewPassword}
                    aria-label={
                      showNewPassword
                        ? "Ocultar nueva contraseña"
                        : "Mostrar nueva contraseña"
                    }
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
                  >
                    <Icon
                      name={showNewPassword ? "visibility_off" : "visibility"}
                      size={20}
                    />
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p
                    id={`${baseId}-newPassword-error`}
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>
                      {passwordForm.formState.errors.newPassword.message}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-confirmPassword`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Confirmar nueva contraseña <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id={`${baseId}-confirmPassword`}
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(
                      passwordForm.formState.errors.confirmPassword
                    )}
                    aria-describedby={
                      passwordForm.formState.errors.confirmPassword
                        ? `${baseId}-confirmPassword-error`
                        : undefined
                    }
                    {...passwordForm.register("confirmPassword")}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    aria-pressed={showConfirmPassword}
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmación"
                        : "Mostrar confirmación"
                    }
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
                  >
                    <Icon
                      name={
                        showConfirmPassword ? "visibility_off" : "visibility"
                      }
                      size={20}
                    />
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p
                    id={`${baseId}-confirmPassword-error`}
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>
                      {passwordForm.formState.errors.confirmPassword.message}
                    </span>
                  </p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={changePasswordMutation.isPending}
                  icon="key"
                >
                  Actualizar contraseña
                </Button>
              </div>
            </form>
          </div>

          {/* Zona de peligro: Eliminar cuenta */}
          <div className="rounded-2xl border border-error/30 bg-surface-card p-6 shadow-level-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-error">
                  Eliminar cuenta
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
                  Desactiva tu cuenta de NexoFood de forma permanente y revoca
                  de inmediato todos tus tokens de acceso en backoffice y
                  storefront.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                icon="delete_forever"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteAccountError(null);
                  setDeleteAccountOpen(true);
                }}
              >
                Eliminar mi cuenta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 3: Libreta de Direcciones */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-addresses`}
        aria-labelledby={`${baseId}-tab-addresses`}
        hidden={activeTab !== "addresses"}
      >
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Direcciones guardadas
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Usa coordenadas WGS84 exactas para validar cobertura y agilizar
                tus entregas.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              icon="add_location_alt"
              iconPosition="left"
              onClick={openCreateAddress}
            >
              Nueva dirección
            </Button>
          </div>

          {addressFeedback && (
            <Alert
              variant={addressFeedback.type}
              onDismiss={() => setAddressFeedback(null)}
            >
              {addressFeedback.message}
            </Alert>
          )}

          {addressesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-36 rounded-2xl bg-surface-container animate-pulse" />
              <div className="h-36 rounded-2xl bg-surface-container animate-pulse" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center">
                <Icon name="location_off" size={24} />
              </div>
              <p className="text-sm font-bold text-on-surface">
                Aún no tienes direcciones guardadas
              </p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Registra tu casa u oficina con un pin en el mapa para calcular
                el costo de envío y el tiempo estimado en segundos.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => {
                const label = addr.title || "Dirección";
                return (
                  <li
                    key={addr.id}
                    className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/40 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="primary" size="sm">
                          {label}
                        </Badge>
                        <span className="text-[11px] font-medium text-on-surface-variant tabular-nums">
                          {addr.latitude.toFixed(5)}, {addr.longitude.toFixed(5)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-on-surface leading-snug">
                        {addr.addressLine}
                      </p>
                      {addr.reference && (
                        <p className="text-xs text-on-surface-variant">
                          Ref.: {addr.reference}
                        </p>
                      )}
                      <p className="text-[11px] text-on-surface-variant">
                        Actualizada: {formatDateTime(addr.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon="edit"
                        iconPosition="left"
                        aria-label={`Editar dirección ${label}: ${addr.addressLine}`}
                        onClick={() => openEditAddress(addr)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon="delete"
                        iconPosition="left"
                        aria-label={`Eliminar dirección ${label}: ${addr.addressLine}`}
                        className="text-error hover:bg-error-container/40 hover:text-on-error-container"
                        onClick={() => setAddressToDelete(addr)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Panel 4: Notificaciones e invitaciones */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-notifications`}
        aria-labelledby={`${baseId}-tab-notifications`}
        hidden={activeTab !== "notifications"}
      >
        {activeTab === "notifications" && (
          <NotificationsCenterView
            embedded
            onMembershipChanged={async () => {
              await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
              await onProfileUpdated?.();
            }}
          />
        )}
      </div>

      {/* Diálogo Crear / Editar Dirección */}
      <Dialog
        open={addressDialogOpen}
        onClose={() => {
          if (!saveAddressMutation.isPending) {
            setAddressDialogOpen(false);
            setEditingAddress(null);
          }
        }}
        title={editingAddress ? "Editar dirección" : "Nueva dirección de entrega"}
        description="Completa los datos de entrega y ubica el punto exacto en el mapa."
        size="lg"
      >
        <form
          id={`${baseId}-address-form`}
          onSubmit={addressForm.handleSubmit((data) => {
            setAddressFeedback(null);
            saveAddressMutation.mutate(data);
          })}
          noValidate
          className="space-y-4"
        >
          {addressFeedback && addressFeedback.type === "danger" && (
            <Alert variant="danger">{addressFeedback.message}</Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${baseId}-addr-title`}
                className="block text-sm font-semibold text-on-surface mb-1"
              >
                Etiqueta
              </label>
              <input
                id={`${baseId}-addr-title`}
                type="text"
                maxLength={50}
                placeholder="Casa, Oficina, etc."
                autoComplete="off"
                aria-invalid={Boolean(addressForm.formState.errors.title)}
                aria-describedby={`${baseId}-addr-title-help`}
                {...addressForm.register("title")}
                className={inputClass}
              />
              <p
                id={`${baseId}-addr-title-help`}
                className="mt-1 text-xs text-on-surface-variant"
              >
                Si la omites al crear, se guardará como &ldquo;Casa&rdquo;.
              </p>
            </div>

            <div>
              <label
                htmlFor={`${baseId}-addr-ref`}
                className="block text-sm font-semibold text-on-surface mb-1"
              >
                Referencia para el repartidor
              </label>
              <input
                id={`${baseId}-addr-ref`}
                type="text"
                maxLength={500}
                placeholder="Frente al parque, timbre 302"
                autoComplete="off"
                aria-invalid={Boolean(addressForm.formState.errors.reference)}
                {...addressForm.register("reference")}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-addr-line`}
              className="block text-sm font-semibold text-on-surface mb-1"
            >
              Dirección completa <span aria-hidden="true">*</span>
            </label>
            <textarea
              id={`${baseId}-addr-line`}
              rows={2}
              required
              maxLength={255}
              autoComplete="street-address"
              placeholder="Av. Las Palmeras 123, Los Olivos"
              aria-invalid={Boolean(addressForm.formState.errors.addressLine)}
              aria-describedby={
                addressForm.formState.errors.addressLine
                  ? `${baseId}-addr-line-error`
                  : undefined
              }
              {...addressForm.register("addressLine")}
              className={inputClass}
            />
            {addressForm.formState.errors.addressLine && (
              <p
                id={`${baseId}-addr-line-error`}
                className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
              >
                <Icon name="error" size={14} />
                <span>{addressForm.formState.errors.addressLine.message}</span>
              </p>
            )}
          </div>

          <MapPicker
            latitude={addressLat}
            longitude={addressLng}
            heightClassName="h-64"
            onChange={({ latitude, longitude }) => {
              addressForm.setValue("latitude", latitude, {
                shouldValidate: true,
                shouldDirty: true,
              });
              addressForm.setValue("longitude", longitude, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />

          {(addressForm.formState.errors.latitude ||
            addressForm.formState.errors.longitude) && (
            <p className="text-xs font-semibold text-error">
              {addressForm.formState.errors.latitude?.message ||
                addressForm.formState.errors.longitude?.message}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-outline-variant/50">
            <Button
              type="button"
              variant="outline"
              disabled={saveAddressMutation.isPending}
              onClick={() => setAddressDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saveAddressMutation.isPending}
              icon="save"
            >
              {editingAddress ? "Guardar cambios" : "Guardar dirección"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Diálogo Confirmar Eliminación de Dirección */}
      <Dialog
        open={Boolean(addressToDelete)}
        onClose={() => {
          if (!deleteAddressMutation.isPending) setAddressToDelete(null);
        }}
        title="Eliminar dirección"
        description="Esta acción eliminará la dirección de forma permanente."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={deleteAddressMutation.isPending}
              onClick={() => setAddressToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteAddressMutation.isPending}
              onClick={() => {
                if (addressToDelete) {
                  deleteAddressMutation.mutate(addressToDelete.id);
                }
              }}
            >
              Eliminar dirección
            </Button>
          </>
        }
      >
        <p className="text-sm text-on-surface">
          ¿Confirmas que deseas eliminar{" "}
          <strong>
            {addressToDelete?.title || "esta dirección"}
          </strong>{" "}
          ({addressToDelete?.addressLine})?
        </p>
      </Dialog>

      {/* Diálogo Confirmar Eliminación de Cuenta */}
      <Dialog
        open={deleteAccountOpen}
        onClose={() => {
          if (!deleteAccountMutation.isPending) setDeleteAccountOpen(false);
        }}
        closedby="closerequest"
        title="Confirmar eliminación de cuenta"
        description="Tu cuenta quedará desactivada y no podrás iniciar sesión."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={deleteAccountMutation.isPending}
              onClick={() => setDeleteAccountOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteConfirmText.trim().toUpperCase() !== "ELIMINAR"}
              isLoading={deleteAccountMutation.isPending}
              onClick={() => {
                setDeleteAccountError(null);
                deleteAccountMutation.mutate();
              }}
            >
              Confirmar eliminación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteAccountError && (
            <Alert variant="danger">{deleteAccountError}</Alert>
          )}
          <Alert variant="warning">
            Esta acción desactiva tu usuario y revoca de inmediato tus sesiones
            activas en toda la plataforma.
          </Alert>
          <div>
            <label
              htmlFor={`${baseId}-confirm-delete`}
              className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
            >
              Escribe ELIMINAR para continuar
            </label>
            <input
              id={`${baseId}-confirm-delete`}
              type="text"
              autoComplete="off"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className={inputClass}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
