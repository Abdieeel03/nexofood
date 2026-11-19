"use client";

import React from "react";
import { CartDrawer } from "../CartDrawer";
import { CheckoutModal } from "../CheckoutModal";
import { Footer } from "../Footer";
import { Header } from "../Header";
import { ProductDetailDialog } from "../ProductDetailDialog";
import { StoreAuthDialog } from "../StoreAuthDialog";

interface StoreShellProps {
  children: React.ReactNode;
}

/**
 * Marco común del storefront directo por slug:
 * cabecera, contenido principal, pie de página y modales/drawers sincronizados con backend.
 */
export const StoreShell: React.FC<StoreShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative overflow-x-clip">
      <Header />

      <main className="flex-1 flex flex-col">{children}</main>

      <Footer />

      <CartDrawer />
      <CheckoutModal />
      <StoreAuthDialog />
      <ProductDetailDialog />
    </div>
  );
};
