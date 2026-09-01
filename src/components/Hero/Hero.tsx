"use client";

import React, { useState } from "react";
import styles from "./Hero.module.css";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

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
    <section className={styles.hero} id="inicio">
      {/* Background Image & Overlay */}
      <div className={styles.bgWrapper}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsJFFgSXS3EpKfWPjM390_qRj9gqslcIQQ1qvAVwWjfASrzu0QoJMV63dHXtBY01x5iMHQHDEhNaQzs801p7Ig8ZHszxsey4KdPL7Ak3cm6I_O5BF_SjN1H8yMn7eQ0dec5yXZUo_iyuy8GeZ5Sjpbr87zAkiqhtaJZclTEC0f4HY1wu1WhGKUXB7h7nkGj9n-5Zh9kFKmpgaKI0UQmlfdp2AB5BmTYEmAGim_QJ39XZvj_isDJ6jg2A"
          alt="Cocina moderna gastronómica de alta tecnología"
          className={styles.bgImage}
        />
        <div className={styles.bgOverlay} />
      </div>

      <Container>
        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Pill Badge */}
            <div className={styles.pillBadge}>
              <span className={styles.badgeIcon}>
                <Icon name="rocket_launch" size={16} fill={true} />
              </span>
              <span className={styles.badgeText}>
                La plataforma #1 para gastronomía
              </span>
            </div>

            {/* Headline */}
            <h1 className={styles.title}>
              Tu negocio gastronómico va a{" "}
              <span className={styles.highlight}>
                vender más
                <svg
                  className={styles.highlightSvg}
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
            <p className={styles.description}>
              Crea tu tienda online, gestiona pedidos de todas las plataformas y
              fideliza a tus clientes. Todo desde un único panel diseñado para
              el ritmo acelerado de tu cocina.
            </p>

            {/* Email form */}
            <form onSubmit={handleSubmit} className={styles.formWrapper}>
              <div className={styles.inputGroup}>
                <span className={styles.inputIcon}>
                  <Icon name="mail" size={20} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  className={styles.emailInput}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon="arrow_forward"
              >
                Empieza tu prueba gratis
              </Button>
            </form>

            {/* Trust Badges */}
            <div className={styles.trustBadges}>
              <div className={styles.trustBadgeItem}>
                <span className={styles.trustBadgeIcon}>
                  <Icon name="check_circle" size={18} fill={true} />
                </span>
                <span>14 días gratis</span>
              </div>
              <div className={styles.trustBadgeItem}>
                <span className={styles.trustBadgeIcon}>
                  <Icon name="check_circle" size={18} fill={true} />
                </span>
                <span>Sin contratos</span>
              </div>
              <div className={styles.trustBadgeItem}>
                <span className={styles.trustBadgeIcon}>
                  <Icon name="check_circle" size={18} fill={true} />
                </span>
                <span>Setup en 15 min</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D phone graphic */}
          <div className={styles.rightColumn}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqLEUMPGuzyQZwRDQJvDNFYK7cO2nc4wxLi43yTgyFWZ8k9lG5w_DfxEbNNSC6PrB4XaX990vp10SeDnbPDaFh0q6nf-7t4SSyIUtt2aId1DegMl9fXFqIv7z1SKJaf6qJNAjGt-i361dVi3XdOmRK5BG4W9Mp_reQlINYkSS9aiESXItjtWWAegOiRgJo9pnK86gtrYJbS4AUYBd9Q8PLAwkQjGO_eKxwSEblPga4MBWdt8X1m3Vhbw"
              alt="Interfaz 3D de Nexofood en smartphone"
              className={`${styles.mockupImage} animate-float`}
            />
          </div>
        </div>
      </Container>
    </section>
  );
};
