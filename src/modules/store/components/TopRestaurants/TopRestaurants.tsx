import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Restaurant } from "../../schemas/store.chema";

type TopRestaurantsProps = {
  restaurants: Restaurant[];
};

export const TopRestaurants: React.FC<TopRestaurantsProps> = ({ restaurants }) => {
  if (restaurants.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-2xl font-extrabold text-on-surface mb-4 tracking-tight">
        <Icon name="local_fire_department" size={28} fill className="text-secondary-container" />
        ¡Los más elegidos!
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {restaurants.map((res) => (
          <Link
            href={`/store/restaurant/${res.id}`}
            key={res.id}
            className="group flex items-center gap-3 bg-white rounded-2xl border border-border-subtle shadow-level-1 p-3 hover:shadow-level-2 hover:-translate-y-0.5 hover:border-primary-container/60 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 shrink-0 rounded-full bg-white border-2 border-mint-subtle group-hover:border-primary-container overflow-hidden flex items-center justify-center p-1 transition-colors">
              {res.logo ? (
                <img src={res.logo} alt={res.name} className="w-full h-full object-contain rounded-full" />
              ) : (
                <span className="font-extrabold text-primary text-xl">{res.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                {res.name}
              </p>
              <p className="text-xs font-semibold text-secondary flex items-center gap-0.5">
                <Icon name="bolt" size={14} fill /> Popular
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};