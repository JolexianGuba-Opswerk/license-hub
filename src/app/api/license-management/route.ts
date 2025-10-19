import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

// TODO: ADD PERMISSION FUNCTION IN HERE..
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" });
    }
    const allowedRoles = ["TEAM_LEAD", "MANAGER", "ADMIN"];
    const role = user.user_metadata.role;
    const department = user.user_metadata.department;

    if (department !== "ITSG" && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Unauthorized" });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const vendor = searchParams.get("vendor") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { vendor: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (vendor && vendor !== "ALL") {
      where.vendor = vendor;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (department !== "ITSG") {
      where.owner = department;
    }

    // Status filtering logic
    if (status && status !== "ALL") {
      switch (status) {
        case "EXPIRED":
          where.status = "EXPIRED";
          break;
        case "AVAILABLE":
          where.status = "AVAILABLE";
          break;
        case "FULL":
          where.status = "FULL";
          break;
        case "AVAILABLE":
          where.status = "AVAILABLE";
          break;
      }
    }

    // Get licenses with count of keys
    const [licenses, totalCount] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          licenseAddedBy: {
            select: {
              name: true,
              department: true,
              role: true,
            },
          },
          licenseKeys: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              licenseKeys: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.license.count({ where }),
    ]);
    const keyCounts = await prisma.licenseKey.groupBy({
      by: ["licenseId", "status"],
      _count: { licenseId: true },
    });

    // --- Build license response including assigned/unassigned counts ---
    const licensesWithCounts = licenses.map((license) => {
      const assignedCount =
        keyCounts.find(
          (k) => k.licenseId === license.id && k.status === "ASSIGNED"
        )?._count.licenseId ?? 0;

      const unassignedCount =
        keyCounts.find(
          (k) => k.licenseId === license.id && k.status === "ACTIVE"
        )?._count.licenseId ?? 0;

      return {
        ...license,
        assignedKeysCount: assignedCount,
        unassignedKeysCount: unassignedCount,
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize);
    return NextResponse.json({
      data: licensesWithCounts,
      meta: {
        page,
        pageSize,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("License management API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
