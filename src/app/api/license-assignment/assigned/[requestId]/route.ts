import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" });
    }

    const userId = user.id;

    // VALIDATION CHECK ONLY THE USER ASSIGNED CAN SEE IT
    const licenseRequest = await prisma.licenseRequest.findUnique({
      where: { id: requestId },
      include: {
        requestor: true,
        requestedFor: true,
      },
    });

    if (!licenseRequest) {
      return NextResponse.json(
        { error: "License Request not found" },
        { status: 404 }
      );
    }

    const isAuthorized =
      licenseRequest.requestorId === userId ||
      licenseRequest.requestedForId === userId;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" });
    }

    // GET THE LICENSE LINKED TO THE REQUEST
    const assignments = await prisma.licenseAssignment.findMany({
      where: {
        requestItem: {
          requestId,
        },
      },
      include: {
        licenseKey: {
          include: {
            license: true,
          },
        },
        requestItem: {
          select: {
            status: true,
          },
        },
        assigner: true,
      },
    });

    const formatted = assignments.map((a) => ({
      id: a.id,
      licenseName: a.licenseKey.license.name,
      vendor: a.licenseKey.license.vendor,
      type: a.licenseKey.license.type,
      keyValue:
        a.licenseKey.license.type === "KEY_BASED"
          ? a.licenseKey.key
          : a.licenseKey.seatLink,

      assignedAt: a.assignedAt,
      status: a.requestItem.status,
      assigner: a.assigner
        ? {
            name: a.assigner.name,
            email: a.assigner.email,
          }
        : null,
    }));

    return NextResponse.json({
      assignments: formatted,
    });
  } catch (error) {
    console.error("Error fetching license assignments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
