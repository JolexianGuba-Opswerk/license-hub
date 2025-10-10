"use server";

import { createClient } from "@/lib/supabase/supabase-server";
import { createRequest } from "@/data/request/request";
import { prisma } from "@/lib/prisma";
import { AddApproverInput } from "@/lib/schemas/request/request";

interface SubmitRequestInput {
  requestItems: any[];
  requestedFor: string | null;
}

export async function submitRequestAction({
  requestItems,
  requestedFor,
}: SubmitRequestInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const userDetails = await prisma.userDetails.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, department: true },
    });

    if (!userDetails) {
      return { success: false, error: "User details not found." };
    }

    if (
      requestedFor &&
      requestedFor !== "self" &&
      requestedFor === userDetails.id
    ) {
      return {
        success: false,
        error:
          "You cannot select yourself when submitting for 'another employee'.",
      };
    }

    if (userDetails.role === "EMPLOYEE" && requestedFor) {
      return {
        success: false,
        error:
          "Employees cannot submit requests on behalf of others. Submit for yourself only.",
      };
    }

    const requestedForId =
      requestedFor === "self" ? userDetails.id : requestedFor;

    const { error, data, warnings } = await createRequest(
      {
        id: userDetails.id,
        isManager: userDetails.role === "MANAGER",
      },
      requestedForId,
      requestItems
    );

    if (error) {
      return { success: false, error };
    }

    return { success: true, warnings: warnings };
  } catch (error) {
    console.error("submitRequestAction error:", error);
    return {
      success: false,
      error: "An unexpected error occurred while submitting the request.",
    };
  }
}

interface ApprovalInput {
  requestItemId: string;
  approvalId: string;
  reason?: string;
}

export async function processRequestItemAction({
  requestItemId,
  approvalId,
  reason,
  decision, // "APPROVED" | "DENIED"
}: ApprovalInput & { decision: "APPROVED" | "DENIED" }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // CHECK APPROVAL OWNERSHIP
    const approval = await prisma.requestItemApproval.findUnique({
      where: { id: approvalId },
      select: { approverId: true, status: true, requestItemId: true },
    });

    if (!approval || approval.approverId !== user.id) {
      return { success: false, error: "Not authorized for this approval." };
    }
    if (approval.status !== "PENDING") {
      return { success: false, error: "Already processed." };
    }

    // UPDATE THE APPROVAL
    await prisma.requestItemApproval.update({
      where: { id: approvalId },
      data: {
        status: decision,
        reason: reason ?? null,
        approvedAt: new Date(),
      },
    });

    // CHECK ALL APPROVALS
    const approvals = await prisma.requestItemApproval.findMany({
      where: { requestItemId },
      select: { status: true },
    });

    const allApproved = approvals.every((a) => a.status === "APPROVED");
    const anyDenied = approvals.some((a) => a.status === "DENIED");
    const allDenied = approvals.every((a) => a.status === "DENIED");

    // UPDATE REQUEST ITEM STATUS
    const updatedItem = await prisma.requestItem.update({
      where: { id: requestItemId },
      data: {
        status: allApproved
          ? "APPROVED"
          : allDenied
          ? "DENIED"
          : anyDenied
          ? "DENIED"
          : "PENDING",
      },
    });

    // CHECK PARENT LICENSE REQUEST STATUS
    const items = await prisma.requestItem.findMany({
      where: { requestId: updatedItem.requestId },
      select: { status: true },
    });

    if (items.every((i) => i.status === "APPROVED")) {
      await prisma.licenseRequest.update({
        where: { id: updatedItem.requestId },
        data: { status: "APPROVED" },
      });
    } else if (items.every((i) => i.status === "DENIED")) {
      await prisma.licenseRequest.update({
        where: { id: updatedItem.requestId },
        data: { status: "DENIED" },
      });
    } else if (items.some((i) => i.status === "APPROVED")) {
      await prisma.licenseRequest.update({
        where: { id: updatedItem.requestId },
        data: { status: "ASSIGNING" },
      });
    } else if (items.some((i) => i.status === "DENIED")) {
      await prisma.licenseRequest.update({
        where: { id: updatedItem.requestId },
        data: { status: "REVIEWING" },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("processRequestItemAction error:", err);
    return {
      success: false,
      error: `Failed to ${decision.toLowerCase()} request item.`,
    };
  }
}

export async function addApproverToRequestItem(
  requestItemId: string,
  data: AddApproverInput
) {
  try {
    // CHECK IF APPROVER EXIST
    const approver = await prisma.userDetails.findUnique({
      where: { id: data.approverId },
      select: { id: true, role: true },
    });

    if (!approver) {
      return { error: "Approver not found" };
    }

    // PREVENT DUPLICATES
    const existing = await prisma.requestItemApproval.findFirst({
      where: {
        requestItemId,
        approverId: data.approverId,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return { error: "Approver already assigned to this request item" };
    }
    const isStillPending = await prisma.requestItemApproval.findFirst({
      where: {
        requestItemId,
        approverId: data.approverId,
      },
      select: {
        id: true,
      },
    });

    // APPROVAL CREATION
    const approval = await prisma.requestItemApproval.create({
      data: {
        requestItemId,
        approverId: data.approverId,
        level: data.level,
        status: "PENDING",
      },
    });

    return { error: "", data: approval };
  } catch (error) {
    console.error("Error adding approver:", error);
    return { error: "Something went wrong while adding approver" };
  }
}
