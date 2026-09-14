import { z } from "zod";

/**
 * ============================================================================
 * CONFIGURACIÓN DE CONEXIÓN (Campos libres a edición)
 * ============================================================================
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  schema?: z.ZodTypeAny; // Esquema Zod opcional para validar la respuesta
  token?: string; // Token opcional para inyección manual (ej. en Server Actions)
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * ============================================================================
 * TRANSPORTE BASE: FETCH NATIVO (Por defecto en Next.js 16)
 * ============================================================================
 * NOTA: Este cliente está desacoplado para que puedas alternar fácilmente entre
 * Fetch nativo, Axios o TanStack Query.
 */
async function baseFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, schema, token, headers: customHeaders, ...customOptions } =
    options;

  // 1. Construir URL con query params si existen
  const url = new URL(
    endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // 2. Encabezados por defecto
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(customHeaders as Record<string, string>),
  };

  // 3. Inyectar Token de autorización si está presente
  // (En el servidor se extrae automáticamente desde la cookie httpOnly)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 4. Ejecución de la petición
  const response = await fetch(url.toString(), {
    ...customOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    // credentials: 'include' asegura el envío de cookies en el navegador si el backend lo soporta
    credentials: customOptions.credentials ?? "include",
  });

  // 5. Manejo de errores HTTP
  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  // 6. Parseo de respuesta JSON
  const rawData = await response.json();

  // 7. Validación opcional con Zod
  if (schema) {
    const parseResult = schema.safeParse(rawData);
    if (!parseResult.success) {
      console.error("[ApiClient] Error de validación Zod en respuesta:", parseResult.error);
      throw new Error(`Error de validación del esquema: ${parseResult.error.message}`);
    }
    return parseResult.data as T;
  }

  return rawData as T;
}

/**
 * Métodos HTTP universales
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    baseFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseFetch<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseFetch<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseFetch<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    baseFetch<T>(endpoint, { ...options, method: "DELETE" }),
};

/**
 * ============================================================================
 * [CAMPO LIBRE A EDICIÓN]: PLANTILLAS ALTERNATIVAS (AXIOS / TANSTACK QUERY)
 * ============================================================================
 *
 * --- GUÍA PARA AXIOS ---
 * Si decides usar Axios:
 * 1. Ejecuta: npm install axios
 * 2. Descomenta y reemplaza baseFetch por una instancia de axios:
 *
 *    import axios from 'axios';
 *    const axiosInstance = axios.create({
 *      baseURL: API_BASE_URL,
 *      withCredentials: true, // Crucial para envío de cookies
 *    });
 *
 * --- GUÍA PARA TANSTACK QUERY ---
 * Si decides usar TanStack Query (@tanstack/react-query):
 * 1. Ejecuta: npm install @tanstack/react-query
 * 2. Usa `apiClient.get` o `apiClient.post` como la `queryFn` / `mutationFn`:
 *
 *    export const useProducts = () => useQuery({
 *      queryKey: ['products'],
 *      queryFn: () => apiClient.get<ProductResponse[]>('/catalog/products'),
 *    });
 */
