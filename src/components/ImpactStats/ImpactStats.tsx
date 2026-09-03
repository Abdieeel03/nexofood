import React from "react";
import { Container } from "../ui/Container";
import { SectionWrapper } from "../ui/SectionWrapper";

interface StatItem {
  value: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: "+15%", label: "Aumento Ticket Promedio" },
  { value: "+100k", label: "Negocios Activos" },
  { value: "0%", label: "Comisiones Sorpresa" },
  { value: "99.9%", label: "Uptime Garantizado" },
];

export const ImpactStats: React.FC = () => {
  return (
    <SectionWrapper background="surface" padding="lg" id="por-que">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat, index) => (
            <div
              key={index}
              className="bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 text-center shadow-level-1 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 hover:-translate-y-1 hover:shadow-level-2 hover:border-primary-container"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-container tracking-tight leading-none">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
};
