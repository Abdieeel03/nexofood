import React from "react";
import { Container } from "../ui/Container";
import { SectionWrapper } from "../ui/SectionWrapper";
import { Icon } from "../ui/Icon";

interface FeatureCard {
  icon: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
}

const FEATURES: FeatureCard[] = [
  {
    icon: "storefront",
    tag: "0% COMISIONES",
    title: "Tienda Online Propia",
    description:
      "Publica tu propio canal de venta digital en minutos. Permite a tus comensales pedir directamente sin intermediarios que te quiten hasta un 30%.",
    bullets: [
      "Checkout ultra rápido y optimizado para móvil",
      "Personalización de colores, logo y dominio propio",
      "Upselling automático de combos y bebidas",
    ],
  },
  {
    icon: "point_of_sale",
    tag: "CENTRALIZADO",
    title: "Gestor Multicanal (KDS)",
    description:
      "Unifica todos tus canales en una única pantalla de cocina: Rappi, PedidosYa, WhatsApp y tu tienda online marchan en el mismo flujo de producción.",
    bullets: [
      "Pantalla KDS táctil organizada por tiempos de cocción",
      "Comandas impresas automáticamente por estación",
      "Sincronización instantánea de stock de menú",
    ],
  },
  {
    icon: "local_shipping",
    tag: "DESPACHO INTELIGENTE",
    title: "Logística y Delivery",
    description:
      "Coordina tus propios repartidores o accede a couriers aliados bajo demanda. Mantén al cliente informado en cada segundo del trayecto.",
    bullets: [
      "Tracking en vivo en mapa con enlace vía WhatsApp",
      "Ruteo inteligente para minimizar tiempos de entrega",
      "Métricas exactas de tiempos de preparación y viaje",
    ],
  },
  {
    icon: "loyalty",
    tag: "RETENCIÓN +30%",
    title: "Fidelización y Base de Clientes",
    description:
      "Los clientes que te piden en apps no son tuyos. Con Nexofood construyes tu propia base de datos para volver a venderles con promociones personalizadas.",
    bullets: [
      "Base de datos de comensales 100% propia",
      "Campañas automatizadas por WhatsApp y correo",
      "Sistema de puntos y recompensas recurrentes",
    ],
  },
];

export const Features: React.FC = () => {
  return (
    <SectionWrapper background="default" padding="lg" id="productos">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-190 mx-auto mb-10 md:mb-14 flex flex-col items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-primary text-xs font-bold uppercase tracking-wider">
            <Icon name="bolt" size={16} fill={true} />
            <span>Productos Nexofood</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight sm:leading-snug">
            Todo lo que necesitas para escalar tu gastronomía
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-on-surface-variant leading-relaxed">
            Módulos integrados creados específicamente para eliminar los cuellos
            de botella reales en cocina, delivery y rentabilidad.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-level-1 flex flex-col gap-4 transition-all duration-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-level-2 hover:border-primary-container"
            >
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-surface-container text-primary flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-container group-hover:text-white">
                  <Icon name={feature.icon} size={28} />
                </div>
                <span className="text-[11px] font-bold tracking-wider py-1 px-2.5 rounded-full bg-surface-container-low text-secondary-container border border-secondary-container/20">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-on-surface">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                {feature.description}
              </p>
              <div className="flex flex-col gap-2.5 pt-3 border-t border-surface-container">
                {feature.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-2 text-xs sm:text-sm text-on-surface font-semibold">
                    <span className="text-primary-container flex shrink-0">
                      <Icon name="check_circle" size={16} fill={true} />
                    </span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
};
