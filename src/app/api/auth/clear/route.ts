import { NextResponse } from "next/server";
import {
  clearAuthCookiesOnResponse,
  removeAuthCookies,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  await removeAuthCookies();
  return clearAuthCookiesOnResponse(NextResponse.json({ success: true }));
}
