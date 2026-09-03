"use client";

import React, { useState } from "react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-1000 bg-white/85 backdrop-blur-md border-b border-border-subtle transition-all duration-200">
      <Container>
        <div className="flex justify-between items-center py-3.5 md:py-4">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-1.5 text-xl sm:text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition-opacity"
            onClick={closeMenu}
          >
            <span>Nexofood</span>
            <span className="text-secondary-container flex items-center">
              <Icon name="restaurant" size={24} fill={true} />
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Navegación principal">
            <a
              href="#por-que"
              className="relative text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 group"
            >
              ¿Por qué Nexofood?
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-container rounded-full transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#productos"
              className="relative text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 group"
            >
              Productos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-container rounded-full transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#precios"
              className="relative text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 group"
            >
              Precios
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-container rounded-full transition-all duration-200 group-hover:w-full" />
            </a>
            <a
              href="#casos-de-exito"
              className="relative text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 group"
            >
              Casos de Éxito
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-container rounded-full transition-all duration-200 group-hover:w-full" />
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="#login"
              className="hidden lg:inline-block text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container px-3 py-2 rounded-lg transition-colors"
            >
              Iniciar sesión
            </a>
            <Button
              variant="primary"
              size="md"
              href="#comienza-gratis"
              className="text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-4"
            >
              Comienza Gratis
            </Button>
            <button
              className="flex lg:hidden items-center justify-center p-1.5 text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              onClick={toggleMenu}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={28} />
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed top-15.25 sm:top-17 left-0 w-full bg-surface-container-lowest border-b border-outline-variant p-5 shadow-level-3 flex-col gap-4 z-999 ${menuOpen ? "flex" : "hidden"
          }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col gap-2">
          <a
            href="#por-que"
            className="px-4 py-3 text-base font-semibold text-on-surface rounded-lg hover:bg-surface-container-low hover:text-primary transition-colors"
            onClick={closeMenu}
          >
            ¿Por qué Nexofood?
          </a>
          <a
            href="#productos"
            className="px-4 py-3 text-base font-semibold text-on-surface rounded-lg hover:bg-surface-container-low hover:text-primary transition-colors"
            onClick={closeMenu}
          >
            Productos
          </a>
          <a
            href="#precios"
            className="px-4 py-3 text-base font-semibold text-on-surface rounded-lg hover:bg-surface-container-low hover:text-primary transition-colors"
            onClick={closeMenu}
          >
            Precios
          </a>
          <a
            href="#casos-de-exito"
            className="px-4 py-3 text-base font-semibold text-on-surface rounded-lg hover:bg-surface-container-low hover:text-primary transition-colors"
            onClick={closeMenu}
          >
            Casos de Éxito
          </a>
        </div>
        <div className="flex flex-col gap-2 pt-4 border-t border-surface-container-high">
          <Button
            variant="outline"
            fullWidth
            size="md"
            href="#login"
            onClick={closeMenu}
          >
            Iniciar sesión
          </Button>
          <Button
            variant="primary"
            fullWidth
            size="md"
            href="#comienza-gratis"
            onClick={closeMenu}
          >
            Comienza Gratis
          </Button>
        </div>
      </div>
    </header>
  );
};
