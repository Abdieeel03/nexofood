import React from "react";
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
        <div className="text-center flex flex-col items-center gap-6">
          <p className="text-xs font-bold text-outline uppercase tracking-[0.12em]">
            Marcas gastronómicas líderes que confían en Nexofood
          </p>
          <div className="flex flex-wrap justify-center items-center gap-5 md:gap-12 opacity-65 hover:opacity-95 transition-opacity">
            {BRANDS.map((brand) => (
              <div
                key={brand}
                className="text-xl md:text-2xl font-extrabold text-on-surface-variant tracking-tight py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg transition-all duration-200 grayscale hover:grayscale-0 hover:text-primary hover:-translate-y-0.5 hover:bg-surface-container-low select-none"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </SectionWrapper>
  );
};
