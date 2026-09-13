import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Catálogo", href: "/catalog", icon: "restaurant_menu" },
  { label: "Pedidos", href: "/orders", icon: "receipt_long" },
  { label: "Configuración", href: "/settings", icon: "settings" },
];

export default function SaaSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-container-lowest border-r border-outline-variant">
        <div className="p-5 border-b border-outline-variant">
          <Link
            href="/dashboard"
            className="text-xl font-extrabold text-primary tracking-tight"
          >
            Nexofood
          </Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-outline-variant">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-outline hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              logout
            </span>
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-6">
          <div className="lg:hidden">
            <span className="text-lg font-extrabold text-primary">Nexofood</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-on-surface-variant font-semibold">
              Mi Restaurante
            </span>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-xs font-bold text-on-primary-container">MR</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
