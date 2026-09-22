"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface SidebarProps {
  onCloseMobile?: () => void;
}

const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    label: "Pedidos y Comandas",
    href: "/orders",
    icon: "receipt_long",
  },
  {
    label: "Inventario & Auditoría",
    href: "/inventory",
    icon: "inventory_2",
  },
  {
    label: "Empleados & Equipo",
    href: "/employees",
    icon: "badge",
  },
  {
    label: "Catálogo & Menú",
    href: "/catalog",
    icon: "restaurant_menu",
  },
  {
    label: "Configuración",
    href: "/settings",
    icon: "settings",
  },
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-full flex flex-col justify-between w-64 bg-surface-card border-r border-outline-variant/50 select-none">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">restaurant</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-on-surface block leading-tight">
                Nexo<span className="text-primary">Food</span>
              </span>
              <span className="text-[10px] font-semibold text-outline uppercase tracking-wider block">
                Sede Central
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Quick CTA */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/orders"
            onClick={onCloseMobile}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary-accent hover:bg-secondary text-white font-semibold text-sm shadow-cta transition-all hover:translate-y-[-1px] active:translate-y-0"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Nuevo Pedido</span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="p-3 flex flex-col gap-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-outline/70 uppercase tracking-wider">
            Menú Principal
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User & Dev Mode Card */}
      <div className="p-3 border-t border-outline-variant/40">
        <div className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
              MG
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">Madrid Gourmet</p>
              <p className="text-[11px] text-outline truncate">admin@nexofood.pe</p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-outline hover:text-error hover:bg-error-container/20 transition-colors w-full"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Salir al inicio</span>
        </Link>
      </div>
    </aside>
  );
}
