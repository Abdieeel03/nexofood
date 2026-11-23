import { NextResponse } from "next/server";
import { apiServer } from "@/lib/api-server";
import {
  clearAuthCookiesOnResponse,
  getAccessToken,
  getRefreshToken,
  removeAuthCookies,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      getAccessToken(),
      getRefreshToken(),
    ]);

    if (accessToken && refreshToken) {
      await apiServer.post(
        "/auth/logout",
        { refreshToken },
        { token: accessToken }
      );
    }
  } catch {
    // Cierre de sesión best-effort: siempre limpiamos cookies locales
  } finally {
    await removeAuthCookies();
  }

  return clearAuthCookiesOnResponse(NextResponse.json({ success: true }));
}
