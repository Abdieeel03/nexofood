"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const Hero: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`¡Gracias por tu interés! Te contactaremos pronto a ${email}`);
      setEmail("");
    }
  };

  return (
    <section className="relative min-h-auto lg:min-h-205 flex items-center pt-23 sm:pt-29 lg:pt-34 pb-12 lg:pb-20 overflow-hidden bg-inverse-surface" id="inicio">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsJFFgSXS3EpKfWPjM390_qRj9gqslcIQQ1qvAVwWjfASrzu0QoJMV63dHXtBY01x5iMHQHDEhNaQzs801p7Ig8ZHszxsey4KdPL7Ak3cm6I_O5BF_SjN1H8yMn7eQ0dec5yXZUo_iyuy8GeZ5Sjpbr87zAkiqhtaJZclTEC0f4HY1wu1WhGKUXB7h7nkGj9n-5Zh9kFKmpgaKI0UQmlfdp2AB5BmTYEmAGim_QJ39XZvj_isDJ6jg2A"
          alt="Cocina moderna gastronómica de alta tecnología"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-br from-inverse-surface-dark/92 to-inverse-surface/88 z-1" />
      </div>

      <Container>
        <div className="relative z-2 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center text-center lg:text-left">
          {/* Left Column */}
          <div className="flex flex-col gap-5 sm:gap-6 text-inverse-on-surface items-center lg:items-start">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#dde4dd]/15 border border-outline-variant/30 backdrop-blur-sm w-fit">
              <span className="text-primary-container flex">
                <Icon name="rocket_launch" size={16} fill={true} />
              </span>
              <span className="text-xs font-bold text-inverse-on-surface uppercase tracking-wider">
                La plataforma #1 para gastronomía
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug lg:leading-14">
              Tu negocio gastronómico va a{" "}
              <span className="text-primary-container relative whitespace-nowrap inline-block">
                vender más
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary-container/45 pointer-events-none"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </span>
              , en más lugares y sin comisiones abusivas.
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg leading-relaxed text-inverse-on-surface/85 max-w-145">
              Crea tu tienda online, gestiona pedidos de todas las plataformas y
              fideliza a tus clientes. Todo desde un único panel diseñado para
              el ritmo acelerado de tu cocina.
            </p>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full max-w-105 sm:max-w-135 mt-1">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                  <Icon name="mail" size={20} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  className="w-full bg-surface text-on-surface border border-transparent rounded-xl py-3 pl-11 pr-3.5 text-sm sm:text-base transition-all outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 placeholder:text-outline"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon="arrow_forward"
                className="w-full sm:w-auto"
              >
                Empieza tu prueba gratis
              </Button>
            </form>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-1 text-inverse-on-surface/80 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="text-primary-container flex">
                  <Icon name="check_circle" size={18} fill={true} />
                </span>
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary-container flex">
                  <Icon name="check_circle" size={18} fill={true} />
                </span>
                <span>Sin contratos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary-container flex">
                  <Icon name="check_circle" size={18} fill={true} />
                </span>
                <span>Setup en 15 min</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D phone graphic */}
          <div className="flex justify-center items-center relative mt-4 lg:mt-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqLEUMPGuzyQZwRDQJvDNFYK7cO2nc4wxLi43yTgyFWZ8k9lG5w_DfxEbNNSC6PrB4XaX990vp10SeDnbPDaFh0q6nf-7t4SSyIUtt2aId1DegMl9fXFqIv7z1SKJaf6qJNAjGt-i361dVi3XdOmRK5BG4W9Mp_reQlINYkSS9aiESXItjtWWAegOiRgJo9pnK86gtrYJbS4AUYBd9Q8PLAwkQjGO_eKxwSEblPga4MBWdt8X1m3Vhbw"
              alt="Interfaz 3D de Nexofood en smartphone"
              className="w-full max-w-70 sm:max-w-90 lg:max-w-120 drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)] animate-float"
            />
          </div>
        </div>
      </Container>
    </section>
  );
};
