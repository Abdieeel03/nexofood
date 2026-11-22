"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatCurrencyPEN } from "@/lib/format";
import type { CartItemResponse } from "@/schemas/cart.schema";
import type { StorefrontProductResponse } from "@/schemas/catalog.schema";

interface StoreProductCardProps {
  product: StorefrontProductResponse;
  storeClosed: boolean;
  cartItem?: CartItemResponse;
  isMutating: boolean;
  onOpenDetail: () => void;
  onQuickAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  storeClosed,
  cartItem,
  isMutating,
  onOpenDetail,
  onQuickAdd,
  onIncrement,
  onDecrement,
}) => {
  const outOfStock = product.stock === 0 || !product.isAvailable;
  const disabled = storeClosed || outOfStock;
  const hasDiscount =
    product.price < product.basePrice || product.activePromotionName !== null;
  const currentQty = cartItem?.quantity ?? 0;

  return (
    <article className="group flex gap-4 bg-surface-card rounded-2xl border border-outline-variant/60 shadow-level-1 p-4 hover:shadow-level-2 hover:border-primary-container/60 transition-all">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {hasDiscount && (
            <Badge variant="secondary" size="sm">
              {product.activePromotionName ?? "Oferta"}
              {product.discountPercentage !== null
                ? ` -${Math.round(product.discountPercentage)}%`
                : ""}
            </Badge>
          )}
          {outOfStock && (
            <Badge variant="danger" size="sm">
              Agotado
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenDetail}
          className="text-left cursor-pointer"
        >
          <h3 className="font-bold text-base text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </button>

        {product.description && (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-baseline flex-wrap gap-x-2 gap-y-1">
          <span className="font-extrabold text-base text-on-surface tabular-nums">
            {formatCurrencyPEN(product.finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-on-surface-variant line-through tabular-nums">
              {formatCurrencyPEN(product.basePrice)}
            </span>
          )}
        </div>
      </div>

      <div className="relative shrink-0 w-28 h-28">
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Ver detalle de ${product.name}`}
          className="w-full h-full rounded-xl overflow-hidden bg-surface-container border border-outline-variant/40 flex items-center justify-center cursor-pointer"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={112}
              height={112}
              className={`w-full h-full object-cover ${
                outOfStock ? "grayscale opacity-60" : ""
              }`}
            />
          ) : (
            <Icon name="restaurant_menu" size={28} className="text-outline" />
          )}
        </button>

        {currentQty === 0 ? (
          <button
            type="button"
            disabled={disabled || isMutating}
            onClick={onQuickAdd}
            aria-label={
              outOfStock
                ? `${product.name} agotado`
                : `Agregar ${product.name} al carrito`
            }
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary-container text-on-secondary shadow-level-2 hover:bg-secondary-accent disabled:bg-surface-container-highest disabled:text-outline disabled:shadow-none transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <Icon name="add" size={20} weight={600} />
          </button>
        ) : (
          <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 bg-surface-card rounded-full shadow-level-2 border border-outline-variant p-0.5">
            <button
              type="button"
              disabled={storeClosed || isMutating}
              onClick={onDecrement}
              aria-label={`Quitar una unidad de ${product.name}`}
              className="w-7 h-7 rounded-full text-on-surface hover:bg-surface-container flex items-center justify-center disabled:opacity-45 cursor-pointer"
            >
              <Icon name={currentQty === 1 ? "delete" : "remove"} size={16} />
            </button>
            <span className="min-w-4 text-center text-xs font-extrabold tabular-nums text-on-surface">
              {currentQty}
            </span>
            <button
              type="button"
              disabled={disabled || isMutating || currentQty >= product.stock}
              onClick={onIncrement}
              aria-label={`Agregar otra unidad de ${product.name}`}
              className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary hover:bg-secondary-accent flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              <Icon name="add" size={16} weight={600} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
