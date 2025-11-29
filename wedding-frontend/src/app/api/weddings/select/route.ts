import { NextRequest, NextResponse } from "next/server";
import { setCurrentWedding } from "@/actions/wedding";

export async function POST(request: NextRequest) {
  try {
    const { weddingId } = await request.json();
    await setCurrentWedding(weddingId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to select wedding" }, { status: 500 });
  }
}
