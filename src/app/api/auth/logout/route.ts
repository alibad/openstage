import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, AUTH_COOKIE_PREFIX } from "@/lib/auth";

// Clear admin and per-deck password cookies. SSO is no longer wired up.
export async function POST() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  for (const c of jar.getAll()) {
    if (c.name.startsWith(AUTH_COOKIE_PREFIX)) jar.delete(c.name);
  }
  return NextResponse.json({ success: true });
}
