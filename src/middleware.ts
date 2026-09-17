import { NextRequest, NextResponse } from "next/server";
import {
  presentations,
  type PresentationMeta,
} from "@/content/registry";
import { AUTH_COOKIE_PREFIX, ADMIN_COOKIE } from "@/lib/auth";

function buildVisibilityMap() {
  return new Map<string, PresentationMeta>(
    presentations.map((p) => [p.slug, p])
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const visibilityMap = buildVisibilityMap();

  // Admin section — requires admin password (when ADMIN_PASSWORD is set)
  if (pathname.startsWith("/admin")) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const cookie = request.cookies.get(ADMIN_COOKIE);
      if (cookie?.value !== "1") {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/auth/admin";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next();
  }

  // Feedback admin (/fb) — also requires admin
  if (pathname === "/fb") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const cookie = request.cookies.get(ADMIN_COOKIE);
      if (cookie?.value !== "1") {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/auth/admin";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next();
  }

  // Per-presentation visibility + password gate
  const slug = pathname.slice(1);
  if (!slug || slug.includes("/")) return NextResponse.next();

  const meta = visibilityMap.get(slug);
  if (!meta) return NextResponse.next();

  // Block private presentations unless they have the per-deck cookie
  if (meta.visibility === "private") {
    const cookie = request.cookies.get(`${AUTH_COOKIE_PREFIX}${slug}`);
    if (cookie?.value !== "1") {
      if (meta.protected && meta.passwordHash) {
        const authUrl = request.nextUrl.clone();
        authUrl.pathname = `/auth/${slug}`;
        return NextResponse.redirect(authUrl);
      }
      return new NextResponse("Not Found", { status: 404 });
    }
    return NextResponse.next();
  }

  // Password-protected presentations (any visibility)
  if (meta.protected && meta.passwordHash) {
    const cookie = request.cookies.get(`${AUTH_COOKIE_PREFIX}${slug}`);
    if (cookie?.value === "1") return NextResponse.next();

    const authUrl = request.nextUrl.clone();
    authUrl.pathname = `/auth/${slug}`;
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|apple-touch-icon.png|images/|logos/|screenshots/|api|auth|login).*)",
  ],
};
