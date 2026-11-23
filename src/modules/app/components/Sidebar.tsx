"use client";

import React, { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { getInitials } from "@/lib/format";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import { storeKeys } from "@/modules/store/queries/keys";
import {
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

type PopoverElement = HTMLDivElement & {
  showPopover?: (options?: { source?: HTMLElement }) => void;
  hidePopover?: () => void;
};

function focusWithoutRing(element: HTMLElement | null) {
  if (!element) return;
  element.focus({
    preventScroll: true,
    focusVisible: false,
  } as FocusOptions);
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { user, activeTenant, activeRole, systemRole } = useSessionTenant();

  const userMenuTriggerId = useId();
  const userMenuPopoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<PopoverElement>(null);
  const menuGroupRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const enterOnOpenRef = useRef<"first" | "last" | null>(null);
  const pointerPressedRef = useRef(false);

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch {
        // Redirigir aunque falle la petición
      }
      queryClient.setQueryData(storeKeys.me, null);
      queryClient.removeQueries({ queryKey: ["store"] });
      queryClient.removeQueries({ queryKey: storeKeys.addresses });
      queryClient.clear();
      router.replace("/");
      router.refresh();
    });
  };

  const getEnabledMenuItems = useCallback((): HTMLElement[] => {
    const group = menuGroupRef.current;
    if (!group) return [];
    return Array.from(group.querySelectorAll<HTMLElement>("a[href], button")).filter(
      (item) =>
        !(item instanceof HTMLButtonElement && item.disabled) &&
        item.getAttribute("aria-disabled") !== "true"
    );
  }, []);

  const isPopoverCurrentlyOpen = useCallback(() => {
    const popover = popoverRef.current;
    if (!popover) return false;
    try {
      return popover.matches(":popover-open");
    } catch {
      return isUserMenuOpen;
    }
  }, [isUserMenuOpen]);

  const positionPopoverFallback = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    if (
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("position-area: block-start")
    ) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const popoverWidth = Math.max(triggerRect.width, popover.offsetWidth || 232);
    popover.style.minWidth = `${triggerRect.width}px`;
    const popoverHeight = popover.offsetHeight || 160;
    const gap = 8;
    const margin = 8;

    let top = triggerRect.top - popoverHeight - gap;
    if (top < margin) {
      top = Math.min(
        window.innerHeight - popoverHeight - margin,
        triggerRect.bottom + gap
      );
    }

    const left = Math.max(
      margin,
      Math.min(triggerRect.left, window.innerWidth - popoverWidth - margin)
    );

    popover.style.top = `${Math.max(margin, top)}px`;
    popover.style.left = `${left}px`;
  }, []);

  const closeUserMenu = useCallback(
    (options?: { restoreFocus?: boolean; fromPointer?: boolean }) => {
      const popover = popoverRef.current;
      const trigger = triggerRef.current;
      if (options?.restoreFocus && trigger) {
        if (options.fromPointer) {
          focusWithoutRing(trigger);
        } else {
          trigger.focus({ preventScroll: true });
        }
      }
      if (popover && typeof popover.hidePopover === "function" && isPopoverCurrentlyOpen()) {
        popover.hidePopover();
      } else {
        setIsUserMenuOpen(false);
      }
    },
    [isPopoverCurrentlyOpen]
  );

  // Fallback de roles ARIA y navegación por flechas cuando el navegador no soporta focusgroup nativo
  useEffect(() => {
    const group = menuGroupRef.current;
    if (!group) return;
    const hasNativeFocusGroup =
      typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;

    if (!hasNativeFocusGroup) {
      group.setAttribute("role", "menu");
      group.querySelectorAll("a[href]:not([role]), button:not([role])").forEach((item) => {
        item.setAttribute("role", "menuitem");
      });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeUserMenu({ restoreFocus: true, fromPointer: false });
        return;
      }

      if (event.key === "Tab") {
        closeUserMenu({ restoreFocus: false });
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        const items = getEnabledMenuItems();
        if (items.length === 0) return;
        event.preventDefault();
        const target = event.key === "Home" ? items[0] : items[items.length - 1];
        target?.focus({ preventScroll: true });
        return;
      }

      if (
        !hasNativeFocusGroup &&
        (event.key === "ArrowDown" || event.key === "ArrowUp")
      ) {
        const items = getEnabledMenuItems();
        if (items.length === 0) return;
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);
        const nextIndex =
          currentIndex < 0
            ? event.key === "ArrowUp"
              ? items.length - 1
              : 0
            : (currentIndex + (event.key === "ArrowUp" ? -1 : 1) + items.length) %
              items.length;
        event.preventDefault();
        event.stopImmediatePropagation();
        items[nextIndex]?.focus({ preventScroll: true });
      }
    };

    group.addEventListener("keydown", handleKeyDown, true);
    return () => group.removeEventListener("keydown", handleKeyDown, true);
  }, [closeUserMenu, getEnabledMenuItems, activeTenant, activeRole, systemRole]);

  // Sincronización de estado aria-expanded, enfoque al abrir y posicionamiento fallback en evento toggle
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      const open = toggleEvent.newState === "open";
      setIsUserMenuOpen(open);

      if (open) {
        positionPopoverFallback();
        const enterMode = enterOnOpenRef.current;
        enterOnOpenRef.current = null;

        if (enterMode) {
          const items = getEnabledMenuItems();
          const target =
            enterMode === "last" ? items[items.length - 1] : items[0];
          target?.focus({ preventScroll: true });
        } else if (pointerPressedRef.current) {
          focusWithoutRing(triggerRef.current);
        }
      }
      pointerPressedRef.current = false;
    };

    popover.addEventListener("toggle", handleToggle);
    return () => popover.removeEventListener("toggle", handleToggle);
  }, [getEnabledMenuItems, positionPopoverFallback]);

  // Cerrar el menú cuando el foco sale del sistema del menú
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      closeUserMenu({ restoreFocus: false });
    };

    const handleResize = () => positionPopoverFallback();

    document.addEventListener("focusin", handleFocusIn);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("resize", handleResize);
    };
  }, [isUserMenuOpen, closeUserMenu, positionPopoverFallback]);

  const handleTriggerPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    pointerPressedRef.current = true;
  };

  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isKeyboardActivation = event.detail === 0;
    const hasNativeInvoker =
      typeof HTMLButtonElement !== "undefined" &&
      "commandForElement" in HTMLButtonElement.prototype;

    if (isKeyboardActivation && !isPopoverCurrentlyOpen()) {
      enterOnOpenRef.current = "first";
      pointerPressedRef.current = false;
    }

    if (!hasNativeInvoker) {
      event.preventDefault();
      const popover = popoverRef.current;
      const trigger = triggerRef.current;
      if (!popover || !trigger) return;
      if (isPopoverCurrentlyOpen()) {
        closeUserMenu({ restoreFocus: true, fromPointer: !isKeyboardActivation });
      } else if (typeof popover.showPopover === "function") {
        popover.showPopover({ source: trigger });
      }
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    pointerPressedRef.current = false;

    if (isPopoverCurrentlyOpen()) {
      const items = getEnabledMenuItems();
      const target =
        event.key === "ArrowUp" ? items[items.length - 1] : items[0];
      target?.focus({ preventScroll: true });
      return;
    }

    enterOnOpenRef.current = event.key === "ArrowUp" ? "last" : "first";
    triggerRef.current?.click();
  };

  const handleMenuItemPointerMove = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    const item = event.currentTarget;
    if (document.activeElement !== item) {
      focusWithoutRing(item);
    }
  };

  const canAccessStoreSettings = Boolean(
    activeTenant &&
      (canManageSettings(activeRole, systemRole) ||
        canViewPaymentsAudit(activeRole, systemRole))
  );

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
  }

  const onboardingNavItems: NavItem[] =
    !activeTenant && user.staffMemberships.length === 0
      ? [
          {
            label: "Crear restaurante",
            href: "/onboarding",
            icon: "add_business",
          },
          {
            label: "Notificaciones e Invitaciones",
            href: "/notifications",
            icon: "notifications",
          },
        ]
      : [
          {
            label: "Notificaciones",
            href: "/notifications",
            icon: "notifications",
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

  const isAccountActive = pathname === "/account" || pathname?.startsWith("/account/");
  const isSettingsActive =
    pathname === "/dashboard/settings" ||
    pathname?.startsWith("/dashboard/settings/");

  return (
    <aside className="h-full flex flex-col justify-between w-64 bg-surface-card border-r border-outline-variant/60">
      {/* Top Header */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-outline-variant/50 flex items-center justify-between gap-2">
          <Link
            href={activeTenant ? "/dashboard" : systemRole === "SUPERADMIN" ? "/superadmin" : "/onboarding"}
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
          {renderNavSection(
            !activeTenant && user.staffMemberships.length === 0
              ? "Primeros pasos"
              : "Buzón Personal",
            onboardingNavItems
          )}
        </nav>
      </div>

      {/* Bottom User Menu Trigger + Popover */}
      <div className="p-3 border-t border-outline-variant/50 bg-surface-container-low/40">
        <button
          ref={triggerRef}
          id={userMenuTriggerId}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isUserMenuOpen}
          onPointerDown={handleTriggerPointerDown}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          {...({
            commandfor: userMenuPopoverId,
            command: "toggle-popover",
          } as Record<string, string>)}
          className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
            isUserMenuOpen
              ? "bg-mint-subtle/40 border-primary shadow-level-1"
              : "bg-surface-card border-outline-variant/50 hover:border-primary/60 hover:bg-surface-container-low/50"
          }`}
        >
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
            <Icon
              name={isUserMenuOpen ? "expand_more" : "expand_less"}
              size={18}
              className="text-on-surface-variant shrink-0"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Badge variant="primary" size="sm">
              {roleDisplay}
            </Badge>
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {systemRole}
            </span>
          </div>
        </button>

        <div
          ref={popoverRef}
          id={userMenuPopoverId}
          {...({ popover: "auto" } as Record<string, string>)}
          className="sidebar-user-popover w-[232px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-outline-variant/70 bg-surface-card p-1.5 shadow-level-3"
        >
          <div
            ref={menuGroupRef}
            aria-labelledby={userMenuTriggerId}
            {...({ focusgroup: "menu nomemory" } as Record<string, string>)}
            className="flex flex-col gap-0.5"
          >
            <Link
              href="/account"
              onPointerMove={handleMenuItemPointerMove}
              onClick={() => {
                closeUserMenu({ restoreFocus: false });
                onCloseMobile?.();
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                isAccountActive
                  ? "bg-mint-subtle text-primary font-bold"
                  : "text-on-surface hover:bg-mint-subtle hover:text-primary"
              }`}
            >
              <Icon name="person" size={18} className="text-primary shrink-0" />
              <span className="truncate">Mi Cuenta</span>
            </Link>

            {canAccessStoreSettings && (
              <Link
                href="/dashboard/settings"
                onPointerMove={handleMenuItemPointerMove}
                onClick={() => {
                  closeUserMenu({ restoreFocus: false });
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                  isSettingsActive
                    ? "bg-mint-subtle text-primary font-bold"
                    : "text-on-surface hover:bg-mint-subtle hover:text-primary"
                }`}
              >
                <Icon name="settings" size={18} className="text-primary shrink-0" />
                <span className="truncate">Configuración de store</span>
              </Link>
            )}

            <hr className="my-1 border-outline-variant/50" />

            <button
              type="button"
              disabled={isPending}
              onPointerMove={handleMenuItemPointerMove}
              onClick={(event) => {
                closeUserMenu({
                  restoreFocus: true,
                  fromPointer: event.detail !== 0,
                });
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error-container/50 hover:text-on-error-container transition-colors cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="logout" size={18} className="shrink-0" />
              <span className="truncate">
                {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
