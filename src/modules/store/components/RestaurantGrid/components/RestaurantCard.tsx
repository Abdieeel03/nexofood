import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Restaurant } from "../../../schemas/store.chema";

type RestaurantCardProps = {
  restaurant: Restaurant;
  index?: number; // para la animación escalonada de entrada
};

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant: res, index = 0 }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-border-subtle shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 hover:border-primary-container/60 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      <Link href={`/store/restaurant/${res.id}`} className="flex flex-col flex-1 cursor-pointer">
        <div className="relative h-44 overflow-hidden bg-surface-container">
          <img
            src={res.image}
            alt={res.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/40 to-transparent" />

          {res.promo && (
            <span className="absolute top-3 left-3 flex items-center gap-1 bg-secondary-container text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-cta">
              <Icon name="sell" size={14} fill /> {res.promo}
            </span>
          )}
          <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-on-surface">
            {res.category}
          </span>
          <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-on-surface">
            <Icon name="star" size={14} fill className="text-amber-500" /> {res.rating}
          </span>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 rounded-full bg-mint-subtle border border-border-subtle overflow-hidden flex items-center justify-center">
              {res.logo ? (
                <img src={res.logo} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="font-extrabold text-primary">{res.name.charAt(0)}</span>
              )}
            </div>
            <h4 className="flex-1 min-w-0 truncate font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
              {res.name}
            </h4>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1 text-on-surface-variant">
              <Icon name="schedule" size={16} className="text-primary" /> {res.deliveryTime}
            </span>
            <span className="flex items-center gap-1 text-primary bg-mint-subtle px-2.5 py-1 rounded-lg">
              <Icon name="two_wheeler" size={16} /> {res.deliveryFee}
            </span>
          </div>
        </div>
      </Link>

      {/* Favorito: fuera del Link para no anidar botón dentro de <a> */}
      <button
        onClick={() => setIsFavorite((prev) => !prev)}
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        aria-pressed={isFavorite}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
      >
        <Icon
          name="favorite"
          size={20}
          fill={isFavorite}
          className={isFavorite ? "text-red-500" : "text-on-surface-variant"}
        />
      </button>
    </div>
  );
};