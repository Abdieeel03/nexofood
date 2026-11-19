import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";
import { ApiError } from "./axios";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Datos considerados frescos durante 1 minuto por defecto
        staleTime: 60 * 1000,
        // Mantener en memoria caché durante 5 minutos
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // No reintentar en errores 4xx del cliente (incluyendo 401, 403, 404, 409 y 429 rate-limit)
          if (error instanceof ApiError) {
            if (error.status >= 400 && error.status < 500) {
              return false;
            }
          }
          if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 10_000),
      },
      mutations: {
        retry: 0,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
