import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET LICENSE REQUEST DETAILS
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata.role;
    const department = user.user_metadata.department;

    const request = await prisma.licenseRequest.findUnique({
      where: { id },
      include: {
        requestor: true,
        items: {
          include: {
            license: {
              include: {
                licenseKeys: true,
              },
            },
            approvals: { include: { approver: true } },
            assignments: true,
          },
        },
      },
    });

    if (!request)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // Authorization check
    const isAuthorized =
      department === "ITSG" ||
      request.items.some(
        (i) =>
          i.license?.owner === department &&
          ["MANAGER", "ADMIN", "TEAM_LEAD"].includes(role)
      );

    if (!isAuthorized)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Format items

    const formattedItems = request.items.map((i) => {
      let totalSeats = 0;
      let availableCount = 0;
      let statusMessage = "";
      let needsPurchase = false;
      let needsConfiguration = false;
      let canAction;
      if (i.license) {
        if (i.license.type === "SEAT_BASED") {
          // Seat-based licenses
          totalSeats = i.license.totalSeats || 0;
          const assignedCount = i.assignments.filter(
            (a) => a.status === "ACTIVE"
          ).length;
          availableCount = totalSeats - assignedCount;
          needsPurchase = availableCount <= 0 && totalSeats > 0;

          if (availableCount > 0) {
            statusMessage = `${availableCount} seat${
              availableCount > 1 ? "s" : ""
            } available.`;
          } else if (needsPurchase) {
            statusMessage = "All seats are used — please purchase more.";
          }
        } else {
          // KEY_BASED licenses
          totalSeats = i.license.totalSeats;
          const activeKeys = i.license.licenseKeys.filter(
            (k) => k.status === "ACTIVE"
          ).length;
          availableCount = activeKeys;
          needsPurchase = availableCount <= 0 && totalSeats > 0;

          // Flag if configuration is needed
          if (totalSeats > 0 && activeKeys === 0) {
            needsConfiguration = true;
          }

          if (availableCount > 0) {
            statusMessage = `${availableCount} active license key${
              availableCount > 1 ? "s" : ""
            } available.`;
          } else if (needsPurchase) {
            statusMessage =
              "No active license key available — please purchase more or configure.";
          }
        }
        canAction = department === "ITSG" || i.license.owner === department;
      } else {
        // No license linked (OTHER type)
        totalSeats = 0;
        availableCount = 0;
        statusMessage = "License not linked or not configured.";
      }

      return {
        id: i.id,
        licenseId: i.licenseId,
        licenseName:
          i.license?.name || i.requestedLicenseName || "Unknown License",
        vendor:
          i.license?.vendor || i.requestedLicenseVendor || "Unknown Vendor",
        handler: i.license?.owner || "UNKNOWN",
        type: i.license?.type || "OTHERS",
        status: i.status,
        totalSeats,
        availableCount,
        needsPurchase,
        needsConfiguration,
        canAction,
        statusMessage,
        approvers:
          i.approvals
            ?.map((a) => ({
              name: a.approver?.name || "Unknown Approver",
              email: a.approver?.email || "No Email",
              level: a.level,
              approvedAt: a.updatedAt,
            }))
            ?.sort(
              (a, b) =>
                new Date(a.approvedAt).getTime() -
                new Date(b.approvedAt).getTime()
            ) || [],
      };
    });

    return NextResponse.json({
      id: request.id,
      requestId: request.id,
      employeeName: request.requestor.name,
      employeeEmail: request.requestor.email,
      department: request.requestor.department,
      managerName: request.requestor.name || "Unknown",
      status: request.status,
      approvedAt: request.updatedAt,
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}
