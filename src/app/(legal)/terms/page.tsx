import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Términos del Servicio | NexoFood",
  description: "Condiciones de uso de la plataforma NexoFood para restaurantes y comensales.",
};

const sections: LegalSection[] = [
  {
    id: "aceptacion",
    title: "Aceptación de los términos",
    paragraphs: [
      "Al crear una cuenta, iniciar sesión o realizar un pedido en NexoFood aceptas estos Términos del Servicio. Si no estás de acuerdo, no utilices la plataforma.",
    ],
  },
  {
    id: "servicio",
    title: "Descripción del servicio",
    paragraphs: [
      "NexoFood es una plataforma SaaS multi-restaurante. Cada restaurante opera su propia tienda (por enlace directo o slug), catálogo, precios, personal y cobros. NexoFood provee la tecnología; la venta de alimentos es un contrato entre el comensal y el restaurante.",
    ],
  },
  {
    id: "cuentas",
    title: "Cuentas y seguridad",
    paragraphs: [
      "Eres responsable de la veracidad de tus datos y de la confidencialidad de tu contraseña. La contraseña debe tener entre 8 y 100 caracteres, con al menos una letra y un número, sin espacios.",
      "Tras cinco intentos fallidos de inicio de sesión la cuenta se bloquea temporalmente por 15 minutos. Al cambiar tu contraseña o eliminar tu cuenta, todas las sesiones activas se cierran.",
    ],
  },
  {
    id: "restaurantes",
    title: "Restaurantes (suscripción SaaS)",
    paragraphs: [
      "Para operar una tienda se requiere una suscripción vigente (prueba o plan activo). Cada usuario puede ser propietario de un solo restaurante. Los cobros recurrentes se procesan mediante Mercado Pago y puedes cancelar tu suscripción en cualquier momento; si es una prueba, el restaurante se desactiva al cancelar.",
      "El restaurante es responsable del contenido de su catálogo, precios, impuestos, disponibilidad, tiempos de entrega, cumplimiento sanitario y tributario, y del trato a su equipo.",
    ],
  },
  {
    id: "pedidos",
    title: "Pedidos, pagos y entregas",
    paragraphs: [
      "Los pedidos se pagan en línea mediante Mercado Pago. El pedido se registra una vez que el pago es aprobado; el stock puede agotarse durante el pago, en cuyo caso se realiza un reembolso automático.",
      "Los pedidos con delivery están sujetos a cobertura geográfica del restaurante. Las estimaciones de tiempo y distancia son referenciales.",
    ],
  },
  {
    id: "cancelaciones",
    title: "Cancelaciones y reembolsos",
    paragraphs: [
      "Como comensal puedes cancelar tu pedido únicamente mientras esté en estado Pendiente; se reembolsa el total y se restablece el stock. Una vez que el restaurante inicia la preparación, la cancelación solo puede ser gestionada por el restaurante.",
    ],
  },
  {
    id: "uso-aceptable",
    title: "Uso aceptable",
    paragraphs: ["Te comprometes a no:"],
    items: [
      "Usar la plataforma con fines ilícitos o fraudulentos.",
      "Intentar acceder a datos de otros usuarios o restaurantes.",
      "Interferir con la seguridad, disponibilidad o rendimiento del servicio.",
      "Automatizar solicitudes de forma abusiva (existen límites de frecuencia en autenticación).",
    ],
  },
  {
    id: "suspension",
    title: "Suspensión y terminación",
    paragraphs: [
      "Podemos suspender cuentas que incumplan estos términos. Un restaurante puede bloquear a un comensal en su tienda. Puedes eliminar tu cuenta cuando lo desees desde la sección Mi cuenta.",
    ],
  },
  {
    id: "responsabilidad",
    title: "Limitación de responsabilidad",
    paragraphs: [
      "NexoFood se ofrece \"tal cual\". En la medida permitida por la ley, no respondemos por la calidad, inocuidad o entrega de los alimentos, que son responsabilidad del restaurante, ni por interrupciones de servicios de terceros como Mercado Pago.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios y ley aplicable",
    paragraphs: [
      "Podemos actualizar estos términos; la fecha de última actualización indica la versión vigente. Se rigen por las leyes de la República del Perú.",
    ],
  },
  {
    id: "contacto",
    title: "Contacto",
    paragraphs: [
      "Para consultas sobre un pedido, contacta directamente al restaurante. Para asuntos de la plataforma, escribe al equipo de NexoFood a través de los canales indicados por tu restaurante o administrador.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos del Servicio"
      updatedAt="19 de noviembre de 2026"
      intro="Estos términos regulan el uso de NexoFood por parte de restaurantes, su personal y los comensales que realizan pedidos."
      sections={sections}
    />
  );
}
