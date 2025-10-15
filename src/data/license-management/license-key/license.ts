import "server-only";
import { prisma } from "@/lib/prisma";
import { LicenseKeyStatus } from "@prisma/client";

export async function addLicenseKey(
  licenseId: string,
  key: string,
  addedBy: string
) {
  try {
    // Check & Guard section
    const isExist = await prisma.licenseKey.findFirst({
      where: {
        licenseId: licenseId,
        key: key,
      },
      select: { id: true },
    });

    if (isExist) {
      return { error: "License key already exists for this license" };
    }
    const seatsUsed = await prisma.licenseKey.count({
      where: {
        licenseId: licenseId,
      },
    });

    const totalSeats = await prisma.license.findFirst({
      where: { id: licenseId },
      select: { totalSeats: true },
    });

    if (totalSeats?.totalSeats === 0) return { error: "No total seats set" };

    if ((totalSeats?.totalSeats ?? 0) - seatsUsed <= 0) {
      return { error: "No available seats remaining for this license" };
    }

    const newKey = await prisma.licenseKey.create({
      data: {
        licenseId,
        key,
        status: "ACTIVE",
        addedById: addedBy,
      },
    });

    return { data: newKey };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong creating license key" };
  }
}

export async function removeLicenseKey(keyId: string) {
  try {
    const deleted = await prisma.licenseKey.delete({
      where: { id: keyId },
    });
    return { data: deleted };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong removing license key" };
  }
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
