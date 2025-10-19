import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const actionFilter = searchParams.get("actionFilter") || "all";
    const dateRange = searchParams.get("dateRange") || "all";
    const entity = searchParams.get("entity") || undefined;
    const entityId = searchParams.get("entityId") || undefined;

    // Date filter
    let dateFilter: Record<string, any> = {};
    const now = new Date();

    switch (dateRange) {
      case "today":
        dateFilter = { gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case "7days":
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case "30days":
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 30)) };
        break;
      default:
        dateFilter = {};
        break;
    }

    const where: Prisma.AuditLogWhereInput = {
      ...(entity && { entity }),
      ...(entityId && { entityId }),
      ...(actionFilter !== "all" && { action: actionFilter as any }),
      createdAt: dateFilter,
      OR: search
        ? [
            { description: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
          ]
        : undefined,
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
