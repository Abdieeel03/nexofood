import React from "react";

interface WelcomeBannerProps {
  restaurantName?: string;
  shiftName?: string;
}

export function WelcomeBanner({
  restaurantName = "Madrid Gourmet",
  shiftName = "Turno Principal Activo",
}: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary to-[#004f35] text-on-primary p-6 md:p-8 shadow-sm">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
      <div className="absolute bottom-0 right-40 w-48 h-48 bg-secondary-accent/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{shiftName}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ¡Hola, equipo de {restaurantName}!
          </h2>
          <p className="text-white/80 text-sm mt-1.5 max-w-xl leading-relaxed">
            Tu centro de control en tiempo real. Monitorea comandas activas, estado de stock y tiempos de entrega de hoy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
            <span className="block text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Cocina (KDS)
            </span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-emerald-300 text-base">check_circle</span>
              Conectado
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
            <span className="block text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Canales Apps
            </span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-emerald-300 text-base">sync</span>
              Sincronizado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
