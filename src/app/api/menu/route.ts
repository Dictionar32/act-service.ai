import { NextResponse } from "next/server";

import { MENU } from "@/data/menu";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: MENU,
  });
}
