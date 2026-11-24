import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AccountManager } from "@/modules/account";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export default function StoreAccountPage() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"
      >
        <Link href="/store" className="hover:text-primary transition-colors">
          Buscar tienda
        </Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-on-surface font-bold">Mi cuenta</span>
      </nav>

      <AccountManager context="store" />
    </div>
  );
}
