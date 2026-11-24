import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  storefrontMenuResponseSchema,
  type StorefrontMenuResponse,
} from "@/schemas/catalog.schema";
import { tenantResponseSchema, type TenantResponse } from "@/schemas/tenant.schema";
import { apiServer, ApiError } from "@/lib/api-server";
import { StorefrontView } from "@/modules/store/components/StorefrontView";

export const dynamic = "force-dynamic";

interface StoreSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StoreSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tenant = await apiServer.get<TenantResponse>(
      `/tenants/slug/${encodeURIComponent(slug)}`,
      { schema: tenantResponseSchema }
    );
    return {
      title: tenant.name,
      description: `Menú y pedidos en línea de ${tenant.name} en NexoFood.`,
    };
  } catch {
    return {
      title: "Tienda",
    };
  }
}

export default async function StoreSlugPage({ params }: StoreSlugPageProps) {
  const { slug } = await params;

  let initialTenant: TenantResponse;
  try {
    initialTenant = await apiServer.get<TenantResponse>(
      `/tenants/slug/${encodeURIComponent(slug)}`,
      { schema: tenantResponseSchema }
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  let initialMenu: StorefrontMenuResponse;
  try {
    initialMenu = await apiServer.get<StorefrontMenuResponse>(
      `/store/${encodeURIComponent(slug)}/menu`,
      { schema: storefrontMenuResponseSchema }
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // Si el restaurante está inactivo (`isActive === false`), el endpoint `/menu` responde 404;
      // permitimos vista previa mostrando el banner de tienda cerrada.
      if (!initialTenant.isActive) {
        initialMenu = {
          tenantId: initialTenant.id,
          tenantName: initialTenant.name,
          tenantSlug: initialTenant.slug,
          logoUrl: initialTenant.logoUrl,
          bannerUrl: initialTenant.bannerUrl,
          onlinePaymentsEnabled: initialTenant.onlinePaymentsEnabled,
          openingTime: initialTenant.openingTime,
          closingTime: initialTenant.closingTime,
          isOpen: false,
          categories: [],
          uncategorizedProducts: [],
        };
      } else {
        notFound();
      }
    } else {
      throw error;
    }
  }

  return (
    <StorefrontView
      slug={initialTenant.slug}
      initialTenant={initialTenant}
      initialMenu={initialMenu}
    />
  );
}
