"use server";

import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { createClient } from "@/lib/supabase/supabase-server";
import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "crypto";
import { logAuditEvent } from "../audit/action";

// SCHEMA VALIDATION
const ProcurementSchema = z.object({
  name: z.string().min(2, "Item name is required."),
  itemDescription: z.string().min(2, "Item description is required."),
  vendor: z.string().min(2, "Vendor name is required."),
  vendorEmail: z.string().email().optional().or(z.literal("")),
  price: z.string().optional(),
  quantity: z.number().min(1).default(1),
  currency: z.string().default("PHP"),
  cc: z.enum(["ITSG", "SSED", "SRE", "HR"]).optional(),
  notes: z.string().optional(),
  licenseId: z.string().optional(),
  requestItemId: z.string(),
});

export async function createProcurementAction(formData) {
  try {
    // AUTHENTICATION AND PERMISSION ACCESS CHECK
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const userRole = user.user_metadata.role;
    const userDepartment = user.user_metadata.department;

    // ONLY FINANCE DEPARTMENT CAN SEE THE REQUEST
    if (
      !["MANAGER", "TEAM_LEAD"].includes(userRole) ||
      !["ITSG", "FINANCE"].includes(userDepartment)
    ) {
      return { error: "Forbidden" };
    }

    // PARSING AND VALIDATION SECTION
    const parsed = ProcurementSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0].message,
      };
    }

    const data = parsed.data;

    const totalCost = data.price
      ? Number(data.price) * Number(data.quantity)
      : 0;

    const requestInstance = await prisma.requestItem.findFirst({
      where: { id: data.requestItemId },
      select: { id: true, justification: true, requestId: true },
    });

    if (!requestInstance || !requestInstance.justification) {
      return { error: "Request item id not found" };
    }

    const purchaseInstance = await prisma.procurementRequest.findFirst({
      where: { requestItemId: data.requestItemId },
      select: {
        id: true,
      },
    });

    if (purchaseInstance) {
      return { error: "A purchase request already exists for this item." };
    }

    await prisma.$transaction(async (tx) => {
      // PROCUREMENT REQUEST CREATION
      const procurement = await tx.procurementRequest.create({
        data: {
          itemName: data.name,
          itemDescription: data.itemDescription,
          justification: requestInstance.justification as string,
          vendor: data.vendor,
          vendorEmail: data.vendorEmail,
          price: data.price ? Number(data.price) : null,
          currency: data.currency || "PHP",
          quantity: data.quantity || 1,
          totalCost,
          cc: data.cc || "ITSG",
          notes: data.notes || null,
          requestedById: user.id,
          requestItemId: data.requestItemId,
        },
        include: {
          requestedBy: true,
          approvedBy: true,
        },
      });

      // UPDATE REQUEST ITEM ID STATUS
      await tx.requestItem.update({
        where: { id: data.requestItemId },
        data: {
          status: "PURCHASING",
        },
      });
      await logAuditEvent({
        action: "UPDATED",
        entity: "LicenseRequest",
        entityId: requestInstance.requestId,
        description: `The license request status was changed to "PURCHASING" as the approval step was skipped.
         ITSG Admin will proceed with the purchase to determine final approval or decline.`,
        changes: {
          status: "PURCHASING",
        },
        tx: tx,
      });

      const financeManager = await tx.userDetails.findFirst({
        where: { role: "MANAGER", department: "FINANCE" },
        select: {
          id: true,
          name: true,
        },
      });

      if (!financeManager) {
        throw new Error("No available finance manager yet");
      }

      // FINANCE MANAGER NOTIFICATION
      await sendNotification(
        {
          userId: financeManager?.id,
          type: NotificationType.PROCUREMENT_CREATED,
          payload: {
            requestorName: procurement.requestedBy.name,
            isOwner: false,
            item: procurement.itemName,
          },
          url: `/procurement/${procurement.id}`,
        },
        tx
      );

      // REQUESTOR NOTIFICATION
      await sendNotification(
        {
          userId: user.id,
          type: NotificationType.PROCUREMENT_CREATED,
          payload: {
            isOwner: true,
            item: procurement.itemName,
          },
          url: `/procurement/${procurement.id}`,
        },
        tx
      );
      await logAuditEvent({
        userId: user.id,
        action: "UPDATED",
        entity: "LicenseRequest",
        entityId: requestInstance.requestId,
        description: `${" ITSG Admin"} has initiated a purchasing request for ${
          procurement.itemName ?? "a license"
        }. The procurement process will now proceed.`,
        changes: {
          status: "PURCHASING",
        },
        tx: tx,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating procurement:", error);
    return { success: false, error: "Failed to create procurement request." };
  }
}

export async function procurementDeclineApproveAction({
  procurementId,
  action,
  remarks,
}: {
  procurementId: string;
  action: "APPROVED" | "REJECTED";
  remarks?: string;
}) {
  try {
    // AUTHENTICATION AND PERMISSION ACCESS CHECK
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const userRole = user.user_metadata.role;
    const userDepartment = user.user_metadata.department;

    // ONLY FINANCE DEPARTMENT CAN SEE THE REQUEST
    if (
      !["MANAGER", "TEAM_LEAD"].includes(userRole) ||
      !["FINANCE"].includes(userDepartment)
    ) {
      return { error: "Forbidden" };
    }

    // CHECK IF PROCUREMENT REQUEST EXIST
    const procurement = await prisma.procurementRequest.findUnique({
      where: { id: procurementId },
      select: {
        id: true,
        status: true,
        requestItem: { select: { requestId: true } },
      },
    });
    const requestId = procurement?.requestItem?.requestId;
    if (!procurement) {
      return { success: false, error: "Procurement request not found." };
    }
    // PREVENT REPEATED ACTIONS
    if (["APPROVED", "REJECTED"].includes(procurement.status)) {
      return {
        success: false,
        error: `This procurement request is already ${procurement.status.toLowerCase()}.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // UPDATE RECORD
      const procurement = await tx.procurementRequest.update({
        where: { id: procurementId },
        data: {
          status: action === "APPROVED" ? "APPROVED" : "REJECTED",
          purchaseStatus: action === "APPROVED" ? "IN_PROGRESS" : "CLOSED",
          rejectionReason: remarks || null,
          approvedById: user.id,
          approvedcreatedAt: new Date(),
          approvedupdatedAt: new Date(),
        },
        include: {
          requestedBy: true,
          requestItem: {
            select: {
              requestId: true,
            },
          },
        },
      });
      const approver = await tx.userDetails.findFirst({
        where: { id: procurement.approvedById as string },
        select: {
          name: true,
        },
      });

      if (!approver) {
        throw new Error("Approver not found. Cannot send notification.");
      }

      // PUSH NOTIFICATION TO REQUESTOR SECTION
      await sendNotification(
        {
          userId: procurement.requestedById,
          type:
            action === "APPROVED"
              ? NotificationType.PROCUREMENT_APPROVED
              : NotificationType.PROCUREMENT_REJECTED,
          payload: {
            procurementId,
            item: procurement.itemName,
            approverName: approver.name,
            reason: remarks,
          },
          url: `/procurement/${procurementId}`,
        },
        tx
      );

      // CREATE LOG TRAIL
      await logAuditEvent({
        userId: user.id,
        action: action === "APPROVED" ? "APPROVED" : "DENIED",
        entity: "LicenseRequest",
        entityId: procurement.requestItem?.requestId,
        description: `${approver.name} has ${
          action === "APPROVED" ? "approved" : "denied"
        } the procurement request for ${procurement.itemName ?? "a license"}. ${
          remarks ? `Reason: ${remarks}` : ""
        }`,
        changes: {
          status: action === "APPROVED" ? "APPROVED" : "DENIED",
          reason: remarks || null,
        },
        tx: tx,
      });

      // PUSH NOTIFICATION FOR ADMINS SECTION
      const admins = await tx.userDetails.findMany({
        where: {
          role: { in: ["ACCOUNT_OWNER", "ADMIN", "MANAGER", "TEAM_LEAD"] },
          department: procurement.requestedBy.department,
        },
        select: { id: true },
      });

      if (action === "REJECTED") {
        await tx.requestItem.update({
          where: { id: procurement.requestItemId! },
          data: {
            status: "DENIED",
          },
        });

        const siblingItems = await tx.requestItem.findMany({
          where: { requestId: requestId },
          select: { status: true },
        });

        const statuses = siblingItems.map((i) => i.status);

        let parentStatus:
          | "ASSIGNING"
          | "DENIED"
          | "REVIEWING"
          | "PENDING"
          | "APPROVED";

        if (statuses.every((s) => s === "DENIED")) {
          parentStatus = "DENIED";
        } else if (statuses.every((s) => s === "APPROVED")) {
          parentStatus = "ASSIGNING";
        } else if (statuses.every((s) => s === "PENDING")) {
          parentStatus = "PENDING";
        } else if (statuses.some((s) => s === "APPROVED")) {
          parentStatus = "ASSIGNING";
        } else {
          parentStatus = "REVIEWING";
        }
        await tx.licenseRequest.update({
          where: { id: requestId },
          data: { status: parentStatus },
        });
      }

      admins.map(async (i) => {
        await sendNotification(
          {
            userId: i.id,
            type:
              action === "APPROVED"
                ? NotificationType.PROCUREMENT_APPROVED
                : NotificationType.PROCUREMENT_REJECTED,
            payload: {
              procurementId,
              item: procurement.itemName,
              approverName: approver.name,
              reason: remarks,
            },
            url: `/procurement/${procurementId}`,
          },
          tx
        );
      });
    });

    return {
      success: true,
      error: "",
    };
  } catch (error) {
    console.error("procurementDeclineApproveAction error:", error);
    return {
      success: false,
      error: "Something went wrong while updating the request.",
    };
  }
}

export async function uploadProofOfPurchase(
  formData: FormData,
  procurementId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const userRole = user.user_metadata.role;
  const userDepartment = user.user_metadata.department;

  // ALLOW FINANCE OR ITSG TEAM LEADS
  if (
    !["MANAGER", "TEAM_LEAD"].includes(userRole) ||
    !["ITSG", "FINANCE"].includes(userDepartment)
  ) {
    return { error: "Forbidden" };
  }

  const singleFile = formData.get("file") as File | null;
  const multipleFiles = formData.getAll("files") as File[];

  const files = multipleFiles.length
    ? multipleFiles
    : singleFile
    ? [singleFile]
    : [];

  if (!files.length) return { error: "No files uploaded" };
  if (files.length > 3) return { error: "You can only upload up to 3 files." };

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  // FILE VALIDATIONS
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return { error: `Invalid file type: ${file.name}` };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: `File ${file.name} exceeds 5MB limit` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // UPLOADING EACH ITEM
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const filePath = `proofs/${procurementId}/${randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("procurement-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(
            "Supabase upload error:",
            uploadError.message,
            uploadError
          );
          throw new Error(
            `Upload failed for ${file.name}: ${uploadError.message}`
          );
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("procurement-files").getPublicUrl(filePath);

        await tx.procurementAttachment.create({
          data: {
            procurementId,
            fileName: file.name,
            fileUrl: publicUrl,
            uploadedById: user.id,
          },
        });
      }

      // PROCUREMENT STATUS UPDATE
      const requestItem = await tx.procurementRequest.update({
        where: { id: procurementId },
        data: { purchaseStatus: "PURCHASED" },
        include: {
          approvedBy: true,
          requestedBy: {
            select: {
              name: true,
            },
          },
          requestItem: {
            select: {
              requestId: true,
            },
          },
        },
      });

      if (!requestItem) throw new Error("Procurement request not found");

      // NOTIFY APPROVER
      const title = "New Proof of Purchase Uploaded";
      const message = `Proof of purchase has been uploaded for procurement request #${procurementId}.`;

      // NOTIFIY ADMINS AND FINANCE
      if (requestItem.approvedBy) {
        await sendNotification(
          {
            userId: requestItem.approvedBy.id,
            type: NotificationType.GENERAL,
            payload: { title, message },
            url: `/procurement/${procurementId}`,
          },
          tx
        );
      }

      await logAuditEvent({
        userId: user.id,
        action: "UPLOADED",
        entity: "LicenseRequest",
        entityId: requestItem.requestItem?.requestId,
        description: `${requestItem.requestedBy.name} uploaded a proof document for the procurement
        }. The uploaded file will be reviewed for verification.`,
        tx: tx,
      });

      // NOTIFY CO ADMINS
      const coAdmins = await tx.userDetails.findMany({
        where: {
          department: userDepartment,
          role: { in: ["ACCOUNT_OWNER", "ADMIN", "TEAM_LEAD", "MANAGER"] },
          id: { not: user.id },
        },
        select: { id: true },
      });

      await Promise.all(
        coAdmins.map((userDetail) =>
          sendNotification(
            {
              userId: userDetail.id,
              type: NotificationType.GENERAL,
              payload: { title, message },
              url: `/procurement/${procurementId}`,
            },
            tx
          )
        )
      );
    });

    return { success: true };
  } catch (err) {
    console.error("Upload transaction failed:", err);
    return { error: "Transaction failed. All uploads were reverted." };
  }
}

export async function acceptProofOfPurchase(procurementId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const userRole = user.user_metadata.role;
  const userDepartment = user.user_metadata.department;

  // ALLOW FINANCE OR ITSG TEAM LEADS
  if (userRole !== "MANAGER" || userDepartment !== "FINANCE") {
    return { error: "Forbidden" };
  }
  const procInstance = await prisma.procurementRequest.findFirst({
    where: { id: procurementId },
    include: { requestItem: true },
  });

  if (!procInstance) {
    return { error: "Procurement request not found" };
  }

  // TODO: IF REQUEST TYPE IS OTHER, AUTO CREATE NEW LICENSE OF IT, AND POINT THAT AUTOMATICALLY TO REQUEST
  const requestType = procInstance.requestItem?.type;
  const requestorId = procInstance.requestedById;
  let licenseId;
  let purchasedQuantity;
  let cost;
  if (requestType === "LICENSE") {
    licenseId = procInstance.requestItem?.licenseId;
    purchasedQuantity = procInstance.quantity;
    cost = procInstance.totalCost;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // PROCUREMENT STATUS UPDATE
      if (requestType === "LICENSE") {
        const license = await prisma.license.update({
          where: { id: licenseId },
          data: { totalSeats: { increment: purchasedQuantity }, cost: cost },
        });
        // PUSH NOTIFICATION FOR AUTOMATED UPDATE
        const title = "Automated License Seat Update";
        const message = `The system has automatically increased the available seats for license **${license.name}** by **${purchasedQuantity}** seat(s) as part of procurement request #${procurementId}.`;
        await sendNotification(
          {
            userId: requestorId,
            type: NotificationType.GENERAL,
            payload: { title, message },
            url: `/license-management/${license.id}`,
          },
          tx
        );
        // LICENSE REQUEST AUDIT
        await logAuditEvent({
          action: "UPDATED",
          entity: "LicenseRequest",
          entityId: procInstance.requestItem?.requestId,
          description: message,
          tx: tx,
        });
        // EXISITING LICENSE AUDIT
        await logAuditEvent({
          action: "UPDATED",
          entity: "License",
          entityId: license.id,
          description: message,
          tx: tx,
        });
      } else if (requestType === "OTHER") {
        // AUTO CREATE OF LICENSE BASED ON PROCUREMENT DATA
        const license = await tx.license.create({
          data: {
            name: procInstance.itemName as string,
            vendor: procInstance.vendor,
            description: procInstance.itemDescription,
            totalSeats: procInstance.quantity,
            cost: procInstance.totalCost ? Number(procInstance.totalCost) : 0,
            owner: "ITSG",
            expiryDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ),
            type: "SEAT_BASED",
          },
        });
        const title = "Automated License Creation";
        const message = `A new license **${license.name}** has been automatically created by the system based on procurement request #${procurementId}. You can configure the license details, assign seats, or update settings as needed.`;

        await sendNotification(
          {
            userId: requestorId,
            type: NotificationType.GENERAL,
            payload: { title, message },
            url: `/license-management/${license.id}`,
          },
          tx
        );
        // LICENSE REQUEST AUDIT
        await logAuditEvent({
          action: "UPDATED",
          entity: "LicenseRequest",
          entityId: procInstance.requestItem?.requestId,
          description: message,
          tx: tx,
        });

        // FOR NEW LICENSE AUDIT
        await logAuditEvent({
          action: "CREATED",
          entity: "License",
          entityId: license.id,
          description: message,
          tx: tx,
        });

        // AUTO LINKING THE LICENSE CREATED TO LICENSE REQUEST ITEM AND CHANGE ITS TYPE FROM OTHERS TO LICENSE
        const requestItemIns = await tx.requestItem.update({
          where: { id: procInstance.requestItemId as string },
          data: { licenseId: license.id, type: "LICENSE" },
        });

        await logAuditEvent({
          action: "UPDATED",
          entity: "LicenseRequest",
          entityId: requestItemIns.requestId,
          description: `A new license ("${license.name}") was automatically linked to the related request item.
          The item type has been updated from "OTHERS" to "LICENSE" to reflect the change.`,
          tx: tx,
        });
      }

      // STATUS UPDATE
      const requestItem = await tx.procurementRequest.update({
        where: { id: procurementId },
        data: { status: "COMPLETED", purchaseStatus: "COMPLETED" },
        include: { approvedBy: true, requestItem: true },
      });

      if (!requestItem || !requestItem.requestItemId)
        throw new Error("Procurement request not found");

      await tx.requestItem.update({
        where: { id: requestItem.requestItemId },
        data: { status: "PENDING" },
      });

      // NOTIFY APPROVER
      const title = "Procurement Request is Completed";
      const message = `The procurement request #${procurementId} has been successfully completed. All purchase documents have been reviewed and confirmed by the Finance Department.`;

      // REQUEST AUDIT TRAIL
      await logAuditEvent({
        action: "UPDATED",
        entity: "LicenseRequest",
        entityId: requestItem.requestItem?.requestId,
        description: message,
        tx: tx,
      });

      // NOTIFIY ADMINS AND FINANCE
      if (requestItem.approvedBy) {
        await sendNotification(
          {
            userId: requestorId,
            type: NotificationType.GENERAL,
            payload: { title, message },
            url: `/procurement/${procurementId}`,
          },
          tx
        );
      }

      const coAdmins = await tx.userDetails.findMany({
        where: {
          department: userDepartment,
          role: { in: ["ACCOUNT_OWNER", "ADMIN", "TEAM_LEAD", "MANAGER"] },
          id: { not: user.id },
        },
        select: { id: true },
      });

      await Promise.all(
        coAdmins.map((userDetail) =>
          sendNotification(
            {
              userId: userDetail.id,
              type: NotificationType.GENERAL,
              payload: { title, message },
              url: `/procurement/${procurementId}`,
            },
            tx
          )
        )
      );
    });

    return { success: true };
  } catch (err) {
    console.error("Upload transaction failed:", err);
    return { error: "Something went wrong in saving." };
  }
}
