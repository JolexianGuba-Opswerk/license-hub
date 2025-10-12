import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const isITSG = user.user_metadata.department === "ITSG";

  const employees = await prisma.userDetails.findMany({
    where: {
      ...(isITSG
        ? {
            // ITSG can see all users
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {
            // Non-ITSG users limited to their own department
            department: user.user_metadata.department,
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
    take: 20,
  });

  return NextResponse.json(employees);
}
