import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

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
        <div className="text-center max-w-190 mx-auto mb-10 md:mb-14 flex flex-col items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-primary text-xs font-bold uppercase tracking-wider">
            <Icon name="payments" size={16} fill={true} />
            <span>Precios Transparentes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight sm:leading-snug">
            Planes flexibles sin comisiones abusivas
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-on-surface-variant leading-relaxed">
            Empieza gratis, escala cuando lo necesites. Sin contratos de
            permanencia forzada.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-120 lg:max-w-none mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface-container-lowest rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 transition-all duration-200 relative hover:-translate-y-1 ${plan.featured
                ? "border-2 border-primary-container shadow-[0_8px_30px_rgba(16,185,129,0.15)]"
                : "border border-border-subtle shadow-level-1 hover:shadow-level-2"
                }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary-container text-on-secondary text-[11px] font-extrabold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-[0_2px_8px_rgba(254,106,52,0.3)]">
                  Más Popular
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">
                  {plan.name}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant min-h-9">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 my-3 sm:my-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-on-surface leading-none">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-xs sm:text-sm text-on-surface-variant">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-surface-container pt-4 grow mb-2">
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface">
                    <span className="text-primary-container flex shrink-0 mt-0.5">
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
