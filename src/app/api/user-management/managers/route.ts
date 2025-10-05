import { getManagers } from "@/data/user-management/user";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const result = await getManagers();

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch manager" },
      { status: 500 }
    );
  }
}
