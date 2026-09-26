import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ─── Constantes ───────────────────────────────────────────────────────
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api";

// ─── Instancia CLIENTE (Browser) ──────────────────────────────────────
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true, // Envía cookies httpOnly automáticamente desde el navegador
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Instancia SERVIDOR (SSR / Server Actions / Route Handlers) ────────
export const axiosServer = axios.create({
  baseURL: SERVER_API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── REQUEST INTERCEPTOR (Cliente) ───────────────────────────────────
// Agrega headers comunes y trazabilidad sin exponer credenciales
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      config.headers.set("X-Request-Id", crypto.randomUUID());
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR (Cliente) ── Refresh Token Rotation ────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Si no hay config original o no es 401 o ya se reintentó, propagar error
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresco en progreso, encolar el request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Llamar al Route Handler interno de Next.js
      await axios.post("/api/auth/refresh", null, {
        withCredentials: true,
      });

      processQueue(null);
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError);
      if (typeof window !== "undefined") {
        window.location.href = "/?session_expired=true";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Helper de Autorización en Servidor ─────────────────────────────
export function applyServerTokenInterceptor(token: string | undefined): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
