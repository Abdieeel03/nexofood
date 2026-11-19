"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen flex bg-surface-base antialiased text-on-surface">
      <a
        href="#saas-main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-xl focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-bold focus-visible:text-on-primary focus-visible:shadow-level-2"
      >
        Ir al contenido principal
      </a>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-inverse-surface-dark/45 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        aria-hidden={!mobileSidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:hidden ${
          mobileSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        {mobileSidebarOpen && (
          <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
        )}
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          mobileSidebarOpen={mobileSidebarOpen}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main
          id="saas-main-content"
          tabIndex={-1}
          className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] w-full mx-auto focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
