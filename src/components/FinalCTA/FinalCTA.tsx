import React from "react";
import styles from "./FinalCTA.module.css";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

export const FinalCTA: React.FC = () => {
  return (
    <section className={styles.section} id="comienza-gratis">
      <div className={styles.radialGlow} />
      <Container>
        <div className={styles.content}>
          <h2 className={styles.title}>
            Lleva tu restaurante al siguiente nivel hoy mismo
          </h2>
          <p className={styles.description}>
            Únete a miles de negocios que ya optimizaron sus operaciones y
            aumentaron sus márgenes de ganancia con Nexofood.
          </p>
          <div className={styles.ctaButton}>
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
