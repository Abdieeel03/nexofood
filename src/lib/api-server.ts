import { AxiosError } from "axios";
import { z } from "zod";
import { cleanPayload, type ApiResponse } from "@/schemas/common.schema";
import { axiosServer, applyServerTokenInterceptor, ApiError } from "./axios";
import { getAccessToken } from "./auth-cookies";
import type { RequestOptions } from "./api-client";

export { ApiError } from "./axios";

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
    console.error("[ApiServer] Error de validación Zod en servidor:", parseResult.error);
    throw new Error(`Error de validación del esquema: ${parseResult.error.message}`);
  }
  return parseResult.data as T;
}

/**
 * Cliente de API para uso exclusivo en el Servidor de Next.js
 * (Server Actions, Server Components, Route Handlers).
 * Inyecta el access token de la cookie httpOnly y desempaqueta `ApiResponse<T>`.
 */
async function executeServerRequestEnvelope<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { schema, token: explicitToken, headers: customHeaders, params, signal } =
    options;
  const token = explicitToken ?? (await getAccessToken());
  const authHeaders = applyServerTokenInterceptor(token);

  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      )
    : undefined;

  const combinedHeaders = {
    ...authHeaders,
    ...(customHeaders || {}),
  };

  const sanitizedBody = isPlainBody(body) ? cleanPayload(body) : body;

  try {
    const response = await axiosServer<unknown>({
      url: endpoint,
      method,
      data: sanitizedBody,
      params: cleanParams,
      headers: Object.keys(combinedHeaders).length > 0 ? combinedHeaders : undefined,
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
    if (error instanceof AxiosError) {
      throw ApiError.fromAxiosError(error);
    }
    throw error;
  }
}

async function executeServerRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const envelope = await executeServerRequestEnvelope<T>(
    endpoint,
    method,
    body,
    options
  );
  return envelope.data;
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

  delete: <T = null>(endpoint: string, options?: RequestOptions) =>
    executeServerRequest<T>(endpoint, "DELETE", undefined, options),

  getRaw: <T>(endpoint: string, options?: RequestOptions) =>
    executeServerRequestEnvelope<T>(endpoint, "GET", undefined, options),

  postRaw: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    executeServerRequestEnvelope<T>(endpoint, "POST", body, options),

  putRaw: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    executeServerRequestEnvelope<T>(endpoint, "PUT", body, options),

  patchRaw: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    executeServerRequestEnvelope<T>(endpoint, "PATCH", body, options),

  deleteRaw: <T = null>(endpoint: string, options?: RequestOptions) =>
    executeServerRequestEnvelope<T>(endpoint, "DELETE", undefined, options),
};
