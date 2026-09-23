'use client'

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { MOCK_USER, NAV_LINKS } from "../Header/constants";

type ProfileLayoutProps = {
  children: ReactNode;
};

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start font-sans">
      <aside className="lg:sticky lg:top-20 flex flex-col gap-4">
        <div className="hidden lg:flex flex-col items-center text-center bg-white rounded-2xl border border-border-subtle shadow-level-1 p-6">
          <div className="w-20 h-20 rounded-full bg-primary text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
            {MOCK_USER.initials}
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-on-surface">{MOCK_USER.name}</h2>
          <p className="text-xs font-medium text-on-surface-variant truncate max-w-full">{MOCK_USER.email}</p>
        </div>

        <nav
          aria-label="Mi perfil"
          className="flex lg:flex-col gap-2 overflow-x-auto hide-scrollbar lg:bg-white lg:rounded-2xl lg:border lg:border-border-subtle lg:shadow-level-1 lg:p-2"
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-mint-subtle text-primary font-bold"
                    : "bg-white lg:bg-transparent border border-outline-variant lg:border-transparent text-on-surface font-semibold hover:bg-surface-container-low"
                }`}
              >
                <Icon name={link.icon} size={20} className={active ? "text-primary" : "text-on-surface-variant"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 bg-white rounded-2xl border border-border-subtle shadow-level-1 p-5 md:p-8 min-h-[520px]">
        {children}
      </section>
    </div>
  );
};
