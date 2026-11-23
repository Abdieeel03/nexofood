import { NextResponse, type NextRequest } from "next/server";
import type { AuthResponse } from "@/schemas/auth.schema";
import { ApiError, SERVER_API_BASE_URL } from "@/lib/axios";
import {
  applyAuthCookiesToResponse,
  clearAuthCookiesOnResponse,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth-cookies";
import { refreshTokensSingleFlight } from "@/lib/server-refresh";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const PUBLIC_AUTH_PATH_RE =
  /^(?:auth\/(?:login|register|refresh)|store\/[^/]+\/auth\/(?:login|register))$/;

function validateAndNormalizePath(segments: string[] | undefined): {
  ok: true;
  joined: string;
} | {
  ok: false;
  status: number;
  error: string;
  message: string;
} {
  if (!segments || segments.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "BAD_REQUEST",
      message: "Ruta BFF inválida o vacía",
    };
  }

  const normalized: string[] = [];
  for (const segment of segments) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return {
        ok: false,
        status: 400,
        error: "BAD_REQUEST",
        message: "Segmento de ruta malformado",
      };
    }

    if (
      !decoded ||
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("..") ||
      decoded.includes("/") ||
      decoded.includes("\\") ||
      decoded.includes("\0")
    ) {
      return {
        ok: false,
        status: 400,
        error: "BAD_REQUEST",
        message: "Ruta no permitida",
      };
    }

    normalized.push(encodeURIComponent(decoded));
  }

  const joined = normalized.join("/");
  const lower = joined.toLowerCase();
  if (lower === "webhooks" || lower.startsWith("webhooks/")) {
    return {
      ok: false,
      status: 403,
      error: "FORBIDDEN",
      message: "Los endpoints de webhooks no son accesibles desde el frontend",
    };
  }

  return { ok: true, joined };
}

function buildForwardHeaders(
  request: NextRequest,
  accessToken: string | undefined
): Headers {
  const headers = new Headers();

  const accept = request.headers.get("accept");
  headers.set("Accept", accept || "application/json");

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const requestId = request.headers.get("x-request-id");
  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    headers.set("Accept-Language", acceptLanguage);
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

function copyBackendResponseHeaders(backendRes: Response): Headers {
  const resHeaders = new Headers();

  const contentType = backendRes.headers.get("content-type");
  if (contentType) {
    resHeaders.set("Content-Type", contentType);
  }

  const retryAfter = backendRes.headers.get("retry-after");
  if (retryAfter) {
    resHeaders.set("Retry-After", retryAfter);
  }

  const rateLimitRemaining = backendRes.headers.get("x-rate-limit-remaining");
  if (rateLimitRemaining !== null) {
    resHeaders.set("X-Rate-Limit-Remaining", rateLimitRemaining);
  }

  return resHeaders;
}

async function handleProxyRequest(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  const validation = validateAndNormalizePath(path);

  if (!validation.ok) {
    return NextResponse.json(
      {
        message: validation.message,
        error: validation.error,
        status: validation.status,
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
        method: request.method,
      },
      { status: validation.status }
    );
  }

  const targetUrl = `${SERVER_API_BASE_URL}/${validation.joined}${request.nextUrl.search}`;
  const isPublicAuthPath = PUBLIC_AUTH_PATH_RE.test(validation.joined);

  let accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  let rotatedTokens: AuthResponse | null = null;
  let shouldClearCookies = false;

  // Si falta el access token pero hay refresh token, renovar antes de llamar al backend
  if (!accessToken && refreshToken && !isPublicAuthPath) {
    try {
      rotatedTokens = await refreshTokensSingleFlight(refreshToken);
      accessToken = rotatedTokens.accessToken;
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const headers = new Headers();
        if (error.retryAfter !== undefined) {
          headers.set("Retry-After", String(error.retryAfter));
        }
        return NextResponse.json(
          {
            message: error.message,
            error: "TOO_MANY_REQUESTS",
            status: 429,
            timestamp: new Date().toISOString(),
            path: request.nextUrl.pathname,
            method: request.method,
          },
          { status: 429, headers }
        );
      }
      shouldClearCookies = true;
      accessToken = undefined;
    }
  }

  const method = request.method.toUpperCase();
  const bodyBuffer =
    method !== "GET" && method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;
  const bodyPayload =
    bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined;

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method,
      headers: buildForwardHeaders(request, accessToken),
      body: bodyPayload,
      cache: "no-store",
      signal: request.signal,
    });

    // Ante 401 del backend con refresh token disponible, renovar una sola vez en single-flight y reintentar
    if (
      backendRes.status === 401 &&
      refreshToken &&
      !isPublicAuthPath &&
      !rotatedTokens
    ) {
      try {
        rotatedTokens = await refreshTokensSingleFlight(refreshToken);
        accessToken = rotatedTokens.accessToken;

        backendRes = await fetch(targetUrl, {
          method,
          headers: buildForwardHeaders(request, accessToken),
          body: bodyPayload,
          cache: "no-store",
          signal: request.signal,
        });
      } catch (refreshError) {
        if (refreshError instanceof ApiError && refreshError.status === 429) {
          const headers = new Headers();
          if (refreshError.retryAfter !== undefined) {
            headers.set("Retry-After", String(refreshError.retryAfter));
          }
          return NextResponse.json(
            {
              message: refreshError.message,
              error: "TOO_MANY_REQUESTS",
              status: 429,
              timestamp: new Date().toISOString(),
              path: request.nextUrl.pathname,
              method: request.method,
            },
            { status: 429, headers }
          );
        }
        shouldClearCookies = true;
      }
    }
  } catch {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 499 });
    }
    return NextResponse.json(
      {
        message: "No se pudo conectar con el servidor de NexoFood",
        error: "BAD_GATEWAY",
        status: 502,
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
        method: request.method,
      },
      { status: 502 }
    );
  }

  const resHeaders = copyBackendResponseHeaders(backendRes);
  const isEventStream =
    backendRes.ok &&
    backendRes.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("text/event-stream") &&
    backendRes.body !== null;

  let nextRes: NextResponse;
  if (isEventStream) {
    resHeaders.set("Cache-Control", "no-cache, no-transform");
    resHeaders.set("X-Accel-Buffering", "no");
    resHeaders.set("Connection", "keep-alive");
    nextRes = new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } else if (
    backendRes.status === 204 ||
    backendRes.status === 205 ||
    backendRes.status === 304
  ) {
    nextRes = new NextResponse(null, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } else {
    const resBuffer = await backendRes.arrayBuffer();
    nextRes = new NextResponse(resBuffer.byteLength > 0 ? resBuffer : null, {
      status: backendRes.status,
      headers: resHeaders,
    });
  }

  if (rotatedTokens) {
    applyAuthCookiesToResponse(nextRes, {
      accessToken: rotatedTokens.accessToken,
      refreshToken: rotatedTokens.refreshToken,
      expiresIn: rotatedTokens.expiresIn,
    });
  } else if (shouldClearCookies) {
    clearAuthCookiesOnResponse(nextRes);
  }

  return nextRes;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxyRequest(request, context);
}
