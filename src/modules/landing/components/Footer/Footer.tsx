import React from "react";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-low border-t border-border-subtle pt-12 md:pt-16">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12 pb-12 md:pb-16">
          {/* Brand Bio */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1 max-w-full lg:max-w-90">
            <a href="#" className="flex items-center gap-1.5 text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
              <span>Nexofood</span>
              <span className="text-secondary-container flex items-center">
                <Icon name="restaurant" size={24} fill={true} />
              </span>
            </a>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              La plataforma operativa integral para restaurantes modernos.
              Gestiona pedidos, menú y logística desde un solo lugar sin
              comisiones abusivas.
            </p>
            <div className="flex items-center gap-2 text-on-surface-variant mt-1">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors hover:bg-primary-container hover:text-white cursor-pointer"
                aria-label="Sitio web global"
              >
                <Icon name="language" size={18} />
              </a>
              <a
                href="mailto:contacto@nexofood.io"
                className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors hover:bg-primary-container hover:text-white cursor-pointer"
                aria-label="Contacto por correo"
              >
                <Icon name="mail" size={18} />
              </a>
            </div>
          </div>

          {/* Col 1: Productos */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h4 className="text-xs sm:text-sm font-bold text-on-surface">Productos</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="#productos" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Tienda Online
                </a>
              </li>
              <li>
                <a href="#productos" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Gestor de Pedidos
                </a>
              </li>
              <li>
                <a href="#productos" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Logística y Delivery
                </a>
              </li>
              <li>
                <a href="#productos" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Integraciones POS
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Recursos */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h4 className="text-xs sm:text-sm font-bold text-on-surface">Recursos</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Blog Gastronómico
                </a>
              </li>
              <li>
                <a href="#casos-de-exito" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Casos de Éxito
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Webinars en Vivo
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Compañía */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h4 className="text-xs sm:text-sm font-bold text-on-surface">Compañía</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Carreras & Empleos
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Contacto Comercial
                </a>
              </li>
              <li>
                <a href="#" className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5">
                  Programa de Partners
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-border-subtle py-4">
        <Container>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
            <p className="text-xs text-on-surface-variant">
              © 2026 Nexofood Technologies. Potenciando la industria gastronómica.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="text-primary flex">
                  <Icon name="lock" size={16} />
                </span>
                <span>Pagos Seguros PCI-DSS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary flex">
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
