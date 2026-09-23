import React from "react";
import { Icon } from "@/components/ui/Icon";
import type { Restaurant } from "../../schemas/store.chema";
import { RestaurantCard } from "./components/RestaurantCard";

type RestaurantGridProps = {
  restaurants: Restaurant[];
};

export const RestaurantGrid: React.FC<RestaurantGridProps> = ({ restaurants }) => {
  return (
    <section className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">Restaurantes cerca de ti</h3>
        <span className="bg-primary-container/15 text-primary text-sm font-bold px-3 py-1 rounded-lg">
          {restaurants.length}
        </span>
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-subtle py-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <Icon name="search_off" size={40} className="text-primary" />
          <p className="font-semibold">No encontramos locales con esos filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-5">
            {restaurants.map((res, i) => (
            <RestaurantCard key={res.id} restaurant={res} index={i} />
        ))}
        </div>
      )}
    </section>
  );
};