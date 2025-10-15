import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  if (!id)
    return NextResponse.json(
      { error: "License ID is required" },
      { status: 400 }
    );

  try {
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        licenseKeys: {
          select: {
            id: true,
            key: true,
            seatLink: true,
            status: true,
            createdAt: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
            assignment: {
              select: {
                userId: true,
                requestItem: {
                  select: {
                    requestId: true,
                  },
                },
                status: true,
                assignedAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { licenseKeys: true } },
      },
    });

    if (!license)
      return NextResponse.json({ error: "License not found" }, { status: 404 });

    // Gather all userIds from assignments
    const userIds = license.licenseKeys
      .map((k) => k.assignment?.userId)
      .filter(Boolean) as string[];

    const assignedUsers = await prisma.userDetails.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });

    // Merge assigned user info into each license key
    const licenseWithUsers = {
      ...license,
      licenseKeys: license.licenseKeys.map((key) => ({
        ...key,
        assignedUser:
          key.assignment && key.assignment.userId
            ? assignedUsers.find((u) => u.id === key.assignment?.userId) || null
            : null,
      })),
    };

    return NextResponse.json(licenseWithUsers);
  } catch (error) {
    console.error("LICENSE_MANAGE_KEYS_API_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
