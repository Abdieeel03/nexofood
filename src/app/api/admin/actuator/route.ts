import { NextResponse } from "next/server";
import { apiServer, ApiError } from "@/lib/api-server";
import { getAccessToken } from "@/lib/auth-cookies";
import { SERVER_API_BASE_URL } from "@/lib/axios";
import {
  userProfileResponseSchema,
  type UserProfileResponse,
} from "@/schemas/auth.schema";

export const dynamic = "force-dynamic";

export interface ActuatorEndpointResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown> | null;
  error: string | null;
}

export interface ActuatorSnapshotResponse {
  checkedAt: string;
  backendOrigin: string;
  health: ActuatorEndpointResult;
  info: ActuatorEndpointResult;
}

async function fetchActuatorEndpoint(
  url: string,
  accessToken: string
): Promise<ActuatorEndpointResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, application/vnd.spring-boot.actuator.v3+json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const contentType = res.headers.get("content-type") ?? "";
    let parsed: Record<string, unknown> | null = null;
    if (
      contentType.includes("json") ||
      contentType.includes("actuator")
    ) {
      try {
        const json: unknown = await res.json();
        if (json && typeof json === "object" && !Array.isArray(json)) {
          parsed = json as Record<string, unknown>;
        }
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      const serverMessage =
        parsed && typeof parsed.message === "string"
          ? parsed.message
          : `HTTP ${res.status} ${res.statusText}`.trim();
      return {
        ok: false,
        status: res.status,
        data: parsed,
        error: serverMessage,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsed,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo consultar Actuator";
    return {
      ok: false,
      status: 0,
      data: null,
      error: message,
    };
  }
}

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      {
        message: "No autorizado: sesión ausente o expirada",
        error: "UNAUTHORIZED",
        status: 401,
      },
      { status: 401 }
    );
  }

  let profile: UserProfileResponse;
  try {
    profile = await apiServer.get<UserProfileResponse>("/auth/me", {
      schema: userProfileResponseSchema,
      token: accessToken,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json(
        {
          message: "No autorizado: token inválido o expirado",
          error: "UNAUTHORIZED",
          status: 401,
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo verificar la identidad del administrador",
        error: "BAD_GATEWAY",
        status: 502,
      },
      { status: 502 }
    );
  }

  if (profile.systemRole !== "SUPERADMIN") {
    return NextResponse.json(
      {
        message: "Acceso denegado: requiere rol global SUPERADMIN",
        error: "FORBIDDEN",
        status: 403,
      },
      { status: 403 }
    );
  }

  const backendOrigin = SERVER_API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const [health, info] = await Promise.all([
    fetchActuatorEndpoint(`${backendOrigin}/actuator/health`, accessToken),
    fetchActuatorEndpoint(`${backendOrigin}/actuator/info`, accessToken),
  ]);

  const snapshot: ActuatorSnapshotResponse = {
    checkedAt: new Date().toISOString(),
    backendOrigin,
    health,
    info,
  };

  return NextResponse.json(snapshot, { status: 200 });
}
