import { NextRequest, NextResponse } from "next/server";
import { login } from "@/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    const result = await login({ email, password });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
