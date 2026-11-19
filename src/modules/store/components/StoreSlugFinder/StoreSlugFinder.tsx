"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { apiClient, getApiErrorMessage, isApiError } from "@/lib/api-client";
import { formatCurrencyPEN, slugify } from "@/lib/format";
import { tenantResponseSchema, type TenantResponse } from "@/schemas/tenant.schema";

export const StoreSlugFinder: React.FC = () => {
  const router = useRouter();
  const [rawSlug, setRawSlug] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [closedTenant, setClosedTenant] = useState<TenantResponse | null>(null);

  const normalizedSlug = slugify(rawSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setClosedTenant(null);

    if (!normalizedSlug) {
      setErrorMessage(
        "Ingresa el identificador (slug) del restaurante, por ejemplo: burger-bros."
      );
      return;
    }

    setIsSearching(true);
    try {
      const tenant = await apiClient.get<TenantResponse>(
        `/tenants/slug/${encodeURIComponent(normalizedSlug)}`,
        { schema: tenantResponseSchema }
      );

      if (tenant.isActive) {
        router.push(`/store/${encodeURIComponent(tenant.slug)}`);
        return;
      }

      setClosedTenant(tenant);
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        setErrorMessage(
          `No encontramos ningún restaurante registrado con el slug "${normalizedSlug}". Verifica que esté escrito correctamente.`
        );
      } else {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "No pudimos consultar el restaurante en este momento."
          )
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-6 sm:p-10 shadow-level-2 space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
            Ingresa directo a tu restaurante
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed max-w-2xl">
            En NexoFood cada restaurante tiene su propio enlace directo. Escribe
            el identificador (<code className="font-semibold text-primary">slug</code>)
            compartido por el local para ver su carta en vivo, calcular envío
            y hacer tu pedido.
          </p>
        </div>

        <search>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="store-slug-input"
                className="block text-sm font-bold text-on-surface mb-1.5"
              >
                Identificador del restaurante (slug)
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center rounded-xl border border-outline-variant bg-surface-container-low focus-within:bg-surface-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors overflow-hidden">
                  <span className="pl-3.5 pr-1 text-sm font-semibold text-on-surface-variant select-none shrink-0">
                    /store/
                  </span>
                  <input
                    id="store-slug-input"
                    name="slug"
                    type="search"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="search"
                    maxLength={100}
                    required
                    value={rawSlug}
                    onChange={(e) => {
                      setRawSlug(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                      if (closedTenant) setClosedTenant(null);
                    }}
                    placeholder="ej. pizzeria-napoles"
                    aria-describedby="store-slug-help"
                    className="w-full bg-transparent pr-3.5 py-3 text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSearching}
                  icon="arrow_forward"
                >
                  Ir a la tienda
                </Button>
              </div>

              <p
                id="store-slug-help"
                className="mt-2 text-xs text-on-surface-variant"
              >
                Solo letras minúsculas, números y guiones.
                {rawSlug.trim() && normalizedSlug && normalizedSlug !== rawSlug.trim() && (
                  <span className="ml-1.5 font-semibold text-primary">
                    Buscando: {normalizedSlug}
                  </span>
                )}
              </p>
            </div>
          </form>
        </search>

        {errorMessage && (
          <Alert variant="warning" title="Restaurante no encontrado">
            {errorMessage}
          </Alert>
        )}

        {closedTenant && (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-on-surface">
                    {closedTenant.name}
                  </h2>
                  <Badge variant="danger" dot>
                    Cerrado temporalmente
                  </Badge>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Este restaurante está temporalmente cerrado y no recibe pedidos
                  en este momento.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-on-surface-variant">
              {closedTenant.address && (
                <div className="flex items-center gap-1.5">
                  <Icon name="location_on" size={16} className="text-primary" />
                  <span>{closedTenant.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Icon name="two_wheeler" size={16} className="text-primary" />
                <span className="tabular-nums">
                  Radio: {closedTenant.deliveryRadiusKm} km · Envío base:{" "}
                  {formatCurrencyPEN(closedTenant.defaultDeliveryFee)}
                </span>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/store/${encodeURIComponent(closedTenant.slug)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card border border-outline-variant text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="visibility" size={18} />
                <span>Ver información de la tienda</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-on-surface">
            ¿Tienes un restaurante?
          </h2>
          <p className="text-sm text-on-surface-variant">
            Administra tu catálogo, cocina KDS, entregas GPS y pagos con Mercado
            Pago desde el panel SaaS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors"
          >
            <Icon name="storefront" size={18} />
            <span>Ingresa al panel SaaS</span>
          </Link>
        </div>
      </section>
    </div>
  );
};
