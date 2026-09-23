export const NAV_LINKS = [
  { href: "/store/account", label: "Mi cuenta", icon: "person" },
  { href: "/store/orders", label: "Mis pedidos", icon: "receipt_long" },
  { href: "/store/payments", label: "Métodos de pago", icon: "payments" },
] as const;

// TODO: reemplazar por datos reales (sesión / ubicación del usuario)
export const MOCK_USER = { name: "Carlos J.", email: "carlos@nexofood.com", initials: "C" };
export const MOCK_ADDRESS = "Av. Los Rosales 123, Distrito Central";