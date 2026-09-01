import React from "react";
import styles from "./ImpactStats.module.css";
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
        <div className={styles.grid}>
          {STATS.map((stat, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
};
