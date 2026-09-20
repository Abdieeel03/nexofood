"use client";

import React, { useState } from "react";

interface TopbarProps {
  onOpenMobileSidebar?: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({
  onOpenMobileSidebar,
  title,
  subtitle,
  actions,
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-surface-card/90 backdrop-blur-md border-b border-outline-variant/40 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left section: mobile hamburger & breadcrumb/title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {title ? (
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold text-on-surface tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-outline hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-outline">
            <span>Sede Principal Madrid</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Servicio Activo
            </span>
          </div>
        )}
      </div>

      {/* Center/Search section */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar comanda, ingrediente o colaborador..."
            className="w-full bg-surface-container/60 border border-outline-variant/50 rounded-xl pl-9 pr-4 py-1.5 text-xs text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Right actions: contextual action + Dev Mode indicator + Notifications + User Avatar */}
      <div className="flex items-center gap-2 md:gap-3">
        {actions}

        {/* Dev Mode Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Modo Dev</span>
        </div>

        {/* Notifications Icon with popover state */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-outline-variant/40 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors relative"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary-accent rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-card rounded-2xl border border-outline-variant/50 shadow-lg p-4 z-50">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2 mb-3">
                <span className="text-xs font-bold text-on-surface">Notificaciones del Sistema</span>
                <span className="text-[10px] text-outline">0 nuevas</span>
              </div>
              <div className="py-6 text-center text-outline">
                <span className="material-symbols-outlined text-3xl mb-1 opacity-50">
                  notifications_paused
                </span>
                <p className="text-xs font-semibold text-on-surface">Sin notificaciones pendientes</p>
                <p className="text-[11px] mt-0.5">Te avisaremos sobre alertas de stock y retrasos en comandas.</p>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-xs">
            MG
          </div>
        </div>
      </div>
    </header>
  );
}
