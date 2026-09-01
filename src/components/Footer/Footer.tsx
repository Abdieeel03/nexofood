import React from "react";
import styles from "./Footer.module.css";
import { Container } from "../ui/Container";
import { Icon } from "../ui/Icon";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.topGrid}>
          {/* Brand Bio */}
          <div className={styles.brandCol}>
            <a href="#" className={styles.brand}>
              <span>Nexofood</span>
              <span className={styles.brandIcon}>
                <Icon name="restaurant" size={24} fill={true} />
              </span>
            </a>
            <p className={styles.brandBio}>
              La plataforma operativa integral para restaurantes modernos.
              Gestiona pedidos, menú y logística desde un solo lugar sin
              comisiones abusivas.
            </p>
            <div className={styles.socialRow}>
              <a href="#" className={styles.socialIcon} aria-label="Sitio web global">
                <Icon name="language" size={18} />
              </a>
              <a href="mailto:contacto@nexofood.io" className={styles.socialIcon} aria-label="Contacto por correo">
                <Icon name="mail" size={18} />
              </a>
            </div>
          </div>

          {/* Col 1: Productos */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Productos</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}>
                <a href="#productos">Tienda Online</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#productos">Gestor de Pedidos</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#productos">Logística y Delivery</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#productos">Integraciones POS</a>
              </li>
            </ul>
          </div>

          {/* Col 2: Recursos */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Recursos</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}>
                <a href="#">Centro de Ayuda</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#">Blog Gastronómico</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#casos-de-exito">Casos de Éxito</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#">Webinars en Vivo</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Compañía */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Compañía</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}>
                <a href="#">Sobre Nosotros</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#">Carreras & Empleos</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#">Contacto Comercial</a>
              </li>
              <li className={styles.linkItem}>
                <a href="#">Programa de Partners</a>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <Container>
          <div className={styles.bottomInner}>
            <p className={styles.copyright}>
              © 2026 Nexofood Technologies. Potenciando la industria gastronómica.
            </p>
            <div className={styles.securityBadges}>
              <div className={styles.badgeItem}>
                <span className={styles.badgeIcon}>
                  <Icon name="lock" size={16} />
                </span>
                <span>Pagos Seguros PCI-DSS</span>
              </div>
              <div className={styles.badgeItem}>
                <span className={styles.badgeIcon}>
                  <Icon name="verified_user" size={16} />
                </span>
                <span>SSL 256-bit</span>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};
