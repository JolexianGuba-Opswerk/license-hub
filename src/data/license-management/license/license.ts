import "server-only";
import { prisma } from "@/lib/prisma";
import { CreateLicense } from "@/lib/schemas/license-management/license";
import { License, LicenseStatus, NotificationType } from "@prisma/client";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { LicenseLogger } from "@/logger/auditLogger";

// Create user in database and Supabase Auth
export async function createLicense(
  licenseData: CreateLicense,
  addedBy: { id: string; email: string }
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // LICENSE CREATION
      const license = await tx.license.create({
        data: {
          name: licenseData.name.trim(),
          vendor: licenseData.vendor.trim(),
          description: licenseData.description?.trim() || "",
          totalSeats: licenseData.totalSeats ?? 0,
          owner: licenseData.owner,
          cost: licenseData.cost ?? 0,
          expiryDate: licenseData.expiryDate
            ? new Date(licenseData.expiryDate)
            : null,
          addedById: addedBy.id,
          type: licenseData.type,
        },
      });

      // GET ALL USERS ADMIN
      const itsgAdmins = await tx.userDetails.findMany({
        where: {
          department: "ITSG",
          role: { in: ["ADMIN", "ACCOUNT_OWNER", "MANAGER"] },
        },
        select: { id: true },
      });

      // SENDING NOTIFICATION
      await Promise.all(
        itsgAdmins.map((admin) =>
          sendNotification(
            {
              userId: admin.id,
              type: NotificationType.LICENSE_CREATED,
              payload: {
                licenseName: license.name,
                vendor: license.vendor,
              },
              url: `/license-management/${license.id}`,
            },
            tx
          )
        )
      );
      // LOG LICENSE AUDIT TRAIL FOR
      LicenseLogger.created(license.id, {
        email: addedBy.email,
        userId: addedBy.id,
      });

      return { data: license };
    });
  } catch (err) {
    console.error(" Transaction failed:", err);
    return {
      error:
        err.message || "Something went wrong while creating the license record",
    };
  }
}

function getChangedFields(
  oldData: Record<string, License>,
  newData: Record<string, License>
) {
  const changes: Record<string, { old: License; new: License }> = {};
  for (const key in newData) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Treat null and undefined as equal
    if (oldValue instanceof Date && newValue instanceof Date) {
      if (oldValue.getTime() !== newValue.getTime()) {
        changes[key] = { old: oldValue, new: newValue };
      }
    } else if (oldValue !== newValue) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }
  return changes;
}

export async function updateLicense(
  licenseData: CreateLicense,
  addedBy: { id: string; email: string }
) {
  const licenseId = licenseData.id;
  if (!licenseId) return { error: "License ID is required" };

  // 🧩 Remove id from the data object to avoid conflicts in Prisma update
  delete licenseData.id;

  try {
    return await prisma.$transaction(async (tx) => {
      // VALIDATE LICENSE EXISTENCE
      const existing = await tx.license.findUnique({
        where: { id: licenseId },
      });
      if (!existing) return { error: "License not found" };

      // DETERMINE NEW STATUS
      let newStatus: LicenseStatus = "AVAILABLE";
      if (
        licenseData.expiryDate &&
        new Date(licenseData.expiryDate) < new Date()
      ) {
        newStatus = "EXPIRED";
      }

      // PREVENT INVALID UPDATE
      const current = await tx.license.findUnique({
        where: { id: licenseId },
        select: { type: true, totalSeats: true },
      });

      if (!current) return { error: "License not found" };

      const isTypeChanging = licenseData.type !== current.type;
      const isReducingSeats = licenseData.totalSeats < current.totalSeats;

      if (isTypeChanging || isReducingSeats) {
        const usedLicenseKeysCount = await tx.licenseKey.count({
          where: {
            licenseId,
            status: { in: ["ASSIGNED", "ACTIVE"] },
          },
        });

        if (usedLicenseKeysCount > 0) {
          if (isTypeChanging) {
            return {
              error:
                "Cannot change license type while keys are active or assigned.",
            };
          } else if (
            isReducingSeats &&
            usedLicenseKeysCount > licenseData.totalSeats
          ) {
            return {
              error: `Cannot reduce total seats below ${usedLicenseKeysCount} assigned keys.`,
            };
          }
        }
      }

      // ACTUAL UPDATE
      const updated = await tx.license.update({
        where: { id: licenseId },
        data: {
          name: licenseData.name,
          vendor: licenseData.vendor,
          description: licenseData.description,
          totalSeats: licenseData.totalSeats,
          owner: licenseData.owner,
          cost: licenseData.cost,
          expiryDate: licenseData.expiryDate
            ? new Date(licenseData.expiryDate)
            : null,
          addedById: addedBy.id,
          type: licenseData.type,
          status: newStatus,
        },
      });

      // AUDIT LICENSE TRAIL
      const changes = getChangedFields(existing, updated);
      await LicenseLogger.updated(
        updated.id,
        { email: addedBy.email, userId: addedBy.id },
        changes
      );

      return { data: updated };
    });
  } catch (err) {
    console.error(" Error updating license:", err);
    return { error: "Something went wrong while updating license." };
  }
}
