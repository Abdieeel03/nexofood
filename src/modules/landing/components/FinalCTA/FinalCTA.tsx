import React from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const FinalCTA: React.FC = () => {
  return (
    <section className="relative bg-inverse-surface text-inverse-on-surface py-12 md:py-20 overflow-hidden text-center" id="comienza-gratis">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,rgba(22,31,26,0)_70%)] pointer-events-none" />
      <Container>
        <div className="relative z-1 max-w-195 mx-auto flex flex-col items-center gap-5 sm:gap-6">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-snug md:leading-14">
            Lleva tu restaurante al siguiente nivel hoy mismo
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-inverse-on-surface/85 max-w-155 leading-relaxed">
            Únete a miles de negocios que ya optimizaron sus operaciones y
            aumentaron sus márgenes de ganancia con Nexofood.
          </p>
          <div className="mt-2">
            <Button
              variant="primary"
              size="lg"
              icon="arrow_forward"
              href="#inicio"
            >
              Comenzar Prueba Gratuita
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
