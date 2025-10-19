import { logAuditEvent } from "@/actions/audit/action";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { NotificationType, RequestItem } from "@prisma/client";

export async function createRequest(
  requestor: { id: string; isManager: boolean },
  requestedForId: string | null,
  items: RequestItem[]
) {
  let managerId: string | null = null;
  const ownerIds: string[] = [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create the main license request
      const request = await tx.licenseRequest.create({
        data: {
          requestorId: requestor.id,
          requestedForId,
          items: {
            create: items.map((item) =>
              item.type === "LICENSE"
                ? {
                    type: "LICENSE",
                    justification: item.justification,
                    licenseId: item.licenseId!,
                  }
                : {
                    type: "OTHER",
                    justification: item.justification,
                    requestedLicenseName: item.licenseName!,
                    requestedLicenseVendor: item.vendor ?? null,
                  }
            ),
          },
        },
        include: {
          items: {
            include: {
              license: {
                select: { id: true, name: true, vendor: true, owner: true },
              },
            },
          },
          requestedFor: {
            select: { name: true },
          },
          requestor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await logAuditEvent({
        userId: requestor.id,
        action: "CREATED",
        entity: "LicenseRequest",
        entityId: request.id,
        description: `${
          request?.requestor.name ?? "A user"
        } created a new license request ${
          request.requestor.id === requestor.id
            ? "for themselves"
            : `on behalf of ${request.requestedFor?.name ?? "another user"}`
        } containing ${request.items.length} item(s).`,
        changes: {
          requestedForId,
          items: request.items.map((i) => ({
            name: i.license?.name ?? i.requestedLicenseName,
            vendor: i.license?.vendor ?? i.requestedLicenseVendor,
          })),
        },
        tx: tx,
      });

      const errors: string[] = [];

      // 2️⃣ Fetch requestor details
      const requestorDetails = await tx.userDetails.findUnique({
        where: { id: requestor.id },
        select: { name: true, department: true },
      });

      // 3️⃣ Create approvals per item
      for (const item of request.items) {
        const license = item.license;

        // ITSG Approval
        const itsgLead = await tx.userDetails.findFirst({
          where: { role: "TEAM_LEAD", department: "ITSG" },
          select: { id: true },
        });
        if (itsgLead) {
          const approver = await tx.requestItemApproval.create({
            data: {
              requestItemId: item.id,
              approverId: itsgLead.id,
              level: "ITSG",
              status: "PENDING",
            },
            include: {
              approver: {
                select: { name: true },
              },
            },
          });
          await logAuditEvent({
            action: "CREATED",
            entity: "LicenseRequest",
            entityId: request.id,
            description: `${
              approver.approver.name
            } has been assigned as the ITSG-level approver for the license request item "${
              item.license?.name ?? "Unnamed License"
            }". The request is now awaiting their review and approval.`,

            tx: tx,
          });
        } else {
          errors.push("No ITSG team lead found.");
        }

        // Manager Approval
        if (!requestor.isManager) {
          const manager = await tx.userDetails.findFirst({
            where: { id: requestor.id },
            select: { managerId: true },
          });
          if (manager?.managerId) {
            const approver = await tx.requestItemApproval.create({
              data: {
                requestItemId: item.id,
                approverId: manager.managerId,
                level: "MANAGER",
                status: "PENDING",
              },
              include: {
                approver: {
                  select: { name: true },
                },
              },
            });
            await logAuditEvent({
              action: "CREATED",
              entity: "LicenseRequest",
              entityId: request.id,
              description: `${
                approver.approver.name
              } has been assigned as the Manager-level approver for the license request item "${
                item.license?.name ?? "Unnamed License"
              }". The request is now awaiting their review and approval.`,

              tx: tx,
            });
            managerId = manager.managerId;
          } else {
            errors.push("No manager found for this user.");
          }
        }

        // Owner Approval
        if (license && license.owner !== "ITSG") {
          const ownerTL = await tx.userDetails.findFirst({
            where: { role: "TEAM_LEAD", department: license.owner },
            select: { id: true },
          });
          if (ownerTL) {
            const approver = await tx.requestItemApproval.create({
              data: {
                requestItemId: item.id,
                approverId: ownerTL.id,
                level: "OWNER",
                status: "PENDING",
              },
              include: {
                approver: {
                  select: {
                    name: true,
                  },
                },
              },
            });
            await logAuditEvent({
              action: "CREATED",
              entity: "LicenseRequest",
              entityId: request.id,
              description: `${
                approver.approver.name
              } is assigned as approver for the license request item "${
                item.license?.name ?? "Unnamed License"
              }" under the ${
                license.owner
              } department. The request is now pending their review.`,

              tx: tx,
            });
            ownerIds.push(ownerTL.id);
          } else {
            errors.push(`No team lead found for ${license.owner} department.`);
          }
        }
      }

      //  Prepare common notification payload
      const licenseNames = request.items
        .map((i) => i.license?.name ?? i.requestedLicenseName)
        .filter(Boolean)
        .join(", ");
      const vendors = request.items
        .map((i) => i.license?.vendor ?? i.requestedLicenseVendor)
        .filter(Boolean)
        .join(", ");

      const notifyPayload = {
        requestId: request.id,
        requestorName: requestorDetails?.name ?? "Unknown User",
        licenseName: licenseNames,
        vendor: vendors,
        status: "CREATED",
      };

      // Notify ITSG admins/leads
      const itsgAdmins = await tx.userDetails.findMany({
        where: {
          department: "ITSG",
          role: { in: ["ADMIN", "ACCOUNT_OWNER", "TEAM_LEAD"] },
        },
        select: { id: true },
      });
      await Promise.all(
        itsgAdmins.map((admin) =>
          sendNotification(
            {
              userId: admin.id,
              type: NotificationType.LICENSE_REQUESTED,
              payload: { ...notifyPayload, forAdmin: true },
              url: `/requests/${request.id}`,
            },
            tx
          )
        )
      );

      // Notify manager
      if (managerId) {
        await sendNotification(
          {
            userId: managerId,
            type: NotificationType.LICENSE_REQUESTED,
            payload: { ...notifyPayload, forAdmin: true },
            url: `/requests/${request.id}`,
          },
          tx
        );
      }

      // Notify owner(s)
      if (ownerIds.length > 0) {
        await Promise.all(
          ownerIds.map((ownerId) =>
            sendNotification(
              {
                userId: ownerId,
                type: NotificationType.LICENSE_REQUESTED,
                payload: { ...notifyPayload, forAdmin: true },
                url: `/requests/${request.id}`,
              },
              tx
            )
          )
        );
      }

      // Notify requestor or requestedFor
      await sendNotification(
        {
          userId: requestedForId ?? requestor.id,
          type: NotificationType.LICENSE_REQUESTED,
          payload: { ...notifyPayload, forAdmin: false },
          url: `/requests/${request.id}`,
        },
        tx
      );

      return {
        error: errors.length > 0 ? errors.join("; ") : "",
        data: request,
      };
    });

    return result;
  } catch (error) {
    console.error("Create request error:", error);
    return { error: "Something went wrong while saving the request." };
  }
}
