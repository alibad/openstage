import { NextRequest, NextResponse } from "next/server";
import { closePR, deleteBranch } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { prNumber, branchName } = await req.json();

    if (!prNumber) {
      return NextResponse.json(
        { error: "prNumber is required" },
        { status: 400 }
      );
    }

    await closePR(prNumber);

    if (branchName) {
      await deleteBranch(branchName).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "PR closed and branch deleted",
    });
  } catch (error) {
    console.error("Discard error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to discard PR",
      },
      { status: 500 }
    );
  }
}
