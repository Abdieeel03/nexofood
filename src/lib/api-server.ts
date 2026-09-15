import { apiClient, RequestOptions } from "./api-client";
import { getAccessToken } from "./auth-cookies";

/**
 * URL de la API interna para llamadas de servidor a servidor
 */
const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api";

/**
 * Cliente de API para uso exclusivo en el Servidor de Next.js
 * (Server Actions, Server Components, Route Handlers).
 *
 * Inyecta automáticamente el access token almacenado en la cookie segura `httpOnly`.
 */
async function executeServerRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getAccessToken();

  // Si el endpoint no es absoluto, adaptamos con la URL base de servidor
  const resolvedEndpoint = endpoint.startsWith("http")
    ? endpoint
    : `${SERVER_API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  switch (method) {
    case "GET":
      return apiClient.get<T>(resolvedEndpoint, { ...options, token: token || options.token });
    case "POST":
      return apiClient.post<T>(resolvedEndpoint, body, { ...options, token: token || options.token });
    case "PUT":
      return apiClient.put<T>(resolvedEndpoint, body, { ...options, token: token || options.token });
    case "PATCH":
      return apiClient.patch<T>(resolvedEndpoint, body, { ...options, token: token || options.token });
    case "DELETE":
      return apiClient.delete<T>(resolvedEndpoint, { ...options, token: token || options.token });
    default:
      throw new Error(`Método HTTP no soportado: ${method}`);
  }
}

export const apiServer = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    executeServerRequest<T>(endpoint, "GET", undefined, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    executeServerRequest<T>(endpoint, "POST", body, options),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    executeServerRequest<T>(endpoint, "PUT", body, options),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    executeServerRequest<T>(endpoint, "PATCH", body, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    executeServerRequest<T>(endpoint, "DELETE", undefined, options),
};
