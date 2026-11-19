"use client";

import React, { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/Icon";
import { logoutAction } from "@/lib/auth-actions";
import { useStoreUi } from "@/stores/store-ui.store";
import { useActiveStoreSlug } from "../../hooks/use-active-store-slug";
import { storeKeys } from "../../queries/keys";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";
import { useStoreCartQuery } from "../../queries/use-store-cart-query";
import { useTenantBySlugQuery } from "../../queries/use-storefront-catalog-queries";
import { SideMenu } from "./components/SideMenu";
import { UserMenu } from "./components/UserMenu";

export const Header: React.FC = () => {
  const queryClient = useQueryClient();
  const activeSlug = useActiveStoreSlug();
  const openCart = useStoreUi((s) => s.openCart);
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const sideMenuId = useId();

  const { data: user, isLoading: isMeLoading } = useStoreMeQuery();
  const { data: tenant } = useTenantBySlugQuery(activeSlug);
  const { data: cart } = useStoreCartQuery(activeSlug, Boolean(user));

  const cartCount =
    user && activeSlug && cart
      ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;

  const handleLogout = () => {
    const redirectTo = activeSlug
      ? `/store/${encodeURIComponent(activeSlug)}`
      : "/store";
    startLogoutTransition(async () => {
      queryClient.setQueryData(storeKeys.me, null);
      queryClient.removeQueries({ queryKey: ["store"] });
      queryClient.removeQueries({ queryKey: storeKeys.addresses });
      await logoutAction(redirectTo);
    });
  };

  return (
    <>
      <SideMenu
        id={sideMenuId}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user ?? null}
        activeSlug={activeSlug}
        isLoggingOut={isLoggingOut}
        onOpenAuth={() => {
          if (activeSlug) openAuthDialog(activeSlug, "login");
        }}
        onLogout={handleLogout}
      />

      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={isMenuOpen}
              aria-controls={sideMenuId}
              className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              href="/store"
              className="flex items-center gap-1.5 text-xl font-extrabold text-primary tracking-tight hover:opacity-90 transition-opacity shrink-0"
            >
              <span>NexoFood</span>
              <span className="text-secondary-container flex items-center">
                <Icon name="restaurant" size={22} fill />
              </span>
            </Link>

            {activeSlug && (
              <div className="hidden sm:flex items-center gap-2 min-w-0 pl-2 border-l border-outline-variant/60">
                <Link
                  href={`/store/${encodeURIComponent(activeSlug)}`}
                  className="text-sm font-bold text-on-surface hover:text-primary truncate max-w-[220px] transition-colors"
                >
                  {tenant?.name ?? activeSlug}
                </Link>
              </div>
            )}
          </div>

          <nav
            aria-label="Navegación de tienda"
            className="hidden lg:flex items-center gap-1"
          >
            <Link
              href="/store"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
            >
              Buscar tienda
            </Link>
            {activeSlug && (
              <Link
                href={`/store/${encodeURIComponent(activeSlug)}`}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
              >
                Menú
              </Link>
            )}
            {activeSlug && user && (
              <Link
                href={`/store/${encodeURIComponent(activeSlug)}/orders`}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
              >
                Mis pedidos
              </Link>
            )}
            {user && (
              <Link
                href="/store/account"
                className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
              >
                Mi cuenta
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            {isMeLoading ? (
              <div
                aria-hidden="true"
                className="h-9 w-28 rounded-full bg-surface-container animate-pulse"
              />
            ) : user ? (
              <UserMenu
                user={user}
                activeSlug={activeSlug}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
            ) : activeSlug ? (
              <button
                type="button"
                onClick={() => openAuthDialog(activeSlug, "login")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors cursor-pointer"
              >
                <Icon name="login" size={18} />
                <span>Iniciar sesión</span>
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant bg-surface-card text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="login" size={18} />
                <span>Iniciar sesión</span>
              </Link>
            )}

            {activeSlug && (
              <button
                type="button"
                onClick={openCart}
                aria-label={
                  cartCount > 0
                    ? `Abrir carrito, ${cartCount} productos`
                    : "Abrir carrito"
                }
                className="relative inline-flex items-center justify-center w-11 h-11 rounded-full border border-outline-variant/70 bg-surface-card text-on-surface hover:border-primary hover:bg-mint-subtle/50 transition-colors cursor-pointer"
              >
                <Icon name="shopping_cart" size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary-container text-on-secondary text-[11px] font-extrabold tabular-nums flex items-center justify-center border-2 border-surface-card">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
