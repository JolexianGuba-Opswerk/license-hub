import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "License ID is required" });

  try {
    const license = await prisma.license.findUnique({
      where: { id: id },
      include: {
        licenseAddedBy: {
          select: {
            name: true,
            department: true,
            role: true,
          },
        },
        licenseKeys: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            licenseKeys: true,
          },
        },
      },
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error("License detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
