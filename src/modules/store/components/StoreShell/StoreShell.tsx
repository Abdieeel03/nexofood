'use client'

import React, { useEffect } from "react";
import { useCartStore } from "@/stores/cart.store";
import { useOrdersStore } from "@/stores/orders.store";
import { CartDrawer } from "../CartDrawer";
import { CheckoutModal } from "../CheckoutModal";
import { Footer } from "../Footer";
import { Header } from "../Header";
import { ReplaceCartDialog } from "../ReplaceCartDialog";

type StoreShellProps = {
  children: React.ReactNode;
};

/** Marco común de la store: header, contenido, footer y overlays (carrito, checkout). */
export const StoreShell: React.FC<StoreShellProps> = ({ children }) => {
  // Carrito y pedidos persisten en localStorage; se rehidratan aquí, ya en el cliente
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useOrdersStore.persist.rehydrate();
  }, []);

  return (
    // overflow-x-clip (no hidden): hidden crea un contenedor de scroll y rompe el sticky del header
    <div className="min-h-screen bg-surface flex flex-col relative overflow-x-clip">
      <Header />

      <main className="flex-1 flex flex-col">{children}</main>

      <Footer />

      <CartDrawer />
      <CheckoutModal />
      <ReplaceCartDialog />
    </div>
  );
};
