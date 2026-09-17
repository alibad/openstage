import { NextRequest, NextResponse } from "next/server";
import { getPresentationBySlug } from "@/content/registry";
import {
  verifyPassword,
  AUTH_COOKIE_PREFIX,
  ADMIN_COOKIE,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();

  if (!slug || !password) {
    return NextResponse.json(
      { error: "Slug and password are required" },
      { status: 400 }
    );
  }

  if (slug === "admin") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return res;
  }

  const meta = getPresentationBySlug(slug);
  if (!meta?.protected || !meta.passwordHash) {
    return NextResponse.json(
      { error: "Presentation not found or not protected" },
      { status: 404 }
    );
  }

  const valid = await verifyPassword(password, meta.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(`${AUTH_COOKIE_PREFIX}${slug}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
