import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isAuthPath,
  isProtectedPath,
} from "./lib/auth-constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  const isProtectedRoute = isProtectedPath(pathname);
  const isAuthRoute = isAuthPath(pathname);

  if (isProtectedRoute) {
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (!accessToken && refreshToken) {
      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(refreshUrl);
    }
  }

  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/catalog/:path*",
    "/orders/:path*",
    "/tracking/:path*",
    "/employees/:path*",
    "/customers/:path*",
    "/onboarding/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
