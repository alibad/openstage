import { NextResponse } from "next/server";

// SSO has been removed; the framework no longer attaches an identity to
// requests. Per-deck passwords and the admin password remain the gates.
export async function GET() {
  return NextResponse.json({ login: null, name: null, email: null });
}
