"use server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { createClient } from "@/lib/supabase/supabase-server";
import { NotificationType } from "@prisma/client";

async function checkLicenseAccess(user, requestItemId: string) {
  const requestItem = await prisma.requestItem.findUnique({
    where: { id: requestItemId },
    select: {
      license: { select: { owner: true } },
    },
  });

  if (!requestItem || !requestItem.license?.owner) {
    throw new Error("Invalid request item or missing license owner");
  }

  const licenseOwnerDept = requestItem.license.owner;
  const userDept = user.user_metadata?.department;
  const userRole = user.app_metadata?.role;

  const authorizedRoles = ["MANAGER", "TEAM_LEAD", "ADMIN", "ACCOUNT_OWNER"];

  const isAuthorized =
    userDept === "ITSG" ||
    userDept === licenseOwnerDept ||
    authorizedRoles.includes(userRole);

  if (!isAuthorized) {
    throw new Error("Unauthorized access");
  }
}

export interface ManualAssignLicenseKeyInput {
  requestItemId: string;
  licenseKeyId?: string;
  seatLink?: string;
  type: "KEY_BASED" | "SEAT_BASED";
}

export async function manualAssignLicenseKey({
  requestItemId,
  licenseKeyId,
  seatLink,
  type,
}: ManualAssignLicenseKeyInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { success: false, error: "Unauthorized" };

  if (type === "KEY_BASED" && !licenseKeyId)
    return {
      success: false,
      error: "License key ID is required for KEY_BASED",
    };
  if (type === "SEAT_BASED" && !seatLink)
    return { success: false, error: "Seat link is required for SEAT_BASED" };

  try {
    const requestItem = await prisma.requestItem.findFirst({
      where: { id: requestItemId, status: "APPROVED" },
      select: {
        id: true,
        type: true,
        licenseId: true,
        requestId: true,
        requestedLicenseName: true,
        license: {
          select: {
            name: true,
            totalSeats: true,
          },
        },
        assignments: {
          select: {
            id: true,
          },
        },
        request: {
          select: {
            id: true,
            requestor: {
              select: {
                name: true,
              },
            },
            requestedFor: {
              select: {
                name: true,
              },
            },
            requestorId: true,
            requestedForId: true,
          },
        },
      },
    });

    if (!requestItem)
      return {
        success: false,
        error: "Request item not found or not approved",
      };
    const license = requestItem.license;
    if (!license)
      return { success: false, error: "Associated license not found" };

    const targetUserId =
      requestItem.request.requestedForId ?? requestItem.request.requestorId;
    if (!targetUserId) return { success: false, error: "No target user found" };

    const assignmentData: any = {
      userId: targetUserId,
      requestItemId: requestItem.id,
      assignedBy: user.id,
      status: "ACTIVE",
      assignedAt: new Date(),
    };

    await prisma.$transaction(async (tx) => {
      if (type === "KEY_BASED") {
        assignmentData.licenseKeyId = licenseKeyId!;
        await tx.licenseKey.update({
          where: { id: licenseKeyId! },
          data: { status: "ASSIGNED" },
        });
      } else if (type === "SEAT_BASED") {
        // Check seat availability
        const usedSeats = requestItem.assignments.length;
        if (usedSeats >= license.totalSeats)
          throw new Error("No seats available");

        // CREATE LICENSE KEY RECORD for this seat
        const licenseKey = await tx.licenseKey.create({
          data: {
            licenseId: requestItem.licenseId,
            seatLink,
            status: "ASSIGNED",
            addedById: user.id,
          },
        });

        assignmentData.licenseKeyId = licenseKey.id;
      }

      // CREATE ASSIGNMENT
      await tx.licenseAssignment.create({
        data: assignmentData,
      });

      // UPDATE REQUEST ITEM STATUS
      await tx.requestItem.update({
        where: { id: requestItemId },
        data: { status: "ASSIGNING" },
      });

      // SEND NOTIFICATIONS SECTION
      const licenseName =
        requestItem.type === "LICENSE"
          ? requestItem.license?.name
          : requestItem.requestedLicenseName;

      const assigneeName = requestItem.request.requestedForId
        ? requestItem.request.requestedFor?.name
        : requestItem.request.requestor.name;

      const licenseApprovers = await tx.requestItemApproval.findMany({
        where: { requestItemId },
        select: { approverId: true },
      });

      const approverIds = licenseApprovers.map((a) => a.approverId);

      await Promise.allSettled([
        // Notify target user
        sendNotification(
          {
            userId: targetUserId,
            type: NotificationType.LICENSE_ASSIGNED,
            payload: {
              licenseName,
              assigneeName,
              message:
                targetUserId === user.id
                  ? `You have successfully assigned ${licenseName} to yourself.`
                  : `${licenseName} has been assigned to you.`,
              requestId: requestItem.request.id,
              itemId: requestItem.id,
              status: "ASSIGNED",
            },
            url: `/assign/assigned-key/${requestItem.request.id}`,
          },
          tx
        ),
        // Notify all approvers
        ...approverIds.map((approverId) =>
          sendNotification(
            {
              userId: approverId,
              type: NotificationType.LICENSE_ASSIGNED,
              payload: {
                licenseName,
                assigneeName,
                message: `${licenseName} has been assigned to ${assigneeName}.`,
                requestId: requestItem.request.id,
                itemId: requestItem.id,
                status: "ASSIGNED",
              },
              url: `/requests/${requestItem.request.id}`,
            },
            tx
          )
        ),
      ]);
    });

    return { success: true, message: "License assigned successfully" };
  } catch (err) {
    console.error("Manual license assignment failed:", err);
    return { success: false, error: "Failed to assign license" };
  }
}

interface AutoAssignLicenseKeyInput {
  requestItemId: string;
}

export async function autoAssignLicenseKey({
  requestItemId,
}: AutoAssignLicenseKeyInput) {
  // AUTH CHECK
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // GET REQUEST ITEM
    const requestItem = await prisma.requestItem.findFirst({
      where: { id: requestItemId, status: "APPROVED" },
      select: {
        id: true,
        type: true,
        licenseId: true,
        requestId: true,
        requestedLicenseName: true,
        license: {
          select: {
            name: true,
          },
        },
        request: {
          select: {
            id: true,
            requestor: {
              select: {
                name: true,
              },
            },
            requestedFor: {
              select: {
                name: true,
              },
            },
            requestorId: true,
            requestedForId: true,
          },
        },
      },
    });

    if (!requestItem) {
      return {
        success: false,
        error: "Request item not found or not approved",
      };
    }

    const targetUserId =
      requestItem.request.requestedForId ?? requestItem.request.requestorId;

    if (!targetUserId) {
      return { success: false, error: "No target user found for this request" };
    }

    // Prevent assigning to your own request
    if (targetUserId === user.id) {
      return {
        success: false,
        error: "You cannot assign a license to your own request",
      };
    }

    // VALIDATE LICENSE ACCESS
    await checkLicenseAccess(user, requestItemId);

    if (!requestItem.licenseId) {
      return {
        success: false,
        error: "This request item does not have a linked license",
      };
    }

    // FIND AVAILABLE LICENSE KEY
    const availableKey = await prisma.licenseKey.findFirst({
      where: {
        licenseId: requestItem.licenseId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "asc" },
    });

    if (!availableKey) {
      return {
        success: false,
        error: "No available license keys for this license",
      };
    }

    // RUN ATOMIC TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // CREATE LICENSE ASSIGNMENT
      const assignment = await tx.licenseAssignment.create({
        data: {
          userId: targetUserId,
          licenseKeyId: availableKey.id,
          requestItemId: requestItemId,
          assignedBy: user.id,
          status: "ACTIVE",
          assignedAt: new Date(),
        },
      });

      // UPDATE LICENSE KEY & REQUEST ITEM
      await Promise.all([
        tx.licenseKey.update({
          where: { id: availableKey.id },
          data: { status: "ASSIGNED" },
        }),
        tx.requestItem.update({
          where: { id: requestItemId },
          data: { status: "ASSIGNING" },
        }),
      ]);

      // SEND NOTIFICATIONS
      const licenseName =
        requestItem.type === "LICENSE"
          ? requestItem.license?.name
          : requestItem.requestedLicenseName;

      const assigneeName = requestItem.request.requestedForId
        ? requestItem.request.requestedFor?.name
        : requestItem.request.requestor.name;

      const licenseApprovers = await tx.requestItemApproval.findMany({
        where: { requestItemId },
        select: { approverId: true },
      });

      const approverIds = licenseApprovers.map((a) => a.approverId);

      await Promise.allSettled([
        // NOTIFY THE REQUESTOR
        sendNotification(
          {
            userId: targetUserId,
            type: NotificationType.LICENSE_ASSIGNED,
            payload: {
              licenseName,
              assigneeName,
              message:
                targetUserId === user.id
                  ? `You have successfully assigned ${licenseName} to yourself.`
                  : `${licenseName} has been assigned to you.`,
              requestId: requestItem.request.id,
              itemId: requestItem.id,
              status: "ASSIGNED",
            },
            url: `/assign/assigned-key/${requestItem.request.id}`,
          },
          tx
        ),

        // NOTIFY ALL APPROVERS
        ...approverIds.map((approverId) =>
          sendNotification(
            {
              userId: approverId,
              type: NotificationType.LICENSE_ASSIGNED,
              payload: {
                licenseName,
                assigneeName,
                message: `${licenseName} has been assigned to ${assigneeName}.`,
                requestId: requestItem.request.id,
                itemId: requestItem.id,
                status: "ASSIGNED",
              },
              url: `/requests/${requestItem.request.id}`,
            },
            tx
          )
        ),
      ]);

      return { assignment };
    });

    return {
      success: true,
      message: "License key automatically assigned successfully",
      ...result,
    };
  } catch (error) {
    console.error("Auto license assignment failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while auto-assigning a license key",
    };
  }
}

export async function licenseReceivalConfirmation(licenseAssignmentId: string) {
  // AUTHENTICATE USER
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // FETCH ASSIGNMENT AND RELATED REQUEST ITEM & LICENSE
      const assignment = await tx.licenseAssignment.findUnique({
        where: { id: licenseAssignmentId },
        include: {
          requestItem: {
            include: {
              license: true,
              request: { select: { id: true, requestorId: true } },
            },
          },
        },
      });

      if (!assignment) {
        return { success: false, error: "License assignment not found" };
      }

      // OWNERSHIP CHECK
      if (assignment.userId !== user.id) {
        return {
          success: false,
          error: "You are not authorized to confirm this license",
        };
      }

      // UPDATE REQUEST ITEM STATUS TO FULFILLED
      await tx.requestItem.update({
        where: { id: assignment.requestItemId },
        data: { status: "FULFILLED" },
      });

      // CHECK IF ALL ITEMS ARE FULFILLED
      const remainingItems = await tx.requestItem.count({
        where: {
          requestId: assignment.requestItem.requestId,
          NOT: { status: "FULFILLED" },
        },
      });

      // UPDATE MAIN LICENSE REQUEST IF ALL ITEMS ARE FULFILLED
      if (remainingItems === 0) {
        await tx.licenseRequest.update({
          where: { id: assignment.requestItem.requestId },
          data: { status: "FULFILLED" },
        });
      }

      // SEND NOTIFICATIONS
      const admins = await tx.userDetails.findMany({
        where: {
          department: "ITSG",
          role: { in: ["ADMIN", "ACCOUNT_OWNER", "TEAM_LEAD"] },
        },
        select: { id: true },
      });

      const licenseOwner = assignment.requestItem.license?.owner;

      // Notify admins
      await Promise.allSettled(
        admins.map((admin) =>
          sendNotification(
            {
              userId: admin.id,
              type: NotificationType.LICENSE_ASSIGNED,
              payload: {
                requestId: assignment.requestItem.requestId,
                licenseName:
                  assignment.requestItem.license?.name ?? "Unknown License",
                message: `${user.user_metadata.name} confirmed receipt of the license.`,
              },
              url: `/requests/${assignment.requestItem.requestId}`,
            },
            tx
          )
        )
      );

      // Notify license owner if different from ITSG
      if (licenseOwner && licenseOwner !== "ITSG") {
        const ownerTL = await tx.userDetails.findFirst({
          where: { role: "TEAM_LEAD", department: licenseOwner },
          select: { id: true },
        });

        if (ownerTL) {
          await sendNotification(
            {
              userId: ownerTL.id,
              type: NotificationType.LICENSE_ASSIGNED,
              payload: {
                requestId: assignment.requestItem.requestId,
                licenseName:
                  assignment.requestItem.license?.name ?? "Unknown License",
                message: `${user.user_metadata.name} confirmed receipt of the license.`,
              },
              url: `/requests/${assignment.requestItem.requestId}`,
            },
            tx
          );
        }
      }

      return {
        success: true,
        allItemsFulfilled: remainingItems === 0,
      };
    });

    return result;
  } catch (error: any) {
    console.error("Confirm license receipt failed:", error);
    return {
      success: false,
      error: error.message || "Something went wrong",
    };
  }
}
