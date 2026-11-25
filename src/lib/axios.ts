import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { errorResponseSchema } from "@/schemas/common.schema";
import { isProtectedPath } from "./auth-constants";
import { formatFriendlyApiMessage } from "./error-messages";

// ─── Constantes de Base URL ───────────────────────────────────────────────────

export const API_BASE_URL = "/api/bff";

export const SERVER_API_BASE_URL = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api/v1"
).replace(/\/+$/, "");

// ─── Error Tipado de API ──────────────────────────────────────────────────────

export function parseRetryAfterSeconds(headerValue: unknown): number | undefined {
  if (typeof headerValue === "number" && Number.isFinite(headerValue)) {
    return Math.max(0, Math.ceil(headerValue));
  }
  if (typeof headerValue !== "string") return undefined;

  const trimmed = headerValue.trim();
  if (!trimmed) return undefined;

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  const parsedDate = Date.parse(trimmed);
  if (!Number.isNaN(parsedDate)) {
    return Math.max(0, Math.ceil((parsedDate - Date.now()) / 1000));
  }

  return undefined;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    message?: string,
    public retryAfter?: number
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status ?? 0;
    const statusText =
      error.response?.statusText ?? (error.code || "Network Error");
    const data = error.response?.data;
    const retryAfter = parseRetryAfterSeconds(
      error.response?.headers?.["retry-after"]
    );

    const parsedError = errorResponseSchema.safeParse(data);
    let message = error.message;

    if (parsedError.success && parsedError.data.message.trim().length > 0) {
      message = parsedError.data.message;
    } else if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string" &&
      (data as { message: string }).message.trim().length > 0
    ) {
      message = (data as { message: string }).message;
    } else if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      message = (data as { error: string }).error;
    }

    return new ApiError(status, statusText, data, message, retryAfter);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un inconveniente inesperado. Por favor inténtalo nuevamente."
): string {
  return formatFriendlyApiMessage(error, fallback);
}

// ─── Instancia CLIENTE (Browser -> BFF Proxy `/api/bff`) ─────────────────────

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Instancia SERVIDOR (SSR / Server Actions -> Backend directo) ──────────────

export const axiosServer = axios.create({
  baseURL: SERVER_API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request Interceptor (Cliente) ───────────────────────────────────────────

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      config.headers.set("X-Request-Id", crypto.randomUUID());
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Cliente) ──────────────────────────────────────────
// El BFF `/api/bff` ya ejecuta single-flight refresh ante 401 del backend.
// Si el navegador aún recibe 401, la sesión expiró o no existe: redirigir a
// `/?session_expired=true` SOLO en rutas SaaS/Admin/Account protegidas.

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const { pathname } = window.location;
      if (isProtectedPath(pathname)) {
        const loginUrl = new URL("/", window.location.origin);
        loginUrl.searchParams.set("session_expired", "true");
        loginUrl.searchParams.set("callbackUrl", pathname);
        window.location.href = loginUrl.toString();
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helper de Autorización en Servidor ──────────────────────────────────────

export function applyServerTokenInterceptor(
  token: string | undefined
): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
