import React from "react";
import type { MenuSection } from "../../../schemas/store.chema";
import { MenuItemCard } from "./MenuItemCard";

type MenuSectionBlockProps = {
  section: MenuSection;
  fallbackImage: string;
  restaurantName: string;
};

export const MenuSectionBlock: React.FC<MenuSectionBlockProps> = ({ section, fallbackImage, restaurantName }) => {
  return (
    // scroll-mt: deja espacio para el header sticky al saltar con el ancla
    <section id={section.id} className="scroll-mt-24">
      <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-4">{section.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {section.items.map((item) => (
          <MenuItemCard key={item.id} item={item} fallbackImage={fallbackImage} restaurantName={restaurantName} />
        ))}
      </div>
    </section>
  );
};