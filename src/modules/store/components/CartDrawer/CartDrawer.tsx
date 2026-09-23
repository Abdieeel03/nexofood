'use client'

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart.store";
import { useStoreUi } from "@/stores/store-ui.store";
import { useOverlay } from "../../hooks/use-overlay";
import { formatDeliveryFee, formatPrice, roundMoney } from "../../utils/format-price";

export const CartDrawer: React.FC = () => {
  const isOpen = useStoreUi((s) => s.isCartOpen);
  const closeCart = useStoreUi((s) => s.closeCart);
  const openCheckout = useStoreUi((s) => s.openCheckout);

  const store = useCartStore((s) => s.store);
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  useOverlay(isOpen, closeCart);

  const deliveryFee = store?.deliveryFee ?? 0;
  const total = roundMoney(subtotal + deliveryFee);

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-70 bg-inverse-surface-dark/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-80 h-full w-full max-w-[420px] bg-white shadow-level-3 flex flex-col transition-[transform,visibility] duration-300 ease-in-out ${
          isOpen ? "translate-x-0 visible" : "translate-x-full invisible"
        }`}
      >
        <div className="px-6 h-16 shrink-0 flex items-center justify-between border-b border-border-subtle">
          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
            Tu carrito
            {count > 0 && <span className="ml-2 text-sm font-bold text-on-surface-variant">({count})</span>}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {!store || items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
            <div className="w-20 h-20 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
              <Icon name="shopping_cart" size={38} />
            </div>
            <h3 className="text-lg font-extrabold text-on-surface">Tu carrito está vacío</h3>
            <p className="text-sm text-on-surface-variant max-w-[260px]">
              Agrega platos de tu restaurante favorito para empezar tu pedido.
            </p>
            <Link
              href="/store"
              onClick={closeCart}
              className="mt-2 px-5 py-3 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
            >
              Explorar restaurantes
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              <Link
                href={`/store/restaurant/${store.id}`}
                onClick={closeCart}
                className="flex items-center gap-3 group"
              >
                <span className="w-11 h-11 shrink-0 rounded-full bg-mint-subtle border border-border-subtle overflow-hidden flex items-center justify-center">
                  {store.logo ? (
                    <img src={store.logo} alt="" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span className="font-extrabold text-primary">{store.name.charAt(0)}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-on-surface-variant">Tu pedido en</span>
                  <span className="block font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">
                    {store.name}
                  </span>
                </span>
              </Link>

              <ul className="flex flex-col divide-y divide-border-subtle">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 py-4 first:pt-0">
                    {item.image && (
                      <img src={item.image} alt="" className="w-16 h-16 shrink-0 rounded-xl object-cover" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">{item.name}</p>
                      <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
                        {formatPrice(item.unitPrice)} c/u
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-extrabold text-sm text-on-surface">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                      <div className="flex items-center gap-1 bg-white rounded-full border border-border-subtle shadow-level-1 p-0.5">
                        <button
                          onClick={() => removeItem(item.productId)}
                          aria-label={
                            item.quantity === 1 ? `Quitar ${item.name}` : `Quitar una unidad de ${item.name}`
                          }
                          className="w-8 h-8 rounded-full text-on-surface hover:bg-surface-container flex items-center justify-center cursor-pointer"
                        >
                          <Icon name={item.quantity === 1 ? "delete" : "remove"} size={18} />
                        </button>
                        <span className="min-w-5 text-center text-sm font-extrabold text-on-surface">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            addItem(store, {
                              productId: item.productId,
                              name: item.name,
                              unitPrice: item.unitPrice,
                              image: item.image,
                            })
                          }
                          aria-label={`Agregar otra unidad de ${item.name}`}
                          className="w-8 h-8 rounded-full bg-secondary-container text-white hover:bg-secondary-accent flex items-center justify-center cursor-pointer"
                        >
                          <Icon name="add" size={18} weight={600} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 px-6 py-5 border-t border-border-subtle bg-surface-container-low flex flex-col gap-4">
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-on-surface">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <dt>Envío</dt>
                  <dd className={`font-semibold ${deliveryFee === 0 ? "text-primary" : "text-on-surface"}`}>
                    {formatDeliveryFee(deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-subtle text-base font-extrabold text-on-surface">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>

              <Button size="lg" fullWidth onClick={openCheckout}>
                Ir a pagar · {formatPrice(total)}
              </Button>

              <button
                onClick={clear}
                className="mx-auto flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              >
                <Icon name="delete_sweep" size={16} /> Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
