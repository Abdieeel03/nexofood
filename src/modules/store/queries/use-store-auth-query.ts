"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  customerAddressResponseSchema,
  userProfileResponseSchema,
  type CustomerAddressResponse,
  type UserProfileResponse,
} from "@/schemas/auth.schema";
import { apiClient, isApiError } from "@/lib/api-client";
import { storeKeys } from "./keys";

/**
 * Consulta segura de la sesión actual del comensal vía `GET /auth/me`.
 * Un `401 Unauthorized` se interpreta silenciosamente como invitado (`null`)
 * sin provocar redirecciones en `/store/*`.
 */
export function useStoreMeQuery() {
  return useQuery<UserProfileResponse | null>({
    queryKey: storeKeys.me,
    queryFn: async () => {
      try {
        return await apiClient.get<UserProfileResponse>("/auth/me", {
          schema: userProfileResponseSchema,
        });
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });
}

/**
 * Lista las direcciones guardadas WGS84 del usuario autenticado.
 */
export function useMyAddressesQuery(enabled: boolean) {
  return useQuery<CustomerAddressResponse[]>({
    queryKey: storeKeys.addresses,
    enabled,
    queryFn: () =>
      apiClient.get<CustomerAddressResponse[]>("/users/me/addresses", {
        schema: z.array(customerAddressResponseSchema),
      }),
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });
}
