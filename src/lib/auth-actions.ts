"use server";

import { redirect } from "next/navigation";
import {
  authResponseSchema,
  loginRequestSchema,
  userRegisterRequestSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterFormValues,
  type TenantStaffMembershipDto,
  type UserRegisterRequest,
  type UserResponse,
} from "@/schemas/auth.schema";
import { cleanPayload } from "@/schemas/common.schema";
import {
  storeAuthResponseSchema,
  storeLoginRequestSchema,
  storeRegisterRequestSchema,
  type StoreAuthResponse,
  type StoreLoginRequest,
  type StoreRegisterFormValues,
  type StoreRegisterRequest,
  type TenantCustomerResponse,
} from "@/schemas/tenant.schema";
import { apiServer, ApiError } from "@/lib/api-server";
import { isSafeInternalRedirect } from "@/lib/auth-constants";
import {
  getAccessToken,
  getRefreshToken,
  removeAuthCookies,
  setAuthCookies,
} from "@/lib/auth-cookies";

export interface AuthActionError {
  success: false;
  error: string;
  status?: number;
  retryAfter?: number;
}

export type LoginActionResult =
  | {
      success: true;
      user: UserResponse;
      staffMemberships: TenantStaffMembershipDto[];
    }
  | AuthActionError;

export type RegisterActionResult =
  | {
      success: true;
      user: UserResponse;
    }
  | AuthActionError;

export type StoreAuthActionResult =
  | {
      success: true;
      user: UserResponse;
      customerProfile: TenantCustomerResponse;
    }
  | AuthActionError;

function mapActionError(error: unknown, fallback: string): AuthActionError {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      const waitSeconds = error.retryAfter ?? 60;
      return {
        success: false,
        error:
          error.message ||
          `Demasiados intentos. Por favor, espera ${waitSeconds} segundos.`,
        status: 429,
        retryAfter: error.retryAfter,
      };
    }

    return {
      success: false,
      error: error.message || fallback,
      status: error.status,
      retryAfter: error.retryAfter,
    };
  }

  return {
    success: false,
    error: fallback,
  };
}

export async function loginAction(
  data: LoginRequest
): Promise<LoginActionResult> {
  const parsed = loginRequestSchema.safeParse({
    email: data.email?.trim(),
    password: data.password,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de acceso inválidos",
      status: 400,
    };
  }

  try {
    const authRes = await apiServer.post<AuthResponse>(
      "/auth/login",
      cleanPayload(parsed.data),
      { schema: authResponseSchema }
    );

    await setAuthCookies({
      accessToken: authRes.accessToken,
      refreshToken: authRes.refreshToken,
      expiresIn: authRes.expiresIn,
    });

    return {
      success: true,
      user: authRes.user,
      staffMemberships: authRes.staffMemberships ?? [],
    };
  } catch (error) {
    return mapActionError(error, "Credenciales inválidas");
  }
}

export async function registerAction(
  data: UserRegisterRequest | RegisterFormValues
): Promise<RegisterActionResult> {
  const payload = cleanPayload({
    email: data.email?.trim(),
    password: data.password,
    fullName: data.fullName?.trim(),
    phone:
      typeof data.phone === "string" && data.phone.trim().length > 0
        ? data.phone.trim()
        : undefined,
  });

  const parsed = userRegisterRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de registro inválidos",
      status: 400,
    };
  }

  try {
    const authRes = await apiServer.post<AuthResponse>(
      "/auth/register",
      cleanPayload(parsed.data),
      { schema: authResponseSchema }
    );

    await setAuthCookies({
      accessToken: authRes.accessToken,
      refreshToken: authRes.refreshToken,
      expiresIn: authRes.expiresIn,
    });

    return {
      success: true,
      user: authRes.user,
    };
  } catch (error) {
    return mapActionError(error, "Error al registrar el usuario");
  }
}

export async function storeLoginAction(
  slug: string,
  data: StoreLoginRequest
): Promise<StoreAuthActionResult> {
  const parsed = storeLoginRequestSchema.safeParse({
    email: data.email?.trim(),
    password: data.password,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de acceso inválidos",
      status: 400,
    };
  }

  try {
    const authRes = await apiServer.post<StoreAuthResponse>(
      `/store/${encodeURIComponent(slug)}/auth/login`,
      cleanPayload(parsed.data),
      { schema: storeAuthResponseSchema }
    );

    await setAuthCookies({
      accessToken: authRes.accessToken,
      refreshToken: authRes.refreshToken,
      expiresIn: authRes.expiresIn,
    });

    return {
      success: true,
      user: authRes.user,
      customerProfile: authRes.customerProfile,
    };
  } catch (error) {
    return mapActionError(error, "No se pudo iniciar sesión en la tienda");
  }
}

export async function storeRegisterAction(
  slug: string,
  data: StoreRegisterRequest | StoreRegisterFormValues
): Promise<StoreAuthActionResult> {
  const payload = cleanPayload({
    fullName: data.fullName?.trim(),
    email: data.email?.trim(),
    password: data.password,
    phone:
      typeof data.phone === "string" && data.phone.trim().length > 0
        ? data.phone.trim()
        : undefined,
  });

  const parsed = storeRegisterRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de registro inválidos",
      status: 400,
    };
  }

  try {
    const authRes = await apiServer.post<StoreAuthResponse>(
      `/store/${encodeURIComponent(slug)}/auth/register`,
      cleanPayload(parsed.data),
      { schema: storeAuthResponseSchema }
    );

    await setAuthCookies({
      accessToken: authRes.accessToken,
      refreshToken: authRes.refreshToken,
      expiresIn: authRes.expiresIn,
    });

    return {
      success: true,
      user: authRes.user,
      customerProfile: authRes.customerProfile,
    };
  } catch (error) {
    return mapActionError(error, "No se pudo completar el registro en la tienda");
  }
}

export async function logoutAction(redirectTo = "/"): Promise<never> {
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
    // Cierre de sesión best-effort: siempre limpiamos cookies locales aunque el backend rechace el token
  } finally {
    await removeAuthCookies();
  }

  const safeTarget = isSafeInternalRedirect(redirectTo) ? redirectTo : "/";
  redirect(safeTarget);
}

export async function clearSessionAction(): Promise<void> {
  await removeAuthCookies();
}
