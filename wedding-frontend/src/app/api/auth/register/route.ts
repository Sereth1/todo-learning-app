import { NextRequest, NextResponse } from "next/server";
import { register } from "@/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await register(data);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
