"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { getApiErrorMessage } from "@/lib/api-client";
import { getInitials } from "@/lib/format";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
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
    activeRole,
    systemRole,
    isLoadingTenant,
    switchTenant,
  } = useSessionTenant();

  const [switchError, setSwitchError] = useState<string | null>(null);

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

  const roleBadgeLabel = activeRole
    ? TENANT_STAFF_ROLE_META[activeRole].label
    : systemRole === "SUPERADMIN"
      ? "SUPERADMIN"
      : "USER";

  const roleBadgeVariant = activeRole
    ? TENANT_STAFF_ROLE_META[activeRole].variant
    : systemRole === "SUPERADMIN"
      ? "primary"
      : "neutral";

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
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm font-bold text-on-surface truncate max-w-[200px] sm:max-w-xs">
              {activeTenant.name}
            </span>
            <Badge
              variant={activeTenant.isActive ? "success" : "warning"}
              dot
              size="sm"
            >
              {activeTenant.isActive ? "Activo" : "Inactivo"}
            </Badge>
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

      {/* Right section: optional tenant switcher + user identity */}
      <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-2.5 pl-1">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-on-surface leading-tight">
              {user.fullName}
            </span>
            <Badge variant={roleBadgeVariant} size="sm" className="mt-0.5">
              {roleBadgeLabel}
            </Badge>
          </div>
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-level-1 shrink-0"
          >
            {getInitials(user.fullName)}
          </div>
        </div>
      </div>

      {switchError && (
        <p role="alert" className="w-full text-xs font-semibold text-error">
          {switchError}
        </p>
      )}
    </header>
  );
}
