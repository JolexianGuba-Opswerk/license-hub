"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LicenseKeyStatus } from "@prisma/client";
import {
  addLicenseKey,
  removeLicenseKey,
} from "@/data/license-management/license-key/license";
import { createClient } from "@/lib/supabase/supabase-server";

export async function addLicenseKeyAction(licenseId: string, key: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }
  const allowedRole = ["TEAM_LEAD", "MANAGER", "ADMIN"];
  if (!allowedRole.includes(user.user_metadata.role)) {
    return { error: "Forbidden" };
  }
  const response = await addLicenseKey(licenseId, key, {
    userId: user.id,
    userDepartment: user.user_metadata.department,
  });
  if (response.error)
    return {
      error: response.error || "Something went wrong in creating license key",
    };

  return { success: true };
}

export async function removeLicenseKeyAction(keyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }
  const allowedRole = ["TEAM_LEAD", "MANAGER", "ADMIN"];
  if (!allowedRole.includes(user.user_metadata.role)) {
    return { error: "Forbidden" };
  }

  const response = await removeLicenseKey(keyId);
  if (response.error)
    return {
      error: response.error || "Something went wrong in creating license key",
    };

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
