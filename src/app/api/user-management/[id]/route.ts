import { NextResponse } from "next/server";
import { getUserById } from "@/data/user-management/user";

export async function GET(req: Request, context: { params: { id: string } }) {
  const { params } = await context;
  if (!params?.id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await getUserById(params?.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
