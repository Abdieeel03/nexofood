import { z } from "zod";
import { AxiosError } from "axios";
import { axiosServer, applyServerTokenInterceptor } from "./axios";
import { getAccessToken } from "./auth-cookies";
import { ApiError, type RequestOptions } from "./api-client";

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
  const { schema, token: explicitToken, headers: customHeaders, params, signal } = options;
  const token = explicitToken || (await getAccessToken());
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

  try {
    const response = await axiosServer<T>({
      url: endpoint,
      method,
      data: body,
      params: cleanParams,
      headers: Object.keys(combinedHeaders).length > 0 ? combinedHeaders : undefined,
      signal,
    });

    const rawData = response.data;

    if (schema) {
      const parseResult = schema.safeParse(rawData);
      if (!parseResult.success) {
        console.error("[ApiServer] Error de validación Zod en servidor:", parseResult.error);
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
