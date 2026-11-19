"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { canViewPaymentsAudit } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";

export function SettingsTabs() {
  const pathname = usePathname();
  const { activeRole, systemRole } = useSessionTenant();

  const showPaymentsTab = canViewPaymentsAudit(activeRole, systemRole);

  const tabs = [
    {
      label: "General del restaurante",
      href: "/dashboard/settings",
      icon: "store",
      active: pathname === "/dashboard/settings",
    },
    ...(showPaymentsTab
      ? [
          {
            label: "Mercado Pago y Pagos",
            href: "/dashboard/settings/payments",
            icon: "payments",
            active: pathname?.startsWith("/dashboard/settings/payments"),
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Secciones de configuración"
      className="border-b border-outline-variant/60"
    >
      <ul className="flex overflow-x-auto hide-scrollbar gap-1">
        {tabs.map((tab) => (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                tab.active
                  ? "text-primary after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:border-b-[3px] after:border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name={tab.icon} size={18} fill={tab.active} />
              <span>{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
