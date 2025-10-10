import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.user_metadata.role;
    const department = user.user_metadata.department;
    const userId = user.id;

    let whereCondition: any = {};

    if (role === "TEAM_LEAD" && department === "ITSG") {
      whereCondition = {};
    } else if (["TEAM_LEAD", "MANAGER"].includes(role)) {
      whereCondition = {
        OR: [
          { requestor: { department } },
          { requestedFor: { department } },
          {
            items: {
              some: {
                license: { owner: department },
              },
            },
          },
        ],
      };
    } else {
      whereCondition = {
        OR: [{ requestorId: userId }, { requestedForId: userId }],
      };
    }

    const requests = await prisma.licenseRequest.findMany({
      where: whereCondition,
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

    //
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
