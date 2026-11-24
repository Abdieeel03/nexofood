"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { tenantResponseSchema, type TenantResponse } from "@/schemas/tenant.schema";
import { formatScheduleRange } from "@/lib/format";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import { canAccessGlobalAdmin } from "@/lib/permissions";
import { NotificationBell } from "@/modules/notifications";
import { useSessionTenant } from "./SessionTenantProvider";

export interface TopbarProps {
  onOpenMobileSidebar?: () => void;
  mobileSidebarOpen?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({
  onOpenMobileSidebar,
  mobileSidebarOpen = false,
  title,
  subtitle,
  actions,
}: TopbarProps) {
  const {
    user,
    activeTenant,
    systemRole,
    isLoadingTenant,
    switchTenant,
    refreshUser,
    refreshTenant,
  } = useSessionTenant();

  const [switchError, setSwitchError] = useState<string | null>(null);
  const [togglingOpen, setTogglingOpen] = useState(false);

  const canToggleOpen =
    Boolean(activeTenant?.isActive) && Boolean(user?.id) && activeTenant?.ownerId === user?.id;
  const isCurrentlyOpen =
    Boolean(activeTenant?.isActive) && activeTenant?.isOpen !== false;

  const handleToggleOpen = async () => {
    if (!activeTenant || togglingOpen) return;
    setTogglingOpen(true);
    setSwitchError(null);
    try {
      await apiClient.put<TenantResponse>(
        `/tenants/${encodeURIComponent(activeTenant.id)}`,
        {
          name: activeTenant.name,
          isOpen: !isCurrentlyOpen,
        },
        { schema: tenantResponseSchema }
      );
      await refreshTenant();
    } catch (err) {
      setSwitchError(getApiErrorMessage(err));
    } finally {
      setTogglingOpen(false);
    }
  };

  const handleTenantChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextTenantId = event.target.value;
    if (!nextTenantId || nextTenantId === activeTenant?.id) return;
    setSwitchError(null);
    try {
      await switchTenant(nextTenantId);
    } catch (err) {
      setSwitchError(
        getApiErrorMessage(err, "No se pudo cambiar de restaurante.")
      );
    }
  };

  return (
    <header className="min-h-16 bg-surface-card/95 backdrop-blur-md border-b border-outline-variant/50 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
      {/* Left section: mobile hamburger & active tenant status */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileSidebarOpen}
            className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <Icon name="menu" size={22} />
          </button>
        )}

        {title ? (
          <div className="min-w-0">
            <p className="text-base md:text-lg font-bold text-on-surface tracking-tight truncate">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-on-surface-variant hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        ) : activeTenant ? (
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-on-surface truncate max-w-[200px] sm:max-w-xs">
              {activeTenant.name}
            </span>
            <Badge
              variant={isCurrentlyOpen ? "success" : "danger"}
              dot
              size="sm"
            >
              {isCurrentlyOpen ? "Abierto" : "Cerrado"}
            </Badge>
            {canToggleOpen && (
              <Button
                type="button"
                size="sm"
                variant={isCurrentlyOpen ? "outline" : "primary"}
                disabled={togglingOpen}
                onClick={handleToggleOpen}
                className="h-7 px-2.5 text-xs"
                title={
                  isCurrentlyOpen
                    ? "Cerrar restaurante manualmente"
                    : "Abrir restaurante manualmente"
                }
              >
                {togglingOpen
                  ? "..."
                  : isCurrentlyOpen
                    ? "Cerrar"
                    : "Abrir"}
              </Button>
            )}
            {formatScheduleRange(
              activeTenant.openingTime,
              activeTenant.closingTime
            ) && (
              <span className="hidden md:inline text-xs font-semibold text-on-surface-variant tabular-nums">
                ({formatScheduleRange(activeTenant.openingTime, activeTenant.closingTime)})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-on-surface">
              NexoFood
            </span>
            <Badge variant="neutral" size="sm">
              {systemRole === "SUPERADMIN"
                ? "Administración global"
                : "Sin restaurante"}
            </Badge>
          </div>
        )}
      </div>

      {/* Right section: optional tenant switcher + storefront link + notifications */}
      <div className="flex items-center gap-2.5">
        {actions}

        {user.staffMemberships.length > 1 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="topbar-tenant-switcher"
              className="sr-only"
            >
              Cambiar restaurante activo
            </label>
            <select
              id="topbar-tenant-switcher"
              value={activeTenant?.id ?? ""}
              onChange={handleTenantChange}
              disabled={isLoadingTenant}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm font-semibold text-on-surface focus:border-primary disabled:opacity-60 cursor-pointer"
            >
              {!activeTenant && (
                <option value="" disabled>
                  Seleccionar restaurante
                </option>
              )}
              {user.staffMemberships.map((membership) => (
                <option
                  key={membership.tenantId}
                  value={membership.tenantId}
                >
                  {membership.tenantName} (
                  {TENANT_STAFF_ROLE_META[membership.staffRole].label})
                </option>
              ))}
            </select>
          </div>
        )}

        {canAccessGlobalAdmin(systemRole) && (
          <Link
            href="/superadmin"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-inverse-surface text-inverse-on-surface text-xs sm:text-sm font-bold hover:bg-inverse-surface-dark transition-colors shrink-0 shadow-level-1"
          >
            <Icon
              name="shield_person"
              size={18}
              className="text-inverse-primary shrink-0"
            />
            <span>SuperAdmin</span>
          </Link>
        )}

        <Link
          href={
            activeTenant
              ? `/store/${encodeURIComponent(activeTenant.slug)}`
              : "/store"
          }
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-outline-variant/80 bg-surface-card text-xs sm:text-sm font-bold text-on-surface hover:border-primary hover:text-primary hover:bg-mint-subtle/40 transition-colors shrink-0"
        >
          <Icon name="storefront" size={18} className="text-primary shrink-0" />
          <span>Ir al Storefront</span>
        </Link>

        <NotificationBell
          centerHref="/notifications"
          onInvitationAccepted={async () => {
            await refreshUser();
            await refreshTenant();
          }}
        />
      </div>

      {switchError && (
        <p role="alert" className="w-full text-xs font-semibold text-error">
          {switchError}
        </p>
      )}
    </header>
  );
}
