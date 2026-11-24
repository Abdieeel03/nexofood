"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getInitials } from "@/lib/format";
import type { UserProfileResponse } from "@/schemas/auth.schema";

interface SideMenuProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileResponse | null;
  activeSlug: string | null;
  isLoggingOut: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  id,
  isOpen,
  onClose,
  user,
  activeSlug,
  isLoggingOut,
  onOpenAuth,
  onLogout,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (isOpen) onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Menú de navegación"
      onClick={handleBackdropClick}
      className="fixed inset-0 m-0 p-0 border-0 bg-transparent w-screen h-dvh max-w-none max-h-none overflow-hidden"
    >
      <aside
        ref={sheetRef}
        className="h-full w-[min(21rem,85vw)] bg-surface-card text-on-surface shadow-level-3 flex flex-col border-r border-outline-variant/60"
      >
        <div className="p-5 bg-primary text-on-primary flex items-center justify-between gap-3">
          {user ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white/20 font-extrabold text-sm flex items-center justify-center shrink-0">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{user.fullName}</p>
                <p className="text-xs text-white/85 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Icon name="restaurant" size={24} fill />
              <span className="font-extrabold text-lg tracking-tight">
                NexoFood
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="p-2 rounded-lg text-on-primary hover:bg-white/15 transition-colors cursor-pointer shrink-0"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
          <ul className="flex flex-col gap-1 px-3">
            <li>
              <Link
                href="/store"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
              >
                <Icon name="search" size={20} className="text-primary" />
                <span>Buscar restaurante</span>
              </Link>
            </li>

            {activeSlug && (
              <li>
                <Link
                  href={`/store/${encodeURIComponent(activeSlug)}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
                >
                  <Icon
                    name="restaurant_menu"
                    size={20}
                    className="text-primary"
                  />
                  <span>Menú del restaurante</span>
                </Link>
              </li>
            )}

            {activeSlug && user && (
              <li>
                <Link
                  href={`/store/${encodeURIComponent(activeSlug)}/orders`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
                >
                  <Icon
                    name="receipt_long"
                    size={20}
                    className="text-primary"
                  />
                  <span>Mis pedidos</span>
                </Link>
              </li>
            )}

            {user && (
              <li>
                <Link
                  href={
                    activeSlug
                      ? `/store/${encodeURIComponent(activeSlug)}/account`
                      : "/store/account"
                  }
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
                >
                  <Icon name="person" size={20} className="text-primary" />
                  <span>Mi cuenta</span>
                </Link>
              </li>
            )}

            <li className="pt-2 mt-2 border-t border-outline-variant/40">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <Icon name="storefront" size={20} className="text-primary" />
                <span>Panel SaaS para restaurantes</span>
              </Link>
            </li>
          </ul>

          <div className="p-4 border-t border-outline-variant/40">
            {user ? (
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm text-error bg-error-container/40 hover:bg-error-container/70 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <Icon name="logout" size={18} />
                <span>
                  {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </span>
              </button>
            ) : activeSlug ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-secondary-container text-on-secondary hover:bg-secondary-accent transition-colors cursor-pointer"
              >
                <Icon name="login" size={18} />
                <span>Iniciar sesión</span>
              </button>
            ) : (
              <Link
                href="/"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors"
              >
                <Icon name="login" size={18} />
                <span>Iniciar sesión</span>
              </Link>
            )}
          </div>
        </nav>
      </aside>
    </dialog>
  );
};
