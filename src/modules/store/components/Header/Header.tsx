'use client'

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { selectCartCount, useCartStore } from "@/stores/cart.store";
import { useStoreUi } from "@/stores/store-ui.store";
import { SearchBar } from "./components/SearchBar";
import { SideMenu } from "./components/SideMenu";
import { UserMenu } from "./components/UserMenu";
import { MOCK_ADDRESS } from "./constants";

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartStore(selectCartCount);
  const openCart = useStoreUi((s) => s.openCart);
  const searchQuery = useStoreUi((s) => s.searchQuery);
  const setSearchQuery = useStoreUi((s) => s.setSearchQuery);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // El buscador filtra el home: si se busca desde otra página, se vuelve al listado
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (pathname !== "/store") router.push("/store");
  };

  const handleLogout = () => {
    alert("Sesión cerrada (Demo visual)");
  };

  return (
    <>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={handleLogout} />

      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-border-subtle">
  <div className="w-full px-4 md:px-6 h-16 flex items-center gap-3 md:gap-4">
    {/* Menú + logo */}
    <div className="flex items-center gap-1 md:gap-3 shrink-0">
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
    </div>

    <span aria-hidden="true" className="hidden lg:block h-8 w-px bg-outline-variant/60 shrink-0" />

    {/* Dirección */}
    <button className="hidden lg:flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer shrink-0">
      <Icon name="location_on" size={22} fill className="text-secondary-container" />
      <span className="text-sm font-bold text-primary truncate max-w-[260px]">{MOCK_ADDRESS}</span>
      <Icon name="arrow_drop_down" size={22} className="text-primary" />
    </button>

    <span aria-hidden="true" className="hidden lg:block h-8 w-px bg-outline-variant/60 shrink-0" />

    {/* Buscador (desktop): ocupa todo el espacio libre */}
    <div className="hidden md:block flex-1 min-w-0">
      <SearchBar value={searchQuery} onChange={handleSearch} />
    </div>

    {/* Usuario + carrito */}
    <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
      <UserMenu onLogout={handleLogout} />

      <span aria-hidden="true" className="hidden sm:block h-8 w-px bg-outline-variant/60" />

      <button
        onClick={openCart}
        aria-label={cartCount > 0 ? `Abrir carrito, ${cartCount} productos` : "Abrir carrito"}
        className="relative w-11 h-11 rounded-full text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
      >
        <Icon name="shopping_cart" size={26} />
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  </div>

  {/* Búsqueda (móvil) */}
  <div className="md:hidden px-4 pb-3">
    <SearchBar value={searchQuery} onChange={handleSearch} />
  </div>
</header>
    </>
  );
};