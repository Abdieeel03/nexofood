import { z } from "zod";
import { AxiosError, type AxiosRequestConfig } from "axios";
import { axiosClient, API_BASE_URL } from "./axios";

export { API_BASE_URL } from "./axios";

export interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  schema?: z.ZodTypeAny;
  headers?: Record<string, string>;
  token?: string;
  signal?: AbortSignal;
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

  static fromAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status ?? 0;
    const statusText = error.response?.statusText ?? (error.code || "Network Error");
    const data = error.response?.data;
    const message =
      (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string")
        ? (data as { message: string }).message
        : error.message;

    return new ApiError(status, statusText, data, message);
  }
}

/**
 * Función base de ejecución HTTP con Axios (Lado Cliente / Universal)
 */
async function baseRequest<T>(
  endpoint: string,
  config: AxiosRequestConfig = {},
  options: RequestOptions = {}
): Promise<T> {
  const { schema, token, headers: customHeaders, params, signal } = options;

  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      )
    : undefined;

  const headers: Record<string, string> = {
    ...(customHeaders || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await axiosClient<T>({
      url: endpoint,
      ...config,
      params: cleanParams,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      signal,
    });

    const rawData = response.data;

    if (schema) {
      const parseResult = schema.safeParse(rawData);
      if (!parseResult.success) {
        console.error("[ApiClient] Error de validación Zod en respuesta:", parseResult.error);
        throw new Error(`Error de validación del esquema: ${parseResult.error.message}`);
      }
      return parseResult.data as T;
    }

    return rawData;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw ApiError.fromAxiosError(error);
    }
    throw error;
  }
}

/**
 * Métodos HTTP universales
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    baseRequest<T>(endpoint, { method: "GET" }, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseRequest<T>(endpoint, { method: "POST", data: body }, options),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseRequest<T>(endpoint, { method: "PUT", data: body }, options),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseRequest<T>(endpoint, { method: "PATCH", data: body }, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    baseRequest<T>(endpoint, { method: "DELETE" }, options),
};
