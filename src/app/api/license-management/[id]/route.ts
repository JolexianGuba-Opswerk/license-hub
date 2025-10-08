import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    // Fetch the license with total key count
    const license = await prisma.license.findUnique({
      where: { id: params.id },
      include: {
        licenseAddedBy: {
          select: { name: true, department: true, role: true },
        },
        licenseKeys: {
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        },
        _count: {
          select: { licenseKeys: true }, // total keys
        },
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Count unassigned keys for this license
    const unassignedCount = await prisma.licenseKey.count({
      where: {
        licenseId: license.id,
        NOT: { status: "ASSIGNED" },
      },
    });

    const licenseWithCounts = {
      ...license,
      unassignedKeysCount: unassignedCount,
    };

    return NextResponse.json(licenseWithCounts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch license" },
      { status: 500 }
    );
  }
}
