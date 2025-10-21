import "server-only";
import { prisma } from "@/lib/prisma";
import { LicenseKeyStatus } from "@prisma/client";

export async function addLicenseKey(
  licenseId: string,
  key: string,
  currentUser: {
    userId: string;
    userDepartment: string;
  }
) {
  return await prisma
    .$transaction(async (tx) => {
      //GETTING LICENSE KEY
      const license = await tx.license.findUnique({
        where: { id: licenseId },
        select: {
          id: true,
          totalSeats: true,
          owner: true,
          licenseKeys: {
            select: { key: true },
          },
        },
      });

      if (!license) {
        return { error: "License not found." };
      }
      if (license.owner !== currentUser.userDepartment)
        if (!license.totalSeats || license.totalSeats <= 0) {
          return { error: "No total seats configured for this license." };
        }

      // 2️⃣ Check duplicate
      const isDuplicate = license.licenseKeys.some(
        (k) => k?.key.trim().toLowerCase() === key.trim().toLowerCase()
      );

      if (isDuplicate) {
        return { error: "License key already exists for this license." };
      }

      // 3️⃣ Check seat availability
      const seatsUsed = license?.licenseKeys.length;
      const availableSeats = license.totalSeats - seatsUsed;

      if (availableSeats <= 0) {
        return { error: "No available seats remaining for this license." };
      }

      // 4️⃣ Create new key
      const newKey = await tx.licenseKey.create({
        data: {
          licenseId,
          key,
          status: "ACTIVE",
          addedById: currentUser.userId,
        },
      });

      return { data: newKey };
    })
    .catch((err) => {
      console.error("Error adding license key:", err);
      return { error: "Something went wrong creating license key." };
    });
}

export async function updateLicenseKeyStatus(
  keyId: string,
  status: LicenseKeyStatus
) {
  try {
    const updated = await prisma.licenseKey.update({
      where: { id: keyId },
      data: { status },
    });
    return { data: updated };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong updating license key status" };
  }
}

export async function assignLicenseKey(keyId: string, userId: string) {
  try {
    const assigned = await prisma.licenseKey.update({
      where: { id: keyId },
      data: {
        status: "ASSIGNED",
      },
    });
    return { data: assigned };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong assigning license key" };
  }
}

export async function revokeLicenseKey(keyId: string) {
  try {
    const revoked = await prisma.licenseKey.update({
      where: { id: keyId },
      data: {
        status: "REVOKED",
      },
    });
    return { data: revoked };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong revoking license key" };
  }
}

export async function removeLicenseKey(keyId: string) {
  try {
    const key = await prisma.licenseKey.findFirst({
      where: { id: keyId },
      include: {
        assignment: {
          where: { status: "ACTIVE" }, // or use your active assignment status
          select: { id: true, userId: true },
        },
      },
    });

    if (!key) {
      return { error: "License key not found." };
    }

    if (key.assignment?.length > 0) {
      return {
        error:
          "Cannot remove this license key because it is currently assigned to a user.",
      };
    }

    await prisma.licenseKey.delete({
      where: { id: keyId },
    });

    return { success: true, message: "License key removed successfully." };
  } catch (err) {
    console.error("Error removing license key:", err);
    return { error: "Something went wrong while removing the license key." };
  }
}
