import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const EmptyOrders: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16">
      <div className="w-20 h-20 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
        <Icon name="receipt_long" size={38} />
      </div>
      <h4 className="text-lg font-extrabold text-on-surface">Aún no tienes pedidos</h4>
      <p className="text-sm text-on-surface-variant max-w-xs">
        Cuando hagas tu primera compra, aquí verás su estado y el historial.
      </p>
      <Link
        href="/store"
        className="mt-2 px-5 py-3 rounded-xl bg-secondary-container text-white text-sm font-semibold shadow-cta hover:bg-secondary-accent transition-colors"
      >
        Explorar restaurantes
      </Link>
    </div>
  );
};
