import React from "react";
import styles from "./Testimonials.module.css";
import { Container } from "../ui/Container";
import { SectionWrapper } from "../ui/SectionWrapper";
import { Icon } from "../ui/Icon";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  location: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Antes perdíamos hasta el 28% de cada venta en comisiones de apps. Con la tienda propia de Nexofood pasamos el 45% de nuestras ventas a canal directo y ahorramos más de $2,400 USD mensuales.",
    author: "Martín Benítez",
    role: "Fundador en Burger Republic",
    location: "Lima, Perú",
    initials: "MB",
  },
  {
    quote:
      "El KDS en cocina cambió el caos del fin de semana por un despacho ordenado. Cero comandas extraviadas y redujimos el tiempo de preparación promedio de 26 a 17 minutos.",
    author: "Camila Restrepo",
    role: "Chef Ejecutiva en Takumi Nikkei",
    location: "Bogotá, Colombia",
    initials: "CR",
  },
  {
    quote:
      "El tracking en vivo y los mensajes por WhatsApp hicieron que los clientes dejen de llamar preguntando por su pedido. La fidelización y pedidos recurrentes subieron un 35%.",
    author: "Esteban Morales",
    role: "Director de Operaciones en Donatello Pizza",
    location: "Buenos Aires, Argentina",
    initials: "EM",
  },
];

export const Testimonials: React.FC = () => {
  return (
    <SectionWrapper background="default" padding="lg" id="casos-de-exito">
      <Container>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.pillBadge}>
            <Icon name="star" size={16} fill={true} />
            <span>Casos de Éxito</span>
          </div>
          <h2 className={styles.title}>
            Probado y aprobado en cocinas de alto ritmo
          </h2>
          <p className={styles.subtitle}>
            Descubre cómo dueños de restaurantes y franquicias transformaron sus
            operaciones diarias y dispararon su rentabilidad neta.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className={styles.grid}>
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.rating} aria-label="Calificación 5 estrellas">
                {[...Array(5)].map((_, sIdx) => (
                  <Icon key={sIdx} name="star" size={18} fill={true} />
                ))}
              </div>

              <p className={styles.quote}>"{t.quote}"</p>

              <div className={styles.authorWrapper}>
                <div className={styles.avatar}>{t.initials}</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{t.author}</span>
                  <span className={styles.authorRole}>
                    {t.role} · {t.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
};
