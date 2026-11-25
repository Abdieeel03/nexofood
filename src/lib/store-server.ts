import { notFound } from "next/navigation";
import { apiServer, ApiError } from "@/lib/api-server";
import { extractErrorStatus } from "@/lib/error-messages";
import { tenantResponseSchema, type TenantResponse } from "@/schemas/tenant.schema";

export type StoreTenantLookupResult =
  | { ok: true; tenant: TenantResponse }
  | { ok: false; errorStatus: number };

/**
 * Consulta un restaurante por `slug` en el servidor.
 * Si responde 404 invoca `notFound()`; ante cualquier otro fallo (400, 5xx, red)
 * devuelve el código de estado para renderizar `ErrorStateView` sin ocultar la causa.
 */
export async function resolveStoreTenantOrNotFound(
  slug: string
): Promise<StoreTenantLookupResult> {
  try {
    const tenant = await apiServer.get<TenantResponse>(
      `/tenants/slug/${encodeURIComponent(slug)}`,
      { schema: tenantResponseSchema }
    );
    return { ok: true, tenant };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return {
      ok: false,
      errorStatus: extractErrorStatus(error) ?? 500,
    };
  }
}
