"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LicenseKeyStatus } from "@prisma/client";
import { addLicenseKey } from "@/data/license-management/license-key/license";
import { UserManagementPermission } from "@/lib/permissions/admin/permission";

export async function addLicenseKeyAction(licenseId: string, key: string) {
  const isPermitted = await UserManagementPermission();
  // TODO: CHECK IF THERE ARE STILL SEATS AVAILABLE

  if (!isPermitted.success || !isPermitted.data)
    return {
      error: "Unauthorized: You do not have permission to perform this action",
    };

  const response = await addLicenseKey(licenseId, key, isPermitted.data);
  if (response.error)
    return {
      error: response.error || "Something went wrong in creating license key",
    };

  return { success: true };
}

export async function removeLicenseKey(licenseId: string, keyId: string) {
  await prisma.licenseKey.delete({
    where: { id: keyId },
  });

  revalidatePath(`/license-management/${licenseId}`);
  return { success: true };
}

export async function updateLicenseKeyStatus(
  licenseId: string,
  keyId: string,
  status: LicenseKeyStatus
) {
  const updatedKey = await prisma.licenseKey.update({
    where: { id: keyId },
    data: { status },
  });

  revalidatePath(`/license-management/${licenseId}`);
  return updatedKey;
}
