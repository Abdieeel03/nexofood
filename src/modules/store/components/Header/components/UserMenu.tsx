"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getInitials } from "@/lib/format";
import type { UserProfileResponse } from "@/schemas/auth.schema";

interface UserMenuProps {
  user: UserProfileResponse;
  activeSlug: string | null;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  activeSlug,
  isLoggingOut,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initials = getInitials(user.fullName);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Menú de usuario: ${user.fullName}`}
        className="inline-flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-full bg-mint-subtle text-primary border border-primary-fixed-dim/70 hover:border-primary transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shrink-0">
          {initials}
        </span>
        <span className="hidden sm:inline text-sm font-bold text-on-surface max-w-[140px] truncate">
          {user.fullName}
        </span>
        <Icon
          name={isOpen ? "expand_less" : "expand_more"}
          size={18}
          className="text-on-surface-variant"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-surface-card rounded-2xl shadow-level-3 border border-outline-variant/60 py-2 z-50"
        >
          <div className="px-4 py-3 border-b border-outline-variant/40">
            <p className="font-bold text-sm text-on-surface truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-on-surface-variant truncate">
              {user.email}
            </p>
          </div>

          <div className="p-1.5 flex flex-col gap-0.5">
            {activeSlug && (
              <Link
                href={`/store/${encodeURIComponent(activeSlug)}/orders`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
              >
                <Icon name="receipt_long" size={18} className="text-primary" />
                <span>Mis pedidos</span>
              </Link>
            )}

            <Link
              href={
                activeSlug
                  ? `/store/${encodeURIComponent(activeSlug)}/account`
                  : "/store/account"
              }
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
            >
              <Icon name="person" size={18} className="text-primary" />
              <span>Mi cuenta</span>
            </Link>

            {(user.staffMemberships.length > 0 ||
              user.systemRole === "SUPERADMIN") && (
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-mint-subtle hover:text-primary transition-colors"
              >
                <Icon name="storefront" size={18} className="text-primary" />
                <span>Panel SaaS</span>
              </Link>
            )}
          </div>

          <div className="px-1.5 pt-1.5 border-t border-outline-variant/40">
            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut}
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error-container/50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Icon name="logout" size={18} />
              <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
