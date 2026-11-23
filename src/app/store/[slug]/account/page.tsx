import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { apiServer, ApiError } from "@/lib/api-server";
import { AccountManager } from "@/modules/account";
import { tenantResponseSchema, type TenantResponse } from "@/schemas/tenant.schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

interface StoreSlugAccountPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreSlugAccountPage({
  params,
}: StoreSlugAccountPageProps) {
  const { slug } = await params;

  let storeName = slug;
  let storeSlug = slug;

  try {
    const tenant = await apiServer.get<TenantResponse>(
      `/tenants/slug/${encodeURIComponent(slug)}`,
      { schema: tenantResponseSchema }
    );
    storeName = tenant.name;
    storeSlug = tenant.slug;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"
      >
        <Link
          href={`/store/${encodeURIComponent(storeSlug)}`}
          className="hover:text-primary transition-colors"
        >
          {storeName}
        </Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-on-surface font-bold">Mi cuenta</span>
      </nav>

      <AccountManager context="store" slug={storeSlug} />
    </div>
  );
}
