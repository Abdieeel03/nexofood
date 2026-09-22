import React from "react";

export function CriticalAlertsEmpty() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Alerta Stock Crítico */}
      <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-5 shadow-xs flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-on-surface">
              Niveles de Stock Crítico
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 alertas
            </span>
          </div>
          <p className="text-xs text-outline mt-1 leading-relaxed">
            Todos los insumos se encuentran dentro de sus niveles mínimos de reposición o aún no has registrado stock.
          </p>
        </div>
      </div>

      {/* Alerta Lotes Perecibles / Vencimientos */}
      <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-5 shadow-xs flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">event_available</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-on-surface">
              Próximos a Vencer (48h - 7 días)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              0 lotes
            </span>
          </div>
          <p className="text-xs text-outline mt-1 leading-relaxed">
            No se detectan lotes de lácteos, carnes o verduras próximos a caducar en los próximos días.
          </p>
        </div>
      </div>
    </div>
  );
}
