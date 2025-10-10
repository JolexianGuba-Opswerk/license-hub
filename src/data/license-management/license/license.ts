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
    const license = await prisma.license.create({
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
      },
    });

    // PUSH NOTIFICATION OF EACH ITSG DEPARTMENT (ADMIN, ACCOUNT_OWNERS, MANAGER)
    const itsgAdmins = await prisma.userDetails.findMany({
      where: {
        department: "ITSG",
        role: {
          in: ["ADMIN", "ACCOUNT_OWNER", "MANAGER"],
        },
      },
    });
    await Promise.all(
      itsgAdmins.map((admin) =>
        sendNotification({
          userId: admin.id,
          type: NotificationType.LICENSE_CREATED,
          payload: {
            licenseName: license.name,
            vendor: license.vendor,
          },
          url: `/license-management/${license.id}`,
        })
      )
    );
    // CREATE AN AUDIT TRAIL
    LicenseLogger.created(license.id, {
      email: addedBy.email,
      userId: addedBy.id,
    });

    return { data: license };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong updating user" };
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
  try {
    const licenseId = licenseData.id;
    delete licenseData.id;

    const isExist = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!isExist) return { error: "License doesn't exist" };

    // UPDATING STATUS IF EXPIRED OR AVAILABLE
    let status: LicenseStatus = "AVAILABLE";
    if (
      licenseData.expiryDate &&
      new Date(licenseData.expiryDate) < new Date()
    ) {
      status = "EXPIRED";
    } else {
      status = "AVAILABLE";
    }

    // CHECKING IF TYPE IS CHANGED, AND IF THE LICENSE IS ALREADY IN USED
    // CHECKING IF LICENSE SEATS IS LOWER THAN THE CHANGE VALUE
    const currentLicenseState = await prisma.license.findUnique({
      where: { id: licenseId },
      select: { type: true, totalSeats: true },
    });
    if (!currentLicenseState) return { error: "License not found" };

    const isTypeChanging = licenseData.type !== currentLicenseState?.type;
    const isReducingTotalSeats =
      licenseData.totalSeats < currentLicenseState?.totalSeats;

    if (isTypeChanging || isReducingTotalSeats) {
      const usedLicenseKeysCount = await prisma.licenseKey.count({
        where: {
          licenseId: licenseId,
          status: { in: ["ASSIGNED", "ACTIVE"] },
        },
      });
      if (usedLicenseKeysCount > 0) {
        if (isTypeChanging)
          return {
            error:
              "Cannot update license type : some license keys are still active or assigned",
          };
        else if (
          isReducingTotalSeats &&
          usedLicenseKeysCount > licenseData.totalSeats
        )
          return {
            error: `Cannot reduce total seats below ${usedLicenseKeysCount} assigned keys.`,
          };
      }
    }

    const license = await prisma.license.update({
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
        status: status,
      },
    });

    // PUSH NOTIFICATION OF ALL ITSG ADMINS HERE ...

    // CHECKING WHAT ARE THE CHANGES
    const changes = getChangedFields(isExist, license);
    // AUDIT TRAIL LOGS FOR LICENSE
    LicenseLogger.updated(
      license.id,
      { email: addedBy.email, userId: addedBy.id },
      changes
    );
    return { data: license };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong updating user" };
  }
}
