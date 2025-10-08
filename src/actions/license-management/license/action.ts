"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

import {
  CreateLicense,
  CreatelicenseSchema,
} from "@/lib/schemas/license-management/license";
import { UserManagementPermission } from "@/lib/permissions/admin/permission";
import {
  createLicense,
  updateLicense,
} from "@/data/license-management/license/license";

export type LicenseFormState = {
  success: boolean;
  error?: string;
};

export async function createLicenseAction(formData: CreateLicense) {
  // Permission Check section
  const isPermitted = await UserManagementPermission();
  if (!isPermitted.success || !isPermitted.data) {
    return {
      success: false,
      error: isPermitted.error ?? "Unathorized to perform this action",
    };
  }

  const validatedData = CreatelicenseSchema.safeParse(formData);
  if (validatedData.error) {
    return {
      success: false,
      error: validatedData.error.issues[0].message,
    };
  }

  //TODO: Add addition checking in here
  const license = await createLicense(validatedData.data, isPermitted.data);
  if (!license.data) {
    return { success: true, error: "Something went wrong" };
  }

  return { success: true };
}

// Update License Action
export async function updateLicenseAction(formData: CreateLicense) {
  // Permission Check section
  const isPermitted = await UserManagementPermission();
  if (!isPermitted.success || !isPermitted.data) {
    return {
      success: false,
      error: isPermitted.error ?? "Unathorized to perform this action",
    };
  }

  try {
    const validatedData = CreatelicenseSchema.safeParse(formData);
    if (validatedData.error) {
      return {
        success: false,
        error: validatedData.error.issues[0].message,
      };
    }

    const response = await updateLicense(validatedData.data, isPermitted.data);
    if (response.error || !response)
      return { success: false, error: response.error };

    return { success: true, error: "" };
  } catch {
    return { success: false, error: "Failed to update license" };
  }
}

// Delete License Action
export async function deleteLicenseAction(
  licenseId: string
): Promise<LicenseFormState> {
  try {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        licenseKeys: {
          where: {
            status: "ASSIGNED",
          },
        },
      },
    });

    if (!license) {
      return { success: false, error: "License not found" };
    }

    if (license.licenseKeys.length > 0) {
      return {
        success: false,
        error: "Cannot delete license with assigned keys",
      };
    }

    // Delete all license keys first (cascade delete would be better in schema)
    await prisma.licenseKey.deleteMany({
      where: { licenseId },
    });

    // Then delete the license
    await prisma.license.delete({
      where: { id: licenseId },
    });

    revalidatePath("/admin/license-management");
    return { success: true, error: "" };
  } catch (error) {
    console.error("Delete license error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete license" };
  }
}
