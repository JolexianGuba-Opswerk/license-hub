import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const licenses = await prisma.license.findMany({
      select: {
        id: true,
        name: true,
        vendor: true,
        owner: true,
        totalSeats: true,
        licenseKeys: {
          select: {
            status: true,
          },
        },
      },
    });

    const dropdownData = licenses.map((l) => {
      const usedSeats = l.licenseKeys.filter(
        (k) => k.status === "ASSIGNED"
      ).length;
      const availableSeats = l.totalSeats - usedSeats;

      return {
        id: l.id,
        name: l.name,
        vendor: l.vendor,
        owner: l.owner,
        availableSeats: availableSeats < 0 ? 0 : availableSeats,
      };
    });

    return NextResponse.json(dropdownData);
  } catch (error) {
    console.error("License dropdown API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
