import "server-only";
import { prisma } from "@/lib/prisma";
import { CreateLicense } from "@/lib/schemas/license-management/license";
import { LicenseStatus, NotificationType } from "@prisma/client";
import { sendNotification } from "@/lib/services/notification/notificationService";

// Create user in database and Supabase Auth
export async function createLicense(
  licenseData: CreateLicense,
  addedBy: string
) {
  try {
    const license = await prisma.license.create({
      data: {
        name: licenseData.name,
        vendor: licenseData.vendor,
        description: licenseData.description,
        totalSeats: licenseData.totalSeats,
        cost: licenseData.cost,
        expiryDate: licenseData.expiryDate
          ? new Date(licenseData.expiryDate)
          : null,
        addedById: addedBy,
        type: licenseData.type,
      },
    });

    // Notify each ITSG DEPARTMENT (ADMIN, ACCOUNT_OWNERS, MANAGER)
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
    return { data: license };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong updating user" };
  }
}

export async function updateLicense(
  licenseData: CreateLicense,
  addedBy: string
) {
  try {
    const licenseId = licenseData.id;
    delete licenseData.id;

    const isExist = await prisma.license.findUnique({
      where: { id: licenseId },
      select: { id: true },
    });

    if (!isExist) return { error: "License doesn't exist" };

    // Updating status section (If slot is already full and license is already Expired)
    let status: LicenseStatus = "AVAILABLE";
    if (
      licenseData.expiryDate &&
      new Date(licenseData.expiryDate) < new Date()
    ) {
      status = "EXPIRED";
    } else if (licenseData.totalSeats && !licenseData.availableSeats) {
      status = "FULL";
    } else {
      status = "AVAILABLE";
    }

    // TODO: When changing type, check first if there is any associated license keys with it.
    const license = await prisma.license.update({
      where: { id: licenseId },
      data: {
        name: licenseData.name,
        vendor: licenseData.vendor,
        description: licenseData.description,
        totalSeats: licenseData.totalSeats,
        cost: licenseData.cost,
        expiryDate: licenseData.expiryDate
          ? new Date(licenseData.expiryDate)
          : null,
        addedById: addedBy,
        availableSeats: licenseData.availableSeats,
        type: licenseData.type,
        status: status,
      },
    });
    return { data: license };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong updating user" };
  }
}
