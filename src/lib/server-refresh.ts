import { authResponseSchema, type AuthResponse } from "@/schemas/auth.schema";
import { apiResponseSchema } from "@/schemas/common.schema";
import { ApiError, parseRetryAfterSeconds, SERVER_API_BASE_URL } from "./axios";

const RECENT_CACHE_TTL_MS = 5000;

const inFlightRefreshes = new Map<string, Promise<AuthResponse>>();
const recentRefreshResults = new Map<
  string,
  { tokens: AuthResponse; cachedAt: number }
>();

const authEnvelopeSchema = apiResponseSchema(authResponseSchema);

function pruneExpiredCache(now: number): void {
  for (const [key, entry] of recentRefreshResults.entries()) {
    if (now - entry.cachedAt > RECENT_CACHE_TTL_MS) {
      recentRefreshResults.delete(key);
    }
  }
}

/**
 * Ejecuta la renovación de tokens contra `POST /auth/refresh` usando
 * deduplicación en vuelo (`inFlightRefreshes`) + caché breve de 5 segundos
 * indexada por el `refreshToken` entrante.
 *
 * Previene la revocación total de sesiones por detección de reuso cuando
 * múltiples peticiones concurrentes (RSC, BFF o navegación) intentan
 * rotar simultáneamente el mismo refresh token.
 */
export async function refreshTokensSingleFlight(
  refreshToken: string
): Promise<AuthResponse> {
  const now = Date.now();
  pruneExpiredCache(now);

  const cached = recentRefreshResults.get(refreshToken);
  if (cached && now - cached.cachedAt <= RECENT_CACHE_TTL_MS) {
    return cached.tokens;
  }

  const existingPromise = inFlightRefreshes.get(refreshToken);
  if (existingPromise) {
    return existingPromise;
  }

  const refreshPromise = (async (): Promise<AuthResponse> => {
    const response = await fetch(`${SERVER_API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    const retryAfter = parseRetryAfterSeconds(
      response.headers.get("retry-after")
    );

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (!response.ok) {
      const message =
        json &&
        typeof json === "object" &&
        "message" in json &&
        typeof (json as { message: unknown }).message === "string"
          ? (json as { message: string }).message
          : "No se pudo renovar la sesión";

      throw new ApiError(
        response.status,
        response.statusText,
        json,
        message,
        retryAfter
      );
    }

    const parsed = authEnvelopeSchema.safeParse(json);
    if (!parsed.success || !parsed.data.success) {
      throw new ApiError(
        401,
        "Unauthorized",
        json,
        "Respuesta inválida al renovar el token de sesión"
      );
    }

    const tokens = parsed.data.data;
    recentRefreshResults.set(refreshToken, {
      tokens,
      cachedAt: Date.now(),
    });

    return tokens;
  })();

  inFlightRefreshes.set(refreshToken, refreshPromise);

  try {
    return await refreshPromise;
  } finally {
    inFlightRefreshes.delete(refreshToken);
  }
}
