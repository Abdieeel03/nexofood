import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { errorResponseSchema } from "@/schemas/common.schema";
import { isProtectedPath } from "./auth-constants";

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

const GENERIC_AXIOS_MESSAGE_RE = /^Request failed with status code \d{3}$/i;

function extractMessageFromErrorPayload(data: unknown): string | undefined {
  let payload = data;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        payload = JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    } else {
      return trimmed;
    }
  }

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const parsedError = errorResponseSchema.safeParse(payload);
  if (parsedError.success && parsedError.data.message.trim().length > 0) {
    return parsedError.data.message.trim();
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim().length > 0) {
    return record.message.trim();
  }

  if (typeof record.detail === "string" && record.detail.trim().length > 0) {
    return record.detail.trim();
  }

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const first = record.errors[0];
    if (typeof first === "string" && first.trim().length > 0) {
      return first.trim();
    }
    if (
      first &&
      typeof first === "object" &&
      "message" in first &&
      typeof (first as { message: unknown }).message === "string" &&
      (first as { message: string }).message.trim().length > 0
    ) {
      return (first as { message: string }).message.trim();
    }
  }

  if (typeof record.error === "string" && record.error.trim().length > 0) {
    return record.error.trim();
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

    const extracted = extractMessageFromErrorPayload(data);
    const message = extracted || error.message;

    return new ApiError(status, statusText, data, message, retryAfter);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado. Intenta nuevamente."
): string {
  if (axios.isAxiosError(error)) {
    const extracted = extractMessageFromErrorPayload(error.response?.data);
    if (extracted) return extracted;
    if (error.message && !GENERIC_AXIOS_MESSAGE_RE.test(error.message.trim())) {
      return error.message;
    }
    return fallback;
  }

  if (error instanceof ApiError) {
    const extracted = extractMessageFromErrorPayload(error.data);
    if (extracted) return extracted;
    if (error.message && !GENERIC_AXIOS_MESSAGE_RE.test(error.message.trim())) {
      return error.message;
    }
    return fallback;
  }

  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const extracted = extractMessageFromErrorPayload(response?.data);
    if (extracted) return extracted;
  }

  if (error instanceof Error) {
    if (error.message && !GENERIC_AXIOS_MESSAGE_RE.test(error.message.trim())) {
      return error.message;
    }
    return fallback;
  }

  return fallback;
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
