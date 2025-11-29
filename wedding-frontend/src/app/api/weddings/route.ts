import { NextResponse } from "next/server";
import { getMyWeddings, getCurrentWedding } from "@/actions/wedding";

export async function GET() {
  try {
    const weddings = await getMyWeddings();
    const currentWedding = await getCurrentWedding();
    
    return NextResponse.json({ 
      weddings, 
      currentWedding 
    });
  } catch {
    return NextResponse.json({ weddings: [], currentWedding: null });
  }
}
