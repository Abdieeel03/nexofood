import React from "react";

export function OrderVolumeChartEmpty() {
  const hours = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  return (
    <div className="bg-surface-card rounded-3xl border border-outline-variant/60 p-6 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-on-surface">
            Volumen de comandas por hora
          </h3>
          <p className="text-xs text-outline mt-0.5">
            Distribución de carga de pedidos en la jornada
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-outline">
          Hoy
        </span>
      </div>

      {/* Visual Chart Placeholder with faint axes */}
      <div className="relative py-6 flex flex-col justify-end min-h-[190px]">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-outline-variant/60 w-full" />
          <div className="border-b border-dashed border-outline-variant/60 w-full" />
          <div className="border-b border-dashed border-outline-variant/60 w-full" />
          <div className="border-b border-outline-variant/80 w-full" />
        </div>

        {/* Empty ghost bars */}
        <div className="relative z-10 flex items-end justify-between gap-2 h-32 px-2">
          {hours.map((hour, idx) => (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className="w-full max-w-[28px] rounded-t-lg bg-surface-container/60 border-t-2 border-dashed border-outline-variant/60 transition-all"
                style={{ height: `${12 + (idx % 3) * 6}%` }}
              />
            </div>
          ))}
        </div>

        {/* Centered Empty Notice */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-card/75 backdrop-blur-[1px] rounded-2xl z-20">
          <span className="material-symbols-outlined text-outline text-3xl mb-1 opacity-60">
            bar_chart
          </span>
          <p className="text-xs font-semibold text-on-surface">
            Aún no hay datos de volumen
          </p>
          <p className="text-[11px] text-outline text-center max-w-[220px] mt-0.5">
            Las barras se actualizarán con las comandas de cada hora.
          </p>
        </div>
      </div>

      {/* X Axis Labels */}
      <div className="flex items-center justify-between text-[10px] font-semibold text-outline px-2 pt-2 border-t border-outline-variant/30">
        <span>12:00</span>
        <span>14:00</span>
        <span>16:00</span>
        <span>18:00</span>
        <span>20:00</span>
      </div>
    </div>
  );
}
