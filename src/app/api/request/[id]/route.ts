import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET({ params }: { params: { id: string } }) {
  try {
    const [supabase, requestId] = [await createClient(), params.id];

    // 🚀 Run auth in parallel-friendly form
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.user_metadata?.role;
    const userDept = user.user_metadata?.department;

    // ONLY SELECTING NEEDED FIELDS FOR VALIDATION CHECK
    const requestMeta = await prisma.licenseRequest.findUnique({
      where: { id: requestId },
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

    const hasAccess =
      isRequestor ||
      isRequestedFor ||
      isApprover ||
      isSameDeptLeadOrManager ||
      isITSGTeamLead;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You are not authorized to view this request." },
        { status: 403 }
      );
    }

    // LOADING UP FULL DETAILS SECTION
    const licenseRequest = await prisma.licenseRequest.findUnique({
      where: { id: requestId },
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
              include: { licenseKey: true },
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
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updatedItems = licenseRequest.items.map((item) => {
      let canTakeAction = false;
      let isDoneApproving = false;

      for (const approval of item.approvals) {
        if (approval.status === "APPROVED" && approval.approver.id === userId) {
          isDoneApproving = true;
        }
        if (
          !isDoneApproving &&
          approval.approver.id === userId &&
          approval.status === "PENDING"
        ) {
          canTakeAction = true;
        }
      }

      return { ...item, canTakeAction, isDoneApproving };
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
