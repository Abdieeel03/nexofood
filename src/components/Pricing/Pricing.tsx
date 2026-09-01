import React from "react";
import styles from "./Pricing.module.css";
import { Container } from "../ui/Container";
import { SectionWrapper } from "../ui/SectionWrapper";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface Plan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  featured?: boolean;
  buttonText: string;
  buttonVariant: "primary" | "outline";
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "/mes",
    description:
      "Para emprendedores gastronómicos que dan sus primeros pasos online.",
    buttonText: "Comenzar Gratis",
    buttonVariant: "outline",
    features: [
      "1 local gastronómico",
      "Tienda online web y móvil",
      "Catálogo y menú ilimitado con fotos",
      "Recepción de pedidos por WhatsApp",
      "Soporte por email y comunidad",
    ],
  },
  {
    id: "pro",
    name: "Profesional",
    price: "$49",
    period: "/mes",
    description:
      "Para restaurantes en crecimiento que necesitan control total de cocina y logística.",
    featured: true,
    buttonText: "Probar 14 Días Gratis",
    buttonVariant: "primary",
    features: [
      "Todo lo de Starter, más:",
      "KDS: Pantalla de comandas en cocina",
      "Unificación de Rappi, PedidosYa y Uber",
      "Pasarela de pagos en línea integrada",
      "Gestión de repartidores y tracking en vivo",
      "Campañas de retención por WhatsApp",
      "Soporte prioritario 24/7",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description:
      "Para cadenas, franquicias y dark kitchens con alta demanda operativa.",
    buttonText: "Contactar a Ventas",
    buttonVariant: "outline",
    features: [
      "Locales y marcas ilimitadas",
      "Integración POS con ERPs y hardware propio",
      "Facturación electrónica masiva automática",
      "Despliegue y capacitación in situ",
      "Account manager y arquitecto dedicado",
      "SLA 99.99% garantizado por contrato",
    ],
  },
];

export const Pricing: React.FC = () => {
  return (
    <SectionWrapper background="surface" padding="lg" id="precios">
      <Container>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.pillBadge}>
            <Icon name="payments" size={16} fill={true} />
            <span>Precios Transparentes</span>
          </div>
          <h2 className={styles.title}>
            Planes flexibles sin comisiones abusivas
          </h2>
          <p className={styles.subtitle}>
            Empieza gratis, escala cuando lo necesites. Sin contratos de
            permanencia forzada.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className={styles.grid}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.card} ${
                plan.featured ? styles.cardFeatured : ""
              }`}
            >
              {plan.featured && (
                <div className={styles.featuredBadge}>Más Popular</div>
              )}

              <div className={styles.cardHead}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceAmount}>{plan.price}</span>
                  {plan.period && (
                    <span className={styles.pricePeriod}>{plan.period}</span>
                  )}
                </div>
              </div>

              <div className={styles.featureList}>
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      <Icon name="check_circle" size={18} fill={true} />
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.buttonVariant}
                size="md"
                fullWidth
                href="#comienza-gratis"
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
};
