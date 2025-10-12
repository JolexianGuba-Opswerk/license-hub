import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata.role;
    const department = user.user_metadata.department;

    const request = await prisma.licenseRequest.findUnique({
      where: { id: params.id },
      include: {
        requestor: true,
        items: {
          include: {
            license: {
              include: {
                licenseKeys: {
                  select: {
                    status: true,
                  },
                },
              },
            },
            approvals: {
              include: { approver: true },
            },
          },
        },
      },
    });

    if (!request)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // Authorization check: only ITSG or owner department admin/manager
    const isAuthorized =
      department === "ITSG" ||
      request.items.some(
        (i) =>
          i.license?.owner === department && ["MANAGER", "ADMIN"].includes(role)
      );

    if (!isAuthorized)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formatted = {
      id: request.id,
      requestId: request.id,
      employeeName: request.requestor.name,
      employeeEmail: request.requestor.email,
      department: request.requestor.department,
      managerName: request.requestor.name || "Unknown",
      status: request.status,
      approvedAt: request.updatedAt,
      items: request.items.map((i) => ({
        id: i.id,
        licenseId: i.licenseId,
        licenseName:
          i.license?.name || i.requestedLicenseName || "Unknown License",
        vendor:
          i.license?.vendor || i.requestedLicenseVendor || "Unknown Vendor",
        handler: i.license?.owner || "UNKNOWN",
        type: i.license?.type || "OTHERS",
        status: i.status,
        availableSeats:
          (i.license?.totalSeats || 0) - (i.license?.licenseKeys.length || 0),
        availableKeys:
          (i.license?.totalSeats || 0) -
          (i.license?.licenseKeys?.filter((k) => k.status === "ACTIVE")
            ?.length || 0),
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
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}
