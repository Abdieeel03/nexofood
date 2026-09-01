"use client";

import React, { useState } from "react";
import styles from "./Header.module.css";
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
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          {/* Logo */}
          <a href="#" className={styles.brand} onClick={closeMenu}>
            <span>Nexofood</span>
            <span className={styles.brandIcon}>
              <Icon name="restaurant" size={24} fill={true} />
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className={styles.nav} aria-label="Navegación principal">
            <a href="#por-que" className={styles.navLink}>
              ¿Por qué Nexofood?
            </a>
            <a href="#productos" className={styles.navLink}>
              Productos
            </a>
            <a href="#precios" className={styles.navLink}>
              Precios
            </a>
            <a href="#casos-de-exito" className={styles.navLink}>
              Casos de Éxito
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className={styles.actions}>
            <a href="#login" className={styles.loginLink}>
              Iniciar sesión
            </a>
            <Button
              variant="primary"
              size="md"
              href="#comienza-gratis"
            >
              Comienza Gratis
            </Button>
            <button
              className={styles.mobileMenuButton}
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
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileNavLinks}>
          <a
            href="#por-que"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            ¿Por qué Nexofood?
          </a>
          <a
            href="#productos"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Productos
          </a>
          <a
            href="#precios"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Precios
          </a>
          <a
            href="#casos-de-exito"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Casos de Éxito
          </a>
        </div>
        <div className={styles.mobileActions}>
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
