import React from "react";
import { Icon } from "@/components/ui/Icon";
import { useCartStore } from "@/stores/cart.store";
import type { MenuItem, Restaurant } from "../../../schemas/store.chema";
import { formatPrice, getDiscountPercent } from "../../../utils/format-price";
import { toStoreRef } from "../../../utils/store-ref";

type MenuItemCardProps = {
  item: MenuItem;
  restaurant: Restaurant;
};

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, restaurant }) => {
  const quantity = useCartStore((state) => state.items.find((i) => i.productId === item.id)?.quantity ?? 0);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const discount = getDiscountPercent(item.price, item.oldPrice);

  const image = item.image ?? restaurant.image;

  const handleAdd = () =>
    addItem(toStoreRef(restaurant), { productId: item.id, name: item.name, unitPrice: item.price, image });

  return (
    <article className="flex gap-4 bg-white rounded-2xl border border-border-subtle shadow-level-1 p-4 hover:shadow-level-2 hover:border-primary-container/50 transition-all">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <h3 className="font-bold text-on-surface leading-snug line-clamp-2">{item.name}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{item.description}</p>

        <div className="mt-auto pt-2 flex items-center flex-wrap gap-x-2 gap-y-1">
          {discount > 0 && (
            <span className="bg-mint-subtle text-primary text-xs font-extrabold px-2 py-0.5 rounded-md">-{discount}%</span>
          )}
          <span className="font-extrabold text-on-surface">{formatPrice(item.price)}</span>
          {item.oldPrice && (
            <span className="text-xs text-on-surface-variant line-through">{formatPrice(item.oldPrice)}</span>
          )}
        </div>
      </div>

      <div className="relative shrink-0 w-28 h-28">
        <img src={image} alt={item.name} className="w-full h-full object-cover rounded-xl" />

        {quantity === 0 ? (
          <button
            onClick={handleAdd}
            aria-label={`Agregar ${item.name}`}
            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-secondary-container text-white shadow-cta hover:bg-secondary-accent hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <Icon name="add" size={22} weight={600} />
          </button>
        ) : (
          <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-white rounded-full shadow-level-2 border border-border-subtle p-0.5">
            <button
              onClick={() => removeItem(item.id)}
              aria-label={`Quitar una unidad de ${item.name}`}
              className="w-8 h-8 rounded-full text-on-surface hover:bg-surface-container flex items-center justify-center cursor-pointer"
            >
              <Icon name={quantity === 1 ? "delete" : "remove"} size={18} />
            </button>
            <span className="min-w-4 text-center text-sm font-extrabold text-on-surface">{quantity}</span>
            <button
              onClick={handleAdd}
              aria-label={`Agregar otra unidad de ${item.name}`}
              className="w-8 h-8 rounded-full bg-secondary-container text-white hover:bg-secondary-accent flex items-center justify-center cursor-pointer"
            >
              <Icon name="add" size={18} weight={600} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};