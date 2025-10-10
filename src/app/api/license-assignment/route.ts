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

    if (role === "ITSG_ADMIN") {
      // ITSG admin sees all requests with at least one ITSG item
      whereCondition = {
        items: {
          some: {
            license: {
              owner: "ITSG",
            },
          },
        },
      };
    } else if (role === "MANAGER") {
      // Manager sees requests for their department
      whereCondition = {
        OR: [{ requestor: { department } }, { requestedFor: { department } }],
      };
    } else {
      // Regular user sees only their own requests
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
            requestedLicenseVendor: true,
            status: true,
            license: {
              select: {
                vendor: true,
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
      request_id: r.id,
      status: r.items.every((i) => i.status === "FULFILLED")
        ? "FULFILLED"
        : r.items.some((i) => i.status === "FULFILLED")
        ? "PARTIALLY_ASSIGNED"
        : "ASSIGNING",
      requesterEmail: r.requestor.email,
      requestorName: r.requestor?.name,
      department: r.requestor.department,
      totalItems: r.items.length,
      approvedAt: r.updatedAt,
      handler: r.items.every((i) => i.license?.owner === "ITSG")
        ? "ITSG"
        : r.items.every((i) => i.license?.owner !== "ITSG")
        ? "NON_ITSG"
        : "MIXED",
      readyToAssign: r.items.filter((i) => i.status === "APPROVED").length,
      approvedCount: r.items.filter((i) => i.status === "APPROVED").length,
      deniedCount: r.items.filter((i) => i.status === "DENIED").length,
      pendingCount: r.items.filter((i) => i.status === "PENDING").length,
      progressPercent: Math.round(
        (r.items.filter((i) => i.status === "APPROVED").length /
          r.items.length) *
          100
      ),
      items: r.items.map((i) => ({
        type: i.type,
        name:
          i.type === "LICENSE"
            ? i.license?.name || "Unknown License"
            : i.requestedLicenseName || "Other Item",
        vendor:
          i.type === "LICENSE"
            ? i.license?.vendor || "Unknown Vendor"
            : i.requestedLicenseVendor || "New Vendor",
        status: i.status,
        handler: i.license?.owner || "OTHER",
      })),
      handlers: Array.from(
        new Set(r.items.map((i) => i.license?.owner || "Other"))
      ),
      analytics: {
        readyToAssignCount: r.items.filter((i) => i.status === "APPROVED")
          .length,
        waitingForApprovals: r.items.filter((i) => i.status === "PENDING")
          .length,
        progressPercent: Math.round(
          (r.items.filter((i) => i.status === "APPROVED").length /
            r.items.length) *
            100
        ),
      },
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
