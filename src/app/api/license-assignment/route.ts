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

    let whereCondition = {};

    //ITSG BY DEFAULT WILL SEE EVERYTHIN
    if (department === "ITSG") {
      whereCondition = {
        NOT: [{ status: "PENDING" }, { status: "DENIED" }],
      };
    } else if (
      !["TEAM_LEAD", "MANAGER", "ADMIN", "ACCOUNT_OWNER"].includes(role)
    ) {
      // RESTRICT NORMAL EMPLOYEE SEEING THIS
      return NextResponse.json([]);
    } else {
      // MANAGER / TEAM LEADS WILL SEE REQUEST A LICENSE THAT IS OWNED BY THEIR DEPARTMETNS
      whereCondition = {
        OR: [{ items: { some: { license: { owner: department } } } }],
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
            approvals: { select: { status: true } },
            license: {
              select: { vendor: true, name: true, status: true, owner: true },
            },
          },
        },
      },
    });

    const formattedRequests = requests.map((r) => {
      // Initialize counters
      let readyToAssign = 0;
      let assignedCount = 0;

      const approvedItems: {
        type: "LICENSE" | "OTHER" | "EMAIL";
        name: string;
        vendor: string;
        status: "APPROVED";
        handler: string;
      }[] = [];
      r.items.forEach((i) => {
        // Count statuses
        if (i.status === "APPROVED") readyToAssign++;
        if (
          i.approvals.every((i) => i.status === "APPROVED") &&
          i.status === "FULFILLED"
        )
          assignedCount++;

        // GETTING ALL THE APPROVED ITEMS ONLY
        if (i.status === "APPROVED") {
          approvedItems.push({
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
          });
        }
      });

      return {
        request_id: r.id,
        status: r.items.every((i) => i.status === "FULFILLED")
          ? "FULFILLED"
          : r.items.some((i) => i.status === "FULFILLED")
          ? "PARTIALLY_ASSIGNED"
          : r.items.some((i) => i.status === "DENIED")
          ? "DENIED"
          : "ASSIGNING",
        requesterEmail: r.requestor.email,
        requestorName: r.requestor?.name,
        department: r.requestor.department,
        totalItems: r.items.length,
        deniedCount: r.items.filter((i) => i.status === "DENIED").length,
        items: approvedItems,

        analytics: {
          readyToAssignCount: readyToAssign,

          assignedCount: assignedCount || 0,
          progressPercent: Math.round(
            (assignedCount || 0 / readyToAssign) * 100
          ),
        },
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
