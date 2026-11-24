import React from "react";
import { LegalLinks } from "@/components/legal/LegalLinks";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <main>{children}</main>
        <LegalLinks className="mt-6 flex justify-center text-xs text-on-surface-variant" />
      </div>
    </div>
  );
}
