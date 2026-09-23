'use client'

import { ReactNode } from "react";
import { Header } from "@/modules/store/components/Header";
import { Footer } from "@/modules/store/components/Footer";

export default function StoreLayoutRoute({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-x-hidden">
      {/* TODO: reconectar CartDrawer y CheckoutModal cuando se rehagan */}
      <Header onOpenCart={() => {}} />

      <main className="flex-1 flex flex-col">{children}</main>

      <Footer />
    </div>
  );
}