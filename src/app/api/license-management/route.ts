import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TODO: ADD PERMISSION FUNCTION IN HERE..
export async function GET(request: NextRequest) {
  try {
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

    const totalPages = Math.ceil(totalCount / pageSize);
    console.log(licenses);
    return NextResponse.json({
      data: licenses,
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
