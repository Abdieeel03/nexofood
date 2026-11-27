import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "NexoFood — Plataforma SaaS Gastronómica y Storefront",
    template: "%s | NexoFood",
  },
  description:
    "Plataforma SaaS multi-tenant para restaurantes: gestión de catálogo y precios, pedidos, pantalla de cocina (KDS), reparto con rastreo GPS en vivo y storefront con Mercado Pago.",
  keywords: [
    "NexoFood",
    "SaaS restaurantes",
    "pedidos online",
    "KDS cocina",
    "rastreo GPS delivery",
    "Mercado Pago",
    "storefront gastronómico",
  ],
  authors: [{ name: "NexoFood" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={plusJakartaSans.variable}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
