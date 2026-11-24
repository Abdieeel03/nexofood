"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  subscriptionPaymentConfigResponseSchema,
  type SubscriptionPaymentConfigResponse,
} from "@/schemas/subscription.schema";

const ENV_MP_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || "";

export interface ResolvedSubscriptionPaymentConfig {
  publicKey: string;
  currency: string;
  cardPaymentsEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Resuelve la Public Key de Mercado Pago para cobro directo con `CardForm`.
 * Prioriza `NEXT_PUBLIC_MP_PUBLIC_KEY`; si está vacía, consulta `GET /subscriptions/config`.
 */
export function useSubscriptionPaymentConfig(
  enabled = true
): ResolvedSubscriptionPaymentConfig {
  const configQuery = useQuery({
    queryKey: ["subscriptions", "config"],
    queryFn: () =>
      apiClient.get<SubscriptionPaymentConfigResponse>("/subscriptions/config", {
        schema: subscriptionPaymentConfigResponseSchema,
      }),
    enabled: enabled && !ENV_MP_PUBLIC_KEY,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (ENV_MP_PUBLIC_KEY) {
    return {
      publicKey: ENV_MP_PUBLIC_KEY,
      currency: "PEN",
      cardPaymentsEnabled: true,
      isLoading: false,
      isError: false,
    };
  }

  const resolvedPublicKey = configQuery.data?.publicKey?.trim() || "";
  const cardPaymentsEnabled =
    Boolean(configQuery.data?.cardPaymentsEnabled) &&
    resolvedPublicKey.length > 0;

  return {
    publicKey: resolvedPublicKey,
    currency: configQuery.data?.currency || "PEN",
    cardPaymentsEnabled,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
  };
}
