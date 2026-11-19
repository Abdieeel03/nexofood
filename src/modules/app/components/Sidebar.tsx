"use client";

import { LegalLinks } from "@/components/legal/LegalLinks";
import React, { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { logoutAction } from "@/lib/auth-actions";
import { getInitials } from "@/lib/format";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import {
  canAccessGlobalAdmin,
  canManageCustomers,
  canManageMembers,
  canManageSettings,
  canViewCatalog,
  canViewDeliveries,
  canViewKds,
  canViewLiveTracking,
  canViewOrders,
  canViewPaymentsAudit,
} from "@/lib/permissions";
import { useSessionTenant } from "./SessionTenantProvider";

export interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { user, activeTenant, activeRole, systemRole } = useSessionTenant();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction("/");
    });
  };

  const tenantNavItems: NavItem[] = [];
  if (activeTenant) {
    tenantNavItems.push({
      label: "Inicio",
      href: "/dashboard",
      icon: "dashboard",
      exact: true,
    });

    if (canViewOrders(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Pedidos",
        href: "/orders",
        icon: "receipt_long",
        exact: true,
      });
    }

    if (canViewKds(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Cocina KDS",
        href: "/orders/kds",
        icon: "skillet",
      });
    }

    if (canViewDeliveries(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Mis Entregas",
        href: "/orders/deliveries",
        icon: "two_wheeler",
      });
    }

    if (canViewLiveTracking(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Tracking Vivo",
        href: "/tracking",
        icon: "location_on",
      });
    }

    if (canViewCatalog(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Catálogo",
        href: "/catalog",
        icon: "restaurant_menu",
      });
    }

    if (canManageMembers(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Equipo",
        href: "/employees",
        icon: "badge",
      });
    }

    if (canManageCustomers(activeRole, systemRole)) {
      tenantNavItems.push({
        label: "Clientes",
        href: "/customers",
        icon: "group",
      });
    }

    if (activeRole === "OWNER" || systemRole === "SUPERADMIN") {
      tenantNavItems.push({
        label: "Suscripción",
        href: "/dashboard/subscription",
        icon: "credit_card",
      });
    }

    if (
      canManageSettings(activeRole, systemRole) ||
      canViewPaymentsAudit(activeRole, systemRole)
    ) {
      tenantNavItems.push({
        label: "Configuración",
        href: "/dashboard/settings",
        icon: "settings",
      });
    }

    tenantNavItems.push({
      label: "Ver Storefront",
      href: `/store/${activeTenant.slug}`,
      icon: "storefront",
    });
  }

  const adminNavItems: NavItem[] = canAccessGlobalAdmin(systemRole)
    ? [
        {
          label: "Usuarios",
          href: "/admin/users",
          icon: "manage_accounts",
        },
        {
          label: "Planes SaaS",
          href: "/admin/plans",
          icon: "workspace_premium",
        },
      ]
    : [];

  const generalNavItems: NavItem[] = [
    {
      label: "Mi Cuenta",
      href: "/account",
      icon: "person",
    },
    ...(!activeTenant && user.staffMemberships.length === 0
      ? [
          {
            label: "Crear restaurante",
            href: "/onboarding",
            icon: "add_business",
          },
        ]
      : []),
    {
      label: "Ir al Storefront",
      href: "/store",
      icon: "store",
      exact: true,
    },
  ];

  const isRouteActive = (item: NavItem) => {
    if (!pathname) return false;
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const roleDisplay = activeRole
    ? TENANT_STAFF_ROLE_META[activeRole].label
    : systemRole === "SUPERADMIN"
      ? "Superadmin"
      : "Usuario";

  const renderNavSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          {title}
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isRouteActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                    active
                      ? "bg-primary text-on-primary shadow-level-1"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    fill={active}
                    className="shrink-0"
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside className="h-full flex flex-col justify-between w-64 bg-surface-card border-r border-outline-variant/60">
      {/* Top Header */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-outline-variant/50 flex items-center justify-between gap-2">
          <Link
            href={activeTenant ? "/dashboard" : systemRole === "SUPERADMIN" ? "/admin/users" : "/onboarding"}
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            {activeTenant?.logoUrl ? (
              <Image
                src={activeTenant.logoUrl}
                alt={`Logo de ${activeTenant.name}`}
                width={40}
                height={40}
                unoptimized
                className="w-10 h-10 rounded-xl object-cover border border-outline-variant/60 bg-surface-container-low shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-level-1 shrink-0">
                <Icon name="restaurant" size={22} />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-base font-extrabold tracking-tight text-on-surface block leading-tight truncate">
                {activeTenant?.name ?? "NexoFood"}
              </span>
              <span className="text-xs font-semibold text-on-surface-variant block truncate">
                {activeTenant ? `/${activeTenant.slug}` : "Panel SaaS"}
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Cerrar menú de navegación"
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav
          aria-label="Menú principal"
          className="flex-1 overflow-y-auto p-3"
        >
          {renderNavSection("Restaurante", tenantNavItems)}
          {renderNavSection("Plataforma", adminNavItems)}
          {renderNavSection("Cuenta", generalNavItems)}
        </nav>
      </div>

      {/* Bottom User Card + Logout */}
      <div className="p-3 border-t border-outline-variant/50 bg-surface-container-low/40">
        <div className="p-2.5 rounded-xl bg-surface-card border border-outline-variant/50 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-mint-subtle text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary-fixed-dim/50">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-on-surface truncate">
                {user.fullName}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                {user.email}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Badge variant="primary" size="sm">
              {roleDisplay}
            </Badge>
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {systemRole}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-error hover:bg-error-container/40 hover:text-on-error-container transition-colors w-full cursor-pointer disabled:opacity-60"
        >
          <Icon name="logout" size={18} />
          <span>{isPending ? "Cerrando sesión..." : "Cerrar sesión"}</span>
        </button>
        <LegalLinks className="mt-2 px-3 text-[11px] text-on-surface-variant" />
      </div>
    </aside>
  );
}
