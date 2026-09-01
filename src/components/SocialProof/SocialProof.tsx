import React from "react";
import styles from "./SocialProof.module.css";
import { Container } from "../ui/Container";
import { SectionWrapper } from "../ui/SectionWrapper";

const BRANDS = [
  "BurgerKing",
  "SushiClub",
  "ElClubDeLaMilanesa",
  "KFC",
  "Luccianos",
];

export const SocialProof: React.FC = () => {
  return (
    <SectionWrapper background="lowest" padding="sm" borderBottom={true}>
      <Container>
        <div className={styles.wrapper}>
          <p className={styles.heading}>
            Marcas gastronómicas líderes que confían en Nexofood
          </p>
          <div className={styles.brandGrid}>
            {BRANDS.map((brand) => (
              <div key={brand} className={styles.brandItem}>
                {brand}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </SectionWrapper>
  );
};
