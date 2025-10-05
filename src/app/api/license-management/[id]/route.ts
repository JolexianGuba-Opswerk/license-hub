import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const license = await prisma.license.findUnique({
      where: { id: params.id },
      include: {
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

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error("License detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
