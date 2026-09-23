'use client'

import React from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCartStore } from "@/stores/cart.store";
import { useOverlay } from "../../hooks/use-overlay";

/** Aparece cuando el cliente intenta agregar un producto de otra tienda con el carrito lleno. */
export const ReplaceCartDialog: React.FC = () => {
  const pending = useCartStore((s) => s.pending);
  const currentStore = useCartStore((s) => s.store);
  const confirmReplace = useCartStore((s) => s.confirmReplace);
  const cancelReplace = useCartStore((s) => s.cancelReplace);

  useOverlay(pending !== null, cancelReplace);

  if (!pending || !currentStore) return null;

  return (
    <>
      <div onClick={cancelReplace} aria-hidden="true" className="fixed inset-0 z-90 bg-inverse-surface-dark/60 backdrop-blur-sm" />
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="replace-cart-title"
          className="pointer-events-auto w-full max-w-md bg-white rounded-3xl shadow-level-3 p-7 flex flex-col gap-5 animate-fade-in-up"
        >
          <div className="w-12 h-12 rounded-2xl bg-tangerine-subtle text-secondary flex items-center justify-center">
            <Icon name="storefront" size={26} />
          </div>
          <div>
            <h2 id="replace-cart-title" className="text-xl font-extrabold text-on-surface tracking-tight">
              ¿Empezar un nuevo carrito?
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Tu carrito tiene productos de <strong className="text-on-surface">{currentStore.name}</strong>. Cada
              pedido es de un solo restaurante, así que para agregar de{" "}
              <strong className="text-on-surface">{pending.store.name}</strong> vaciaremos el carrito actual.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={cancelReplace}>
              Cancelar
            </Button>
            <Button onClick={confirmReplace}>Vaciar y agregar</Button>
          </div>
        </div>
      </div>
    </>
  );
};
