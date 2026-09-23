import React from "react";
import { Icon } from "@/components/ui/Icon";
import type { MenuSection, Restaurant } from "../../../schemas/store.chema";

type RestaurantSidebarProps = {
  restaurant: Restaurant;
  sections: Pick<MenuSection, "id" | "title">[];
  activeSectionId: string;
};

export const RestaurantSidebar: React.FC<RestaurantSidebarProps> = ({ restaurant: res, sections, activeSectionId }) => {
  return (
    <aside className="lg:sticky lg:top-20 self-start flex flex-col gap-4">
      {/* Tarjeta del restaurante */}
      <div className="bg-white rounded-2xl border border-border-subtle shadow-level-1 overflow-hidden">
        <div className="relative h-36 bg-surface-container">
          <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        </div>

        <div className="px-5 pb-5">
          <div className="relative -mt-9 mb-3 w-[72px] h-[72px] rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
            {res.logo ? (
              <img src={res.logo} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="font-extrabold text-primary text-2xl">{res.name.charAt(0)}</span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight leading-tight">{res.name}</h1>
          <span className="inline-block mt-2 bg-mint-subtle text-primary text-xs font-bold px-3 py-1 rounded-lg">
            {res.category}
          </span>

          <dl className="mt-4 rounded-xl border border-border-subtle overflow-hidden text-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <dt className="flex items-center gap-1.5 text-on-surface-variant">
                <Icon name="schedule" size={18} className="text-primary" /> Delivery
              </dt>
              <dd className="font-bold text-on-surface">{res.deliveryTime}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-mint-subtle border-y border-border-subtle">
              <dt className="flex items-center gap-1.5 text-on-surface-variant">
                <Icon name="two_wheeler" size={18} className="text-primary" /> Envío
              </dt>
              <dd className="font-bold text-primary">{res.deliveryFee}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <dt className="flex items-center gap-1.5 text-on-surface-variant">
                <Icon name="star" size={18} fill className="text-amber-500" /> Calificación
              </dt>
              <dd className="font-bold text-on-surface">{res.rating}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Navegación por secciones: lista en desktop, chips en móvil */}
      <nav className="hidden lg:flex flex-col bg-white rounded-2xl border border-border-subtle shadow-level-1 p-2" aria-label="Secciones del menú">
        {sections.map((section) => {
          const active = section.id === activeSectionId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                active ? "bg-mint-subtle text-primary font-bold" : "text-on-surface font-semibold hover:bg-surface-container-low"
              }`}
            >
              {section.title}
              <Icon name="chevron_right" size={18} className={active ? "text-primary" : "text-on-surface-variant"} />
            </a>
          );
        })}
      </nav>

      <nav className="lg:hidden flex gap-2 overflow-x-auto hide-scrollbar" aria-label="Secciones del menú">
        {sections.map((section) => {
          const active = section.id === activeSectionId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`shrink-0 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                active ? "bg-primary text-white border-primary" : "bg-white text-on-surface border-outline-variant"
              }`}
            >
              {section.title}
            </a>
          );
        })}
      </nav>
    </aside>
  );
};