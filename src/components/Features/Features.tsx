import React from "react";
import styles from "./Features.module.css";
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
        <div className={styles.header}>
          <div className={styles.pillBadge}>
            <Icon name="bolt" size={16} fill={true} />
            <span>Productos Nexofood</span>
          </div>
          <h2 className={styles.title}>
            Todo lo que necesitas para escalar tu gastronomía
          </h2>
          <p className={styles.subtitle}>
            Módulos integrados creados específicamente para eliminar los cuellos
            de botella reales en cocina, delivery y rentabilidad.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className={styles.grid}>
          {FEATURES.map((feature, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.iconWrapper}>
                  <Icon name={feature.icon} size={28} />
                </div>
                <span className={styles.tag}>{feature.tag}</span>
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
              <div className={styles.bulletList}>
                {feature.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className={styles.bulletItem}>
                    <span className={styles.bulletIcon}>
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
