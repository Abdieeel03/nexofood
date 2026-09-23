'use client'

import React, { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { MenuSection, Restaurant } from "../../schemas/store.chema";
import { useActiveSection } from "../../hooks/use-active-section";
import { RestaurantSidebar } from "./components/RestaurantSidebar";
import { MenuSectionBlock } from "./components/MenuSectionBlock";

type RestaurantDetailProps = {
  restaurant: Restaurant;
  menu: MenuSection[];
};

export const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant, menu }) => {
  const sectionIds = useMemo(() => menu.map((s) => s.id), [menu]);
  const activeSectionId = useActiveSection(sectionIds);
  const { promo } = restaurant;

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-sans">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
        <Link href="/store" className="hover:text-primary transition-colors">Inicio</Link>
        <Icon name="chevron_right" size={16} />
        <Link href="/store" className="hover:text-primary transition-colors">Restaurantes</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-on-surface">{restaurant.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        <RestaurantSidebar
          restaurant={restaurant}
          sections={menu.map(({ id, title }) => ({ id, title }))}
          activeSectionId={activeSectionId}
        />

        <div className="flex flex-col gap-8 min-w-0">
          {promo && (
            <div className="flex items-center gap-3 bg-tangerine-subtle border border-secondary-container/30 rounded-2xl px-5 py-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-secondary-container text-white flex items-center justify-center">
                <Icon name="sell" size={22} fill />
              </span>
              <div>
                <p className="font-extrabold text-on-surface">{promo.label}</p>
                <p className="text-xs font-medium text-on-surface-variant">
                  {promo.type === "free_shipping"
                    ? `Tus pedidos a ${restaurant.name} llegan sin costo de envío.`
                    : `Disfruta este beneficio en productos seleccionados de ${restaurant.name}.`}
                </p>
              </div>
            </div>
          )}

          {menu.map((section) => (
            <MenuSectionBlock
              key={section.id}
              section={section}
              restaurant={restaurant}
            />
          ))}
        </div>
      </div>
    </div>
  );
};