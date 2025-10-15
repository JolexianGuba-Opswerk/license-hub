"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";
import { success, z } from "zod";

// ✅ Schema validation
const ProcurementSchema = z.object({
  itemDescription: z.string().min(2, "Item description is required."),
  justification: z.string().min(5, "Justification is required."),
  vendor: z.string().min(2, "Vendor name is required."),
  vendorEmail: z.string().email().optional().or(z.literal("")),
  price: z.string().optional(),
  quantity: z.number().min(1).default(1),
  currency: z.string().default("PHP"),
  cc: z.enum(["ITSG", "SSED", "SRE", "HR"]).optional(),
  notes: z.string().optional(),
  licenseId: z.string().optional(),
  requestItemId: z.string(),
});

export async function createProcurementAction(formData) {
  try {
    // AUTHENTICATION AND PERMISSION ACCESS CHECK
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const userRole = user.user_metadata.role;
    const userDepartment = user.user_metadata.department;

    // ONLY FINANCE DEPARTMENT CAN SEE THE REQUEST
    if (
      !["MANAGER", "TEAM_LEAD"].includes(userRole) ||
      !["ITSG", "FINANCE"].includes(userDepartment)
    ) {
      return { error: "Forbidden" };
    }

    // PARSING AND VALIDATION SECTION
    const parsed = ProcurementSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0].message,
      };
    }

    const data = parsed.data;

    const totalCost = data.price
      ? Number(data.price) * Number(data.quantity)
      : 0;

    const isValidRequestItemId = await prisma.requestItem.findFirst({
      where: { id: data.requestItemId },
      select: { id: true },
    });

    if (!isValidRequestItemId) {
      return { error: "Request item id not found" };
    }

    await prisma.$transaction(async (tx) => {
      // PROCUREMENT REQUEST CREATION
      await tx.procurementRequest.create({
        data: {
          itemDescription: data.itemDescription,
          justification: data.justification,
          vendor: data.vendor,
          vendorEmail: data.vendorEmail,
          price: data.price ? Number(data.price) : null,
          currency: data.currency || "PHP",
          quantity: data.quantity || 1,
          totalCost,
          cc: data.cc || "ITSG",
          notes: data.notes || null,
          requestedById: user.id,
          requestItemId: data.requestItemId,
        },
        include: {
          requestedBy: true,
          approvedBy: true,
        },
      });

      // UPDATE REQUEST ITEM ID STATUS
      await tx.requestItem.update({
        where: { id: data.requestItemId },
        data: {
          status: "PURCHASING",
        },
      });

      // TODO : PUSH NOTIFICATION TO FINANCE
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating procurement:", error);
    return { success: false, error: "Failed to create procurement request." };
  }
}
