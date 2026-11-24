export const AUTH_COOKIE_NAME = "nexofood_access_token";
export const REFRESH_COOKIE_NAME = "nexofood_refresh_token";

export const DEFAULT_ACCESS_EXPIRES_IN = 900; // 15 minutos
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días (604800s)

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/catalog",
  "/orders",
  "/tracking",
  "/employees",
  "/customers",
  "/onboarding",
  "/account",
  "/notifications",
  "/admin",
  "/superadmin",
  "/settings",
] as const;

export const AUTH_ROUTES = ["/", "/login", "/register"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`))
  );
}

export function isSafeInternalRedirect(
  target: string | null | undefined
): target is string {
  if (!target) return false;
  return (
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.startsWith("/\\") &&
    !target.includes("://")
  );
}
