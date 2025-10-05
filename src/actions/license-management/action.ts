"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreatelicenseSchema } from "@/lib/schemas/license-management/license";
import { UserManagementPermission } from "@/lib/permissions/admin/permission";

const addLicenseKeySchema = z.object({
  licenseId: z.string().min(1, "License ID is required"),
  key: z.string().min(1, "License key is required"),
});

// Types
export type LicenseFormState = {
  success: boolean;
  error?: string;
};

// Create License Action
export async function createLicenseAction(
  prevState: LicenseFormState,
  formData: FormData
): Promise<LicenseFormState> {
  // Permission Check section
  const isPermitted = await UserManagementPermission();
  if (!isPermitted.success || !isPermitted.data) {
    return { success: false, error: isPermitted.error ?? "Unathorized" };
  }

  const validatedData = CreatelicenseSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (validatedData.error) {
    console.log(validatedData.error);
    return {
      success: false,
      error: validatedData.error.issues[0].message,
    };
  }

  const licenseData = validatedData.data;
  //TODO: Data access layer creation and additional check
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
    },
  });

  // If it's key-based, create initial empty keys array is handled by relations
  // You can add initial keys here if needed

  if (!license) {
    return { success: true, error: "Something went wrong" };
  }
  revalidatePath("/license-management");
  return { success: true };
}

// Update License Action
export async function updateLicenseAction(
  prevState: LicenseFormState,
  formData: FormData
): Promise<LicenseFormState> {
  try {
    const rawData = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      vendor: formData.get("vendor") as string,
      description: formData.get("description") as string,
      totalSeats: Number(formData.get("totalSeats")),
      cost: formData.get("cost") ? Number(formData.get("cost")) : undefined,
      expiryDate: formData.get("expiryDate") as string,
    };

    const validatedData = updateLicenseSchema.parse(rawData);

    // Check if we're reducing seats below currently used seats
    const currentLicense = await prisma.license.findUnique({
      where: { id: validatedData.id },
      include: {
        licenseKeys: true,
      },
    });

    if (!currentLicense) {
      return { success: false, error: "License not found" };
    }

    const usedSeats = currentLicense.licenseKeys.length;
    if (validatedData.totalSeats < usedSeats) {
      return {
        success: false,
        error: `Cannot reduce seats below currently used seats (${usedSeats})`,
      };
    }

    await prisma.license.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        vendor: validatedData.vendor,
        description: validatedData.description,
        totalSeats: validatedData.totalSeats,
        cost: validatedData.cost,
        expiryDate: validatedData.expiryDate
          ? new Date(validatedData.expiryDate)
          : null,
      },
    });

    revalidatePath("/admin/license-management");
    return { success: true, error: "" };
  } catch (error) {
    console.error("Update license error:", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update license" };
  }
}

// Add License Key Action
export async function addLicenseKeyAction(
  prevState: LicenseFormState,
  formData: FormData
): Promise<LicenseFormState> {
  try {
    const rawData = {
      licenseId: formData.get("licenseId") as string,
      key: formData.get("key") as string,
    };

    const validatedData = addLicenseKeySchema.parse(rawData);

    // Check license exists and has available seats
    const license = await prisma.license.findUnique({
      where: { id: validatedData.licenseId },
      include: {
        licenseKeys: true,
      },
    });

    if (!license) {
      return { success: false, error: "License not found" };
    }

    const usedSeats = license.licenseKeys.length;
    if (usedSeats >= license.totalSeats) {
      return { success: false, error: "No available seats remaining" };
    }

    // Check if key already exists
    const existingKey = await prisma.licenseKey.findFirst({
      where: {
        licenseId: validatedData.licenseId,
        key: validatedData.key,
      },
    });

    if (existingKey) {
      return { success: false, error: "License key already exists" };
    }

    await prisma.licenseKey.create({
      data: {
        licenseId: validatedData.licenseId,
        key: validatedData.key,
        status: "ACTIVE",
      },
    });

    revalidatePath("/admin/license-management");
    return { success: true, error: "" };
  } catch (error) {
    console.error("Add license key error:", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to add license key" };
  }
}

// Delete License Key Action
export async function deleteLicenseKeyAction(
  keyId: string
): Promise<LicenseFormState> {
  try {
    const licenseKey = await prisma.licenseKey.findUnique({
      where: { id: keyId },
    });

    if (!licenseKey) {
      return { success: false, error: "License key not found" };
    }

    if (licenseKey.status === "ASSIGNED") {
      return { success: false, error: "Cannot delete an assigned license key" };
    }

    await prisma.licenseKey.delete({
      where: { id: keyId },
    });

    revalidatePath("/admin/license-management");
    return { success: true, error: "" };
  } catch (error) {
    console.error("Delete license key error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete license key" };
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

// Bulk add license keys action
export async function bulkAddLicenseKeysAction(
  licenseId: string,
  keys: string[]
): Promise<LicenseFormState> {
  try {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        licenseKeys: true,
      },
    });

    if (!license) {
      return { success: false, error: "License not found" };
    }

    const availableSeats = license.totalSeats - license.licenseKeys.length;
    if (keys.length > availableSeats) {
      return {
        success: false,
        error: `Only ${availableSeats} seats available, but ${keys.length} keys provided`,
      };
    }

    // Check for duplicate keys
    const existingKeys = await prisma.licenseKey.findMany({
      where: {
        licenseId,
        key: {
          in: keys,
        },
      },
    });

    if (existingKeys.length > 0) {
      const duplicateKeys = existingKeys.map((k) => k.key).join(", ");
      return {
        success: false,
        error: `Duplicate keys found: ${duplicateKeys}`,
      };
    }

    // Create all keys
    await prisma.licenseKey.createMany({
      data: keys.map((key) => ({
        licenseId,
        key,
        status: "ACTIVE",
      })),
    });

    revalidatePath("/admin/license-management");
    return { success: true, error: "" };
  } catch (error) {
    console.error("Bulk add license keys error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to add license keys" };
  }
}
