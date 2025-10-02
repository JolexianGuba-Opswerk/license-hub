import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

// TODO: ONLY FOR ITSG DEPARTMENT
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    //TODO: REDIS CACHING AND INVALIDATING
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const department = searchParams.get("department") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (department) where.department = department;

    cacheTag("users-management-table");
    const [users, total] = await Promise.all([
      prisma.userDetails.findMany({
        where,
        include: { manager: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.userDetails.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
