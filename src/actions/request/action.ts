"use server";

import { createClient } from "@/lib/supabase/supabase-server";
import { createRequest } from "@/data/request/request";
import { prisma } from "@/lib/prisma";
import { AddApproverInput } from "@/lib/schemas/request/request";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { NotificationType } from "@prisma/client";

interface SubmitRequestInput {
  requestItems;
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

    if (requestedFor && requestedFor !== "self" && requestedFor === user.id) {
      return {
        success: false,
        error:
          "You cannot select yourself when submitting for 'another employee'.",
      };
    }

    if (requestedFor) {
      if (user.user_metadata.role === "EMPLOYEE") {
        return {
          success: false,
          error:
            "Employees cannot submit requests on behalf of others. Submit for yourself only.",
        };
      }

      const requestedUser = await prisma.userDetails.findFirst({
        where: { id: requestedFor },
        select: { department: true },
      });

      if (!requestedUser) {
        return { success: false, error: "Requested user not found." };
      }

      if (requestedUser.department !== user.user_metadata.department) {
        return {
          success: false,
          error:
            "You can only submit requests for users with the same department as yours.",
        };
      }
    }

    const requestedForId = requestedFor === "self" ? user.id : requestedFor;

    const { error } = await createRequest(
      {
        id: user.id,
        isManager: user.user_metadata.role === "MANAGER",
      },
      requestedForId,
      requestItems
    );

    if (error) {
      return { success: false, error };
    }

    return { success: true, warnings: error };
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

    const result = await prisma.$transaction(async (tx) => {
      // Validate ownership
      const approval = await tx.requestItemApproval.findUnique({
        where: { id: approvalId },
        select: { approverId: true, status: true, requestItemId: true },
      });

      if (!approval || approval.approverId !== user.id) {
        throw new Error("Not authorized for this approval.");
      }
      if (approval.status !== "PENDING") {
        throw new Error("Approval already processed.");
      }

      //  Update the approval
      await tx.requestItemApproval.update({
        where: { id: approvalId },
        data: {
          status: decision,
          reason: reason ?? null,
          approvedAt: new Date(),
        },
      });

      // Update the request item status
      const itemApprovals = await tx.requestItemApproval.findMany({
        where: { requestItemId },
        select: { status: true },
      });

      let itemStatus: "APPROVED" | "DENIED" | "REVIEWING";
      if (itemApprovals.some((a) => a.status === "DENIED")) {
        itemStatus = "DENIED";
      } else if (itemApprovals.every((a) => a.status === "APPROVED")) {
        itemStatus = "APPROVED";
      } else {
        itemStatus = "REVIEWING";
      }

      const updatedItem = await tx.requestItem.update({
        where: { id: requestItemId },
        data: { status: itemStatus },
      });

      // Update parent license request status
      const siblingItems = await tx.requestItem.findMany({
        where: { requestId: updatedItem.requestId },
        select: { status: true },
      });

      const statuses = siblingItems.map((i) => i.status);

      let parentStatus: "ASSIGNING" | "DENIED" | "REVIEWING" | "PENDING";

      if (statuses.some((s) => s === "DENIED")) {
        parentStatus = "ASSIGNING";
      } else if (statuses.every((s) => s === "APPROVED")) {
        parentStatus = "ASSIGNING";
      } else if (statuses.every((s) => s === "PENDING")) {
        parentStatus = "PENDING";
      } else {
        parentStatus = "REVIEWING";
      }

      // Only update & notify if the parent status changed
      const parentRequest = await tx.licenseRequest.findUnique({
        where: { id: updatedItem.requestId },
        select: { status: true, requestorId: true, requestedForId: true },
      });

      if (!parentRequest) throw new Error("Parent request not found");

      if (parentRequest.status !== parentStatus) {
        await tx.licenseRequest.update({
          where: { id: updatedItem.requestId },
          data: { status: parentStatus },
        });

        const usersToNotify = [parentRequest.requestorId];
        if (
          parentRequest.requestedForId &&
          parentRequest.requestedForId !== parentRequest.requestorId
        ) {
          usersToNotify.push(parentRequest.requestedForId);
        }

        const licenseName =
          updatedItem.type === "LICENSE"
            ? (
                await tx.license.findUnique({
                  where: { id: updatedItem.licenseId! },
                })
              )?.name ?? "Unknown License"
            : updatedItem.requestedLicenseName ?? "Unknown License";

        const vendor =
          updatedItem.type === "LICENSE"
            ? (
                await tx.license.findUnique({
                  where: { id: updatedItem.licenseId! },
                })
              )?.vendor ?? "Unknown Vendor"
            : updatedItem.requestedLicenseVendor ?? "Unknown Vendor";

        await Promise.all(
          usersToNotify.map((userId) =>
            sendNotification(
              {
                userId,
                type: NotificationType.LICENSE_REQUESTED,
                payload: {
                  requestId: updatedItem.requestId,
                  status: parentStatus,
                  reason,
                  licenseName,
                  vendor,
                },
                url: `/requests/${updatedItem.requestId}`,
              },
              tx
            )
          )
        );
      }

      return { success: true, itemStatus, parentStatus, error: "" };
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "Failed to process request item.",
    };
  }
}

export async function addApproverToRequestItem(
  requestItemId: string,
  data: AddApproverInput
) {
  try {
    // Check if approver exists
    const approver = await prisma.userDetails.findUnique({
      where: { id: data.approverId },
      select: { id: true, role: true },
    });

    if (!approver) {
      return { error: "Approver not found" };
    }

    // Prevent duplicates (existing approver already assigned to this request item)
    const existingApproval = await prisma.requestItemApproval.findFirst({
      where: {
        requestItemId,
        approverId: data.approverId,
      },
      select: { id: true, status: true },
    });

    if (existingApproval) {
      if (existingApproval.status === "PENDING") {
        return { error: "This approver is already assigned and pending." };
      }
      return { error: "This approver has already been assigned before." };
    }

    // Create the new approval entry
    const approval = await prisma.requestItemApproval.create({
      data: {
        requestItemId,
        approverId: data.approverId,
        level: data.level,
        status: "PENDING",
      },
    });

    return { data: approval, error: "" };
  } catch (error) {
    console.error("Error adding approver:", error);
    return { error: "Something went wrong while adding the approver." };
  }
}
