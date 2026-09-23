'use client'

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCartStore, type CartItem } from "@/stores/cart.store";
import { SearchBar } from "./components/SearchBar";
import { SideMenu } from "./components/SideMenu";
import { UserMenu } from "./components/UserMenu";
import { MOCK_ADDRESS } from "./constants";

type HeaderProps = {
  onOpenCart: () => void;
};

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const { cart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);

  const handleLogout = () => {
    alert("Sesión cerrada (Demo visual)");
  };

  return (
    <>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={handleLogout} />

      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1650px] mx-auto px-4 md:px-8 h-16 flex items-center gap-4 md:gap-6">
          {/* Izquierda: menú, logo, ubicación */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
              className="p-2 rounded-lg text-on-surface hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              href="/store"
              className="flex items-center gap-1.5 text-xl sm:text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition-opacity"
            >
              <span>Nexofood</span>
              <span className="text-secondary-container flex items-center">
                <Icon name="restaurant" size={24} fill />
              </span>
            </Link>

            <button className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer">
              <Icon name="location_on" size={20} className="text-secondary-container" fill />
              <span className="text-xs font-semibold text-on-surface truncate max-w-[220px]">{MOCK_ADDRESS}</span>
              <Icon name="arrow_drop_down" size={20} className="text-on-surface-variant" />
            </button>
          </div>

          {/* Centro: búsqueda (desktop) */}
          <div className="hidden md:block flex-1 max-w-2xl mx-auto">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Derecha: usuario y carrito */}
          <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
            <UserMenu onLogout={handleLogout} />

            <button
              onClick={onOpenCart}
              aria-label="Abrir carrito"
              className="relative w-11 h-11 rounded-xl bg-secondary-container text-on-secondary shadow-[0_2px_4px_rgba(254,106,52,0.2)] hover:bg-secondary-accent hover:shadow-cta hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <Icon name="shopping_cart" size={22} fill />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Búsqueda (móvil) */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </header>
    </>
  );
};