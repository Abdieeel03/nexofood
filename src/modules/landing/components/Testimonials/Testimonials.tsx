import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Icon } from "@/components/ui/Icon";

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
        <div className="text-center max-w-190 mx-auto mb-10 md:mb-14 flex flex-col items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-primary text-xs font-bold uppercase tracking-wider">
            <Icon name="star" size={16} fill={true} />
            <span>Casos de Éxito</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight sm:leading-snug">
            Probado y aprobado en cocinas de alto ritmo
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-on-surface-variant leading-relaxed">
            Descubre cómo dueños de restaurantes y franquicias transformaron sus
            operaciones diarias y dispararon su rentabilidad neta.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-130 lg:max-w-none mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-level-1 flex flex-col justify-between gap-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-level-2 hover:border-primary-container"
            >
              <div className="flex gap-0.5 text-amber-500" aria-label="Calificación 5 estrellas">
                {[...Array(5)].map((_, sIdx) => (
                  <Icon key={sIdx} name="star" size={18} fill={true} />
                ))}
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-on-surface italic grow">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3.5 border-t border-surface-container pt-4">
                <div className="w-11 h-11 rounded-full bg-linear-to-br from-primary-container to-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {t.initials}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">
                    {t.author}
                  </span>
                  <span className="text-xs text-on-surface-variant">
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
