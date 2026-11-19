import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Política de Privacidad | NexoFood",
  description: "Cómo NexoFood recopila, usa y protege tus datos personales.",
};

const sections: LegalSection[] = [
  {
    id: "datos",
    title: "Datos que recopilamos",
    paragraphs: ["Según cómo uses la plataforma, tratamos:"],
    items: [
      "Cuenta: nombre completo, correo electrónico, teléfono (opcional) y contraseña (almacenada de forma cifrada).",
      "Direcciones de entrega: etiqueta, dirección, referencia y coordenadas geográficas (latitud y longitud).",
      "Pedidos: productos, notas, RUC (opcional), importes, impuestos, estado y tipo de entrega.",
      "Pagos: estado, monto y medio de pago informados por Mercado Pago. No almacenamos datos completos de tarjetas.",
      "Ubicación en vivo: si eres repartidor, tu posición GPS durante entregas; si eres comensal, solo la ubicación que elijas para estimar cobertura.",
      "Datos técnicos: identificadores de solicitud y registros de seguridad (por ejemplo, intentos de acceso).",
    ],
  },
  {
    id: "uso",
    title: "Finalidades del tratamiento",
    paragraphs: [
      "Usamos tus datos para autenticarte, procesar y entregar pedidos, calcular cobertura y tiempos de entrega, gestionar pagos y reembolsos, administrar suscripciones de restaurantes, prevenir fraude y cumplir obligaciones legales y tributarias.",
    ],
  },
  {
    id: "compartir",
    title: "Con quién compartimos tus datos",
    paragraphs: ["Compartimos únicamente lo necesario con:"],
    items: [
      "El restaurante al que le haces un pedido (nombre, contacto, dirección de entrega, detalle del pedido y puntos de lealtad).",
      "Mercado Pago, para procesar pagos y suscripciones.",
      "Proveedores de infraestructura necesarios para operar el servicio.",
      "Autoridades, cuando la ley lo exija.",
    ],
  },
  {
    id: "mapas",
    title: "Mapas y ubicación",
    paragraphs: [
      "Los mapas usan teselas de OpenStreetMap, por lo que tu navegador realiza solicitudes a ese servicio al mostrarlos. Solo accedemos a tu ubicación con tu permiso y puedes revocarlo desde el navegador.",
    ],
  },
  {
    id: "sesion",
    title: "Sesión y cookies",
    paragraphs: [
      "Usamos cookies esenciales de sesión (httpOnly) para mantener tu inicio de sesión de forma segura; no son accesibles por scripts del navegador. No empleamos cookies publicitarias.",
    ],
  },
  {
    id: "conservacion",
    title: "Conservación",
    paragraphs: [
      "Conservamos tus datos mientras tu cuenta esté activa y por los plazos necesarios para obligaciones contables, tributarias y de resolución de disputas. Los pedidos conservan una copia fiscal inmutable.",
    ],
  },
  {
    id: "derechos",
    title: "Tus derechos",
    paragraphs: [
      "Conforme a la Ley N.º 29733 de Protección de Datos Personales del Perú, puedes acceder, rectificar, cancelar y oponerte al tratamiento de tus datos. Desde Mi cuenta puedes editar tu perfil, gestionar tus direcciones y eliminar tu cuenta.",
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad",
    paragraphs: [
      "Aplicamos medidas como tokens de corta duración con renovación rotativa, bloqueo temporal ante intentos fallidos, límites de frecuencia en autenticación y credenciales de Mercado Pago cifradas. Ningún sistema es infalible; avísanos si detectas un problema.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios y contacto",
    paragraphs: [
      "Podemos actualizar esta política; la fecha de última actualización indica la versión vigente. Para ejercer tus derechos, contacta al restaurante o al administrador de la plataforma por los canales que te indiquen.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidad"
      updatedAt="19 de noviembre de 2026"
      intro="Esta política explica qué datos personales trata NexoFood, para qué los usa y cuáles son tus derechos."
      sections={sections}
    />
  );
}
