import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/auth-cookies";

const protectedRoutes = [
  "/dashboard",
  "/catalog",
  "/orders",
  "/inventory",
  "/employees",
  "/settings",
];
const authRoutes = ["/", "/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token);

  // Modo Dev: si estamos en desarrollo o NEXT_PUBLIC_DEV_MODE=true, permitimos navegar sin login
  const isDevMode =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEV_MODE === "true";

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`))
  );

  if (isProtectedRoute && !isAuthenticated && !isDevMode) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/catalog/:path*",
    "/orders/:path*",
    "/inventory/:path*",
    "/employees/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};