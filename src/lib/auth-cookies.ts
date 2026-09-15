import { cookies } from "next/headers";

/**
 * Nombres de cookies seguras para almacenamiento de sesión
 */
export const AUTH_COOKIE_NAME = "nexofood_access_token";
export const REFRESH_COOKIE_NAME = "nexofood_refresh_token";

/**
 * Configuración base de seguridad para cookies httpOnly
 * - httpOnly: Inaccesible desde JavaScript en el cliente (Protección contra XSS)
 * - secure: Solo viaja en conexiones HTTPS en producción
 * - sameSite: 'lax' previene ataques CSRF en navegaciones externas
 * - path: '/' disponible en toda la aplicación
 */
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export interface SetAuthCookiesParams {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // En segundos
}

/**
 * Guarda los tokens JWT en cookies seguras httpOnly (Usar en Server Actions o Route Handlers)
 */
export async function setAuthCookies({
  accessToken,
  refreshToken,
  expiresIn = 3600, // 1 hora por defecto
}: SetAuthCookiesParams): Promise<void> {
  const cookieStore = await cookies();

  // Guardar Access Token
  cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: expiresIn,
  });

  // Guardar Refresh Token (7 días por defecto)
  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
  }
}

/**
 * Obtiene el access token actual desde la cookie httpOnly (Server-side)
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Obtiene el refresh token actual desde la cookie httpOnly (Server-side)
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value;
}

/**
 * Elimina las cookies de sesión (Cerrar sesión)
 */
export async function removeAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

/**
 * Comprueba si hay un access token activo
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return Boolean(token);
}
