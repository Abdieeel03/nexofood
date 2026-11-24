import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/axios";
import { isSafeInternalRedirect } from "@/lib/auth-constants";
import {
  applyAuthCookiesToResponse,
  clearAuthCookiesOnResponse,
  getRefreshToken,
} from "@/lib/auth-cookies";
import { refreshTokensSingleFlight } from "@/lib/server-refresh";

export const dynamic = "force-dynamic";

/**
 * Renovación programática vía POST desde cliente.
 */
export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return clearAuthCookiesOnResponse(
      NextResponse.json(
        { error: "No refresh token available" },
        { status: 401 }
      )
    );
  }

  try {
    const tokens = await refreshTokensSingleFlight(refreshToken);
    return applyAuthCookiesToResponse(NextResponse.json({ success: true }), {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      const headers = new Headers();
      if (error.retryAfter !== undefined) {
        headers.set("Retry-After", String(error.retryAfter));
      }
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers }
      );
    }

    return clearAuthCookiesOnResponse(
      NextResponse.json(
        { error: "Session expired or invalid refresh token" },
        { status: 401 }
      )
    );
  }
}

/**
 * Renovación silenciosa en navegaciones SSR cuando el access token expiró
 * pero el refresh token sigue vigente (`src/proxy.ts` redirige aquí con `?next=...`).
 */
export async function GET(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get("next");
  const safeNext =
    isSafeInternalRedirect(nextParam) && !nextParam.startsWith("/api/auth/")
      ? nextParam
      : "/dashboard";

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("session_expired", "true");
  if (
    isSafeInternalRedirect(nextParam) &&
    nextParam !== "/" &&
    !nextParam.startsWith("/api/auth/")
  ) {
    loginUrl.searchParams.set("callbackUrl", nextParam);
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return clearAuthCookiesOnResponse(NextResponse.redirect(loginUrl, 302));
  }

  try {
    const tokens = await refreshTokensSingleFlight(refreshToken);
    const targetUrl = new URL(safeNext, request.url);
    return applyAuthCookiesToResponse(NextResponse.redirect(targetUrl, 302), {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch {
    return clearAuthCookiesOnResponse(NextResponse.redirect(loginUrl, 302));
  }
}
