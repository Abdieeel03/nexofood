"use client";

import React from "react";

export type OrderChannel = "all" | "dine_in" | "delivery" | "takeaway";

interface ChannelFiltersProps {
  selectedChannel: OrderChannel;
  onSelectChannel: (channel: OrderChannel) => void;
  counts?: Record<OrderChannel, number>;
}

export function ChannelFilters({
  selectedChannel,
  onSelectChannel,
  counts = { all: 0, dine_in: 0, delivery: 0, takeaway: 0 },
}: ChannelFiltersProps) {
  const channels: { id: OrderChannel; label: string; icon: string }[] = [
    { id: "all", label: "Todos los Canales", icon: "density_medium" },
    { id: "dine_in", label: "Salón / Mesas", icon: "table_restaurant" },
    { id: "delivery", label: "Delivery Apps", icon: "delivery_dining" },
    { id: "takeaway", label: "Para Llevar", icon: "takeout_dining" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {channels.map((ch) => {
        const isSelected = selectedChannel === ch.id;
        const count = counts[ch.id] || 0;

        return (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-card border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-base">{ch.icon}</span>
            <span>{ch.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                isSelected ? "bg-white/20 text-white" : "bg-surface-container text-outline"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
