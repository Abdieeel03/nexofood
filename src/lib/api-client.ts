import { z } from "zod";
import axios, { type AxiosRequestConfig } from "axios";
import { cleanPayload, type ApiResponse } from "@/schemas/common.schema";
import { axiosClient, ApiError } from "./axios";

export { API_BASE_URL, ApiError, isApiError, getApiErrorMessage } from "./axios";

export interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  schema?: z.ZodTypeAny;
  headers?: Record<string, string>;
  token?: string;
  signal?: AbortSignal;
}

function isPlainBody(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isApiEnvelope(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean" &&
    "data" in value
  );
}

function validateData<T>(data: unknown, schema?: z.ZodTypeAny): T {
  if (!schema) return data as T;
  const parseResult = schema.safeParse(data);
  if (!parseResult.success) {
    console.error("[ApiClient] Error de validación Zod en respuesta:", parseResult.error);
    throw new Error(`Error de validación del esquema: ${parseResult.error.message}`);
  }
  return parseResult.data as T;
}

async function baseRequestEnvelope<T>(
  endpoint: string,
  config: AxiosRequestConfig = {},
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
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

  const sanitizedData = isPlainBody(config.data)
    ? cleanPayload(config.data)
    : config.data;

  try {
    const response = await axiosClient<unknown>({
      url: endpoint,
      ...config,
      data: sanitizedData,
      params: cleanParams,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      signal,
    });

    const rawData = response.data;

    if (isApiEnvelope(rawData)) {
      if (!rawData.success) {
        throw new ApiError(
          response.status || 400,
          "Business Error",
          rawData,
          typeof rawData.message === "string"
            ? rawData.message
            : "La operación no pudo completarse"
        );
      }

      const validatedData = validateData<T>(rawData.data, schema);
      return {
        success: true,
        message: typeof rawData.message === "string" ? rawData.message : "",
        data: validatedData,
      };
    }

    const validatedData = validateData<T>(rawData, schema);
    return {
      success: true,
      message: "",
      data: validatedData,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw ApiError.fromAxiosError(error);
    }
    throw error;
  }
}

async function baseRequest<T>(
  endpoint: string,
  config: AxiosRequestConfig = {},
  options: RequestOptions = {}
): Promise<T> {
  const envelope = await baseRequestEnvelope<T>(endpoint, config, options);
  return envelope.data;
}

/**
 * Cliente HTTP universal (navegador -> `/api/bff/...`).
 * Desempaqueta automáticamente `ApiResponse<T>` devolviendo `data: T`.
 * Usa los métodos `*Raw` cuando necesites acceder a `message` (ej. `DELETE` o `PATCH` sin payload).
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

  delete: <T = null>(endpoint: string, options?: RequestOptions) =>
    baseRequest<T>(endpoint, { method: "DELETE" }, options),

  getRaw: <T>(endpoint: string, options?: RequestOptions) =>
    baseRequestEnvelope<T>(endpoint, { method: "GET" }, options),

  postRaw: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseRequestEnvelope<T>(endpoint, { method: "POST", data: body }, options),

  putRaw: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseRequestEnvelope<T>(endpoint, { method: "PUT", data: body }, options),

  patchRaw: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    baseRequestEnvelope<T>(endpoint, { method: "PATCH", data: body }, options),

  deleteRaw: <T = null>(endpoint: string, options?: RequestOptions) =>
    baseRequestEnvelope<T>(endpoint, { method: "DELETE" }, options),
};
