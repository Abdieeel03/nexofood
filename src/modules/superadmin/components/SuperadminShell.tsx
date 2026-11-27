"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/Icon";
import { getInitials } from "@/lib/format";
import { NotificationBell } from "@/modules/notifications";
import { storeKeys } from "@/modules/store/queries/keys";
import { useSuperadmin } from "../context/SuperadminContext";

interface SuperadminNavItem {
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

const NAV_ITEMS: SuperadminNavItem[] = [
  { label: "Resumen", href: "/superadmin", icon: "space_dashboard", exact: true },
  { label: "Usuarios", href: "/superadmin/users", icon: "manage_accounts" },
  { label: "Planes SaaS", href: "/superadmin/plans", icon: "workspace_premium" },
  { label: "Restaurantes", href: "/superadmin/tenants", icon: "storefront" },
  { label: "Sistema", href: "/superadmin/system", icon: "monitoring" },
];

const ROUTE_TITLES: Array<{
  match: string;
  exact?: boolean;
  title: string;
  section: string;
}> = [
  {
    match: "/superadmin",
    exact: true,
    title: "Resumen de plataforma",
    section: "Consola Global",
  },
  {
    match: "/superadmin/users",
    title: "Usuarios globales",
    section: "Identidad y Accesos",
  },
  {
    match: "/superadmin/plans",
    title: "Planes SaaS",
    section: "Monetización",
  },
  {
    match: "/superadmin/tenants",
    title: "Restaurantes y Tenants",
    section: "Supervisión Multi-Tenant",
  },
  {
    match: "/superadmin/system",
    title: "Salud del sistema",
    section: "Spring Boot Actuator",
  },
];

function getRouteMeta(pathname: string | null) {
  if (!pathname) {
    return ROUTE_TITLES[0];
  }
  const found = ROUTE_TITLES.find((item) =>
    item.exact
      ? pathname === item.match
      : pathname === item.match || pathname.startsWith(`${item.match}/`)
  );
  return found ?? ROUTE_TITLES[0];
}

function SidebarContent({
  onCloseMobile,
}: {
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { user } = useSuperadmin();

  const userMenuTriggerId = useId();
  const userMenuPopoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<PopoverElement>(null);
  const menuGroupRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const enterOnOpenRef = useRef<"first" | "last" | null>(null);
  const pointerPressedRef = useRef(false);

  const isRouteActive = (item: SuperadminNavItem) => {
    if (!pathname) return false;
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

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
    const popoverHeight = popover.offsetHeight || 110;
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
      if (
        popover &&
        typeof popover.hidePopover === "function" &&
        isPopoverCurrentlyOpen()
      ) {
        popover.hidePopover();
      } else {
        setIsUserMenuOpen(false);
      }
    },
    [isPopoverCurrentlyOpen]
  );

  useEffect(() => {
    const group = menuGroupRef.current;
    if (!group) return;
    const hasNativeFocusGroup =
      typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;

    if (!hasNativeFocusGroup) {
      group.setAttribute("role", "menu");
      group
        .querySelectorAll("a[href]:not([role]), button:not([role])")
        .forEach((item) => {
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
        const target =
          event.key === "Home" ? items[0] : items[items.length - 1];
        target?.focus({ preventScroll: true });
        return;
      }

      if (
        !hasNativeFocusGroup &&
        (event.key === "ArrowDown" || event.key === "ArrowUp")
      ) {
        const items = getEnabledMenuItems();
        if (items.length === 0) return;
        const currentIndex = items.indexOf(
          document.activeElement as HTMLElement
        );
        const nextIndex =
          currentIndex < 0
            ? event.key === "ArrowUp"
              ? items.length - 1
              : 0
            : (currentIndex +
                (event.key === "ArrowUp" ? -1 : 1) +
                items.length) %
              items.length;
        event.preventDefault();
        event.stopImmediatePropagation();
        items[nextIndex]?.focus({ preventScroll: true });
      }
    };

    group.addEventListener("keydown", handleKeyDown, true);
    return () => group.removeEventListener("keydown", handleKeyDown, true);
  }, [closeUserMenu, getEnabledMenuItems]);

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

  const handleTriggerPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
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
        closeUserMenu({
          restoreFocus: true,
          fromPointer: !isKeyboardActivation,
        });
      } else if (typeof popover.showPopover === "function") {
        popover.showPopover({ source: trigger });
      }
    }
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => {
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

  return (
    <aside className="h-full w-64 flex flex-col justify-between bg-inverse-surface text-inverse-on-surface border-r border-white/10">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <Link
            href="/superadmin"
            onClick={onCloseMobile}
            className="flex items-center gap-3 min-w-0"
          >
            <Image
              src="/images/nexofood-logo.png"
              alt="Logo de NexoFood"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-contain shadow-level-1 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-base font-extrabold tracking-tight text-inverse-on-surface block leading-tight truncate">
                NexoFood
              </span>
              <span className="text-xs font-semibold text-inverse-primary block truncate">
                Consola Superadmin
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Cerrar menú de navegación"
              className="lg:hidden p-2 text-inverse-on-surface/80 hover:text-inverse-on-surface rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          )}
        </div>

        <nav
          aria-label="Navegación de Superadmin"
          className="flex-1 overflow-y-auto p-3"
        >
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-bold text-inverse-on-surface/65 uppercase tracking-wider">
            Plataforma
          </p>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
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
                        : "text-inverse-on-surface/85 hover:bg-white/10 hover:text-inverse-on-surface"
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
        </nav>
      </div>

      {/* Bottom Collapsible User Menu Trigger + Popover */}
      <div className="p-3 border-t border-white/10 bg-black/15">
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
              ? "bg-white/10 border-inverse-primary shadow-level-1"
              : "bg-white/5 border-white/10 hover:border-inverse-primary/60 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center text-xs shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-inverse-on-surface truncate">
                {user.fullName}
              </p>
              <p className="text-[11px] text-inverse-on-surface/75 truncate">
                {user.email}
              </p>
            </div>
            <Icon
              name={isUserMenuOpen ? "expand_more" : "expand_less"}
              size={18}
              className="text-inverse-on-surface/75 shrink-0"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/25 border border-inverse-primary/35 px-2.5 py-0.5 text-[11px] font-bold text-inverse-primary">
              <span
                className="h-1.5 w-1.5 rounded-full bg-inverse-primary"
                aria-hidden="true"
              />
              <span>SUPERADMIN</span>
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
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="person" size={18} className="text-primary shrink-0" />
              <span className="truncate">Mi Cuenta</span>
            </Link>

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

export function SuperadminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const routeMeta = getRouteMeta(pathname);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen flex bg-surface-base antialiased text-on-surface">
      <a
        href="#superadmin-main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-xl focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-bold focus-visible:text-on-primary focus-visible:shadow-level-2"
      >
        Ir al contenido principal
      </a>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-inverse-surface-dark/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        aria-hidden={!mobileSidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:hidden ${
          mobileSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        {mobileSidebarOpen && (
          <SidebarContent onCloseMobile={() => setMobileSidebarOpen(false)} />
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-16 bg-surface-card/95 backdrop-blur-md border-b border-outline-variant/60 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={mobileSidebarOpen}
              className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            >
              <Icon name="menu" size={22} />
            </button>

            <nav aria-label="Ruta actual" className="min-w-0">
              <ol className="flex items-center gap-1.5 text-sm min-w-0">
                <li className="hidden sm:inline font-semibold text-on-surface-variant truncate">
                  Superadmin
                </li>
                <li
                  aria-hidden="true"
                  className="hidden sm:inline text-outline-variant"
                >
                  /
                </li>
                <li className="font-bold text-on-surface truncate">
                  {routeMeta.title}
                </li>
              </ol>
              <p className="text-xs text-on-surface-variant hidden sm:block truncate">
                {routeMeta.section}
              </p>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-fixed-dim bg-mint-subtle px-2.5 py-1 text-xs font-bold text-on-primary-fixed">
              <Icon name="verified_user" size={14} className="text-primary" />
              <span>SUPERADMIN</span>
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-outline-variant/80 bg-surface-card text-xs sm:text-sm font-bold text-on-surface hover:border-primary hover:text-primary hover:bg-mint-subtle/40 transition-colors shrink-0"
            >
              <Icon name="store" size={18} className="text-primary shrink-0" />
              <span>Ir al Backoffice</span>
            </Link>
            <NotificationBell centerHref="/notifications" />
          </div>
        </header>

        <main
          id="superadmin-main-content"
          tabIndex={-1}
          className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] w-full mx-auto focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
