import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" });
    }

    const userId = user.id;
    const userRole = user.user_metadata?.role;
    const userDept = user.user_metadata?.department;

    // ONLY SELECTING NEEDED FIELDS FOR VALIDATION CHECK
    const requestMeta = await prisma.licenseRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requestor: { select: { id: true, department: true } },
        requestedFor: { select: { id: true, department: true } },
        items: {
          select: {
            id: true,
            license: { select: { owner: true } },
            approvals: {
              select: {
                approver: {
                  select: { id: true, department: true },
                },
              },
            },
          },
        },
      },
    });

    if (!requestMeta) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ACCESS CONTROL SECTION
    const isRequestor = requestMeta.requestor.id === userId;
    const isRequestedFor = requestMeta.requestedFor?.id === userId;
    const isApprover = requestMeta.items.some((i) =>
      i.approvals.some((a) => a.approver.id === userId)
    );

    const isSameDeptLeadOrManager =
      ["TEAM_LEAD", "MANAGER"].includes(userRole) &&
      (requestMeta.requestedFor?.department === userDept ||
        requestMeta.requestor.department === userDept ||
        requestMeta.items.some((i) => i.license?.owner === userDept));

    const isITSGTeamLead = userRole === "TEAM_LEAD" && userDept === "ITSG";
    const isFinanceLeadManager =
      ["TEAM_LEAD", "MANAGER"].includes(userRole) && userDept === "FINANCE";
    const hasAccess =
      isRequestor ||
      isRequestedFor ||
      isApprover ||
      isSameDeptLeadOrManager ||
      isITSGTeamLead ||
      isFinanceLeadManager;

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" });
    }

    // LOADING UP FULL DETAILS SECTION
    const licenseRequest = await prisma.licenseRequest.findUnique({
      where: { id: requestMeta.id },
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
            position: true,
            manager: { select: { name: true, email: true } },
          },
        },
        requestedFor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
          },
        },
        items: {
          include: {
            license: {
              select: {
                id: true,
                name: true,
                vendor: true,
                description: true,
                totalSeats: true,
                cost: true,
                owner: true,
                expiryDate: true,
                status: true,
                type: true,
                licenseKeys: {
                  where: { status: "ACTIVE" },
                  select: { id: true, status: true },
                },
              },
            },
            assignments: {
              include: {
                licenseKey: true,
                assigner: true,
              },
            },
            approvals: {
              include: {
                approver: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                  },
                },
              },
              orderBy: { level: "asc" },
            },
          },
        },
      },
    });

    if (!licenseRequest) {
      return NextResponse.json({ error: "Forbidden" });
    }

    const updatedItems = licenseRequest.items.map((item) => {
      let needsPurchase = false;
      let canTakeAction = false;
      let isDoneApproving = false;
      const licenseStatus = item.status;
      let canPurchase = false;
      let declineReason = "";
      const assignment = item.assignments.find(
        (i) => i.requestItemId === item.id
      );
      const assignedBy = ` ${assignment?.assigner?.name} - ${assignment?.assigner?.department}`;
      for (const approval of item.approvals) {
        if (approval.status === "APPROVED" && approval.approver.id === userId) {
          isDoneApproving = true;
        }

        if (
          (approval.status === "DENIED" || approval.status === "ASSIGNING") &&
          approval.reason
        ) {
          declineReason = approval.reason;
        }

        if (
          !isDoneApproving &&
          approval.status === "PENDING" &&
          userId === approval.approverId &&
          licenseStatus !== "DENIED"
        ) {
          canTakeAction = true;
        }
      }
      // CHECKING IF ITEM NEEDS PURCHASE BASED ON TYPE
      if (item?.license?.type === "SEAT_BASED") {
        const totalSeats = item.license?.totalSeats || 0;
        const assignedCount = item.license?.licenseKeys.filter(
          (a) => a.status === "ASSIGNED"
        ).length;

        const availableCount = totalSeats - assignedCount;
        const requiredStatus = ["PENDING", "REVIEWING"];
        needsPurchase =
          availableCount <= 0 &&
          totalSeats > 0 &&
          requiredStatus.includes(item.status);
      } else if (item.license?.type === "KEY_BASED") {
        const totalSeats = item.license?.totalSeats || 0;
        const activeKeys = item.license?.licenseKeys.filter(
          (k) => k.status === "ACTIVE"
        ).length;
        const availableCount = activeKeys || 0;
        const requiredStatus = ["PENDING", "REVIEWING"];
        needsPurchase =
          availableCount <= 0 &&
          totalSeats > 0 &&
          requiredStatus.includes(item.status);
      } else {
        needsPurchase = item.type === "OTHER";
      }

      canPurchase = userRole === "TEAM_LEAD" && userDept === "ITSG";

      return {
        ...item,
        canTakeAction,
        isDoneApproving,
        declineReason,
        needsPurchase,
        canPurchase,
        assignedBy,
      };
    });

    const responsePayload = { ...licenseRequest, items: updatedItems };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error fetching request details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
