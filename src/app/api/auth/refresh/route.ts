import { NextResponse } from "next/server";
import { axiosServer } from "@/lib/axios";
import {
  getRefreshToken,
  setAuthCookies,
  removeAuthCookies,
} from "@/lib/auth-cookies";

/**
 * Route Handler que actúa como proxy seguro para refrescar tokens.
 * Se ejecuta en el runtime del servidor de Next.js, por lo que tiene
 * acceso a las cookies httpOnly sin exponerlas al cliente JavaScript.
 */
export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 401 }
      );
    }

    // Petición al backend principal de autenticación
    const response = await axiosServer.post<{
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>("/auth/refresh", {
      refreshToken,
    });

    const accessToken = response.data.accessToken || response.data.token;
    const newRefreshToken = response.data.refreshToken || refreshToken;

    if (!accessToken) {
      throw new Error("Invalid refresh response from backend");
    }

    // Actualizar cookies seguras httpOnly
    await setAuthCookies({
      accessToken,
      refreshToken: newRefreshToken,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Si la renovación falla, se eliminan las credenciales expiradas
    await removeAuthCookies();
    return NextResponse.json(
      { error: "Session expired or invalid refresh token" },
      { status: 401 }
    );
  }
}
