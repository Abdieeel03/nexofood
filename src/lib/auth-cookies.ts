import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  DEFAULT_ACCESS_EXPIRES_IN,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_NAME,
} from "./auth-constants";

export { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./auth-constants";

export const BASE_COOKIE_OPTIONS = {
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
 * Guarda los tokens JWT en cookies seguras httpOnly (Server Actions / Route Handlers).
 */
export async function setAuthCookies({
  accessToken,
  refreshToken,
  expiresIn = DEFAULT_ACCESS_EXPIRES_IN,
}: SetAuthCookiesParams): Promise<void> {
  const cookieStore = await cookies();
  const maxAge =
    typeof expiresIn === "number" && expiresIn > 0
      ? expiresIn
      : DEFAULT_ACCESS_EXPIRES_IN;

  cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge,
  });

  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
}

/**
 * Obtiene el access token actual desde la cookie httpOnly (Server-side).
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Obtiene el refresh token actual desde la cookie httpOnly (Server-side).
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value;
}

/**
 * Elimina las cookies de sesión httpOnly.
 */
export async function removeAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

/**
 * Comprueba si hay un access token o refresh token presente en cookies.
 */
export async function hasSessionCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(
    cookieStore.get(AUTH_COOKIE_NAME)?.value ||
      cookieStore.get(REFRESH_COOKIE_NAME)?.value
  );
}

/**
 * Comprueba si existe una cookie de access token activa.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return Boolean(token);
}

/**
 * Adjunta cookies rotadas directamente sobre una instancia de `NextResponse`.
 */
export function applyAuthCookiesToResponse(
  res: NextResponse,
  tokens: SetAuthCookiesParams
): NextResponse {
  const maxAge =
    typeof tokens.expiresIn === "number" && tokens.expiresIn > 0
      ? tokens.expiresIn
      : DEFAULT_ACCESS_EXPIRES_IN;

  res.cookies.set(AUTH_COOKIE_NAME, tokens.accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge,
  });

  if (tokens.refreshToken) {
    res.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }

  return res;
}

/**
 * Expira explícitamente las cookies de sesión en una instancia de `NextResponse`.
 */
export function clearAuthCookiesOnResponse(res: NextResponse): NextResponse {
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
  });
  res.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return res;
}
