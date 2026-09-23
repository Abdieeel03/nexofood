import React from "react";
import { Icon } from "@/components/ui/Icon";

const HERO_PHOTOS = [
  "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80",
];

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-primary-container to-emerald-400 px-6 md:px-10 py-6 flex items-center justify-between gap-6 text-white shadow-level-2">
      <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10" />
      <div className="absolute right-40 -bottom-20 w-52 h-52 rounded-full bg-white/10" />

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">Delivery en tu zona</p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">¿Qué se te antoja hoy?</h1>
        <p className="text-white/90 font-medium mt-1">Restaurantes cerca de ti, en la puerta de tu casa en minutos.</p>
      </div>

      <div className="relative hidden md:flex items-center gap-8">
        {/* Collage de platos */}
        <div className="hidden lg:flex -space-x-8">
          {HERO_PHOTOS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white/50 shadow-level-3"
              style={{ transform: `translateY(${i === 1 ? 6 : -4}px)` }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 bg-secondary-container rounded-xl px-5 py-3.5 shadow-cta">
          <Icon name="local_shipping" size={30} fill />
          <div className="leading-tight">
            <p className="font-extrabold text-lg">Envío gratis</p>
            <p className="text-xs font-semibold text-white/90">En tu primer pedido</p>
          </div>
        </div>
      </div>
    </section>
  );
};