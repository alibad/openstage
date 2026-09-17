import { NextRequest, NextResponse } from "next/server";
import { getDeploymentStatus } from "@/lib/github";

export async function GET(req: NextRequest) {
  const prNumber = req.nextUrl.searchParams.get("prNumber");

  if (!prNumber) {
    return NextResponse.json(
      { error: "prNumber is required" },
      { status: 400 }
    );
  }

  const status = await getDeploymentStatus(Number(prNumber));
  return NextResponse.json(status);
}
