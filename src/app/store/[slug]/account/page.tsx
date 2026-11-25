import type { Metadata } from "next";
import Link from "next/link";
import { ErrorStateView } from "@/components/ui/ErrorStateView";
import { Icon } from "@/components/ui/Icon";
import { resolveStoreTenantOrNotFound } from "@/lib/store-server";
import { AccountManager } from "@/modules/account";

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

  const tenantResult = await resolveStoreTenantOrNotFound(slug);
  if (!tenantResult.ok) {
    return <ErrorStateView status={tenantResult.errorStatus} context="store" />;
  }

  const storeName = tenantResult.tenant.name;
  const storeSlug = tenantResult.tenant.slug;

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
