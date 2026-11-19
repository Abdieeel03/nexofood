"use client";

import { useParams, usePathname } from "next/navigation";

/**
 * Resuelve el `slug` de tienda activo a partir de los parámetros de ruta
 * o del pathname (`/store/[slug]/...`), excluyendo rutas estáticas como `/store/account`.
 */
export function useActiveStoreSlug(): string | null {
  const params = useParams<{ slug?: string | string[] }>();
  const pathname = usePathname();

  const rawParam = params?.slug;
  if (typeof rawParam === "string" && rawParam.trim().length > 0) {
    try {
      return decodeURIComponent(rawParam);
    } catch {
      return rawParam;
    }
  }

  const match = pathname?.match(/^\/store\/([^/]+)/);
  if (match && match[1] && match[1] !== "account") {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  return null;
}
