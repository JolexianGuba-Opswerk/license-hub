import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";
import { RequestStatus } from "@prisma/client";

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
    const archived = searchParams.get("archived") === "true";

    const role = user.user_metadata.role;
    const department = user.user_metadata.department;
    const userId = user.id;

    // FILTERING SECTION
    const statusFilter = archived
      ? { status: { in: [RequestStatus.FULFILLED, RequestStatus.DENIED] } }
      : { status: { notIn: [RequestStatus.FULFILLED, RequestStatus.DENIED] } };
    let whereCondition = {};

    if (role === "TEAM_LEAD" && department === "ITSG") {
      whereCondition = {};
    } else if (["TEAM_LEAD", "MANAGER"].includes(role)) {
      whereCondition = {
        OR: [
          { requestorId: userId },
          { requestedForId: userId },
          {
            items: {
              some: {
                OR: [
                  { license: { owner: department } },
                  { approvals: { some: { approverId: userId } } },
                ],
              },
            },
          },
        ],
      };
    } else {
      whereCondition = {
        OR: [
          { requestorId: userId },
          { requestedForId: userId },
          {
            items: {
              some: {
                approvals: {
                  some: {
                    approverId: userId,
                  },
                },
              },
            },
          },
        ],
      };
    }

    const requests = await prisma.licenseRequest.findMany({
      where: {
        AND: [whereCondition, statusFilter],
      },

      orderBy: { createdAt: "desc" },
      include: {
        requestor: true,
        requestedFor: true,
        items: {
          select: {
            type: true,
            requestedLicenseName: true,
            newUserFullName: true,
            status: true,
            license: {
              select: {
                name: true,
                status: true,
                owner: true,
              },
            },
          },
        },
      },
    });

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      requesterName: r.requestor.name,
      requesterEmail: r.requestor.email,
      requestedForName: r.requestedFor?.name,
      requestedForEmail: r.requestedFor?.email,
      department: r.requestedFor?.department || r.requestor.department,
      totalItems: r.items.length,
      status: r.status,
      createdAt: r.createdAt,
      items: r.items.map((i) => ({
        type: i.type,
        name:
          i.type === "LICENSE"
            ? i.license?.name || "Unknown License"
            : i.requestedLicenseName || "Other Item",
        status:
          i.type === "LICENSE"
            ? i.license?.status || "PENDING"
            : i.status || "PENDING",
      })),
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
