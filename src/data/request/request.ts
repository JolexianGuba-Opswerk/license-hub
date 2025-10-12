import { prisma } from "@/lib/prisma";
import { RequestItem } from "@/lib/schemas/request/request";
import { License, UserDetails } from "@prisma/client";

export async function createRequest(
  requestor: {
    id: string;
    isManager: boolean;
  },
  requestedForId: string | null,
  items: RequestItem[]
) {
  try {
    // REQUEST CREATION SECTION
    const request = await prisma.licenseRequest.create({
      data: {
        requestorId: requestor.id,
        requestedForId,
        items: {
          create: items.map((item) => {
            switch (item.type) {
              case "LICENSE":
                return {
                  type: "LICENSE",
                  justification: item.justification,
                  licenseId: item.licenseId!,
                };
              case "OTHER":
                return {
                  type: "OTHER",
                  justification: item.justification,
                  requestedLicenseName: item.licenseName!,
                  requestedLicenseVendor: item.vendor ?? null,
                };
              default:
                throw new Error("Unknown request item type");
            }
          }),
        },
      },
      include: { items: true },
    });

    // REQUEST ITEMS APPROVAL SECTION
    const errors: string[] = [];
    for (const item of request.items) {
      // GET LICENSE OWNER (only if licenseId exists)
      let license: { owner: License["owner"] } | null = null;

      if (item.licenseId) {
        license = await prisma.license.findFirst({
          where: { id: item.licenseId },
          select: { owner: true },
        });
      }

      // ITSG approval (always required)
      const itsg = await prisma.userDetails.findFirst({
        where: { role: "TEAM_LEAD", department: "ITSG" },
        select: { id: true },
      });

      if (itsg) {
        await prisma.requestItemApproval.create({
          data: {
            requestItemId: item.id,
            approverId: itsg.id,
            level: "ITSG",
            status: "PENDING",
          },
        });
      } else {
        errors.push("No ITSG team lead found");
      }

      // IF CURRENT USER IS NOT MANAGER THEN ADD MANAGER AS APPROVER
      if (!requestor.isManager) {
        const manager = await prisma.userDetails.findFirst({
          where: {
            id: requestor.id,
          },
          select: {
            managerId: true,
          },
        });

        if (manager?.managerId) {
          await prisma.requestItemApproval.create({
            data: {
              requestItemId: item.id,
              approverId: manager.managerId,
              level: "MANAGER",
              status: "PENDING",
            },
          });
        } else {
          errors.push(`No manager found this user`);
        }
      }

      // OWNER approval (only if license exists and not ITSG-owned)
      if (license && license.owner !== "ITSG") {
        const ownerTL = await prisma.userDetails.findFirst({
          where: { role: "TEAM_LEAD", department: license.owner },
          select: { id: true },
        });

        if (ownerTL) {
          await prisma.requestItemApproval.create({
            data: {
              requestItemId: item.id,
              approverId: ownerTL.id,
              level: "OWNER",
              status: "PENDING",
            },
          });
        } else {
          errors.push(`No team lead found for ${license.owner} department`);
        }
      }
    }
    // SHOW ALL THE WARNINGS OCCURS OF EACH ITEMS
    return {
      warnings: errors.length > 0 ? errors.join("; ") : "",
      data: request,
    };
  } catch (error) {
    console.error("Create request error:", error);
    return { error: "Something went wrong while saving the request" };
  }
}
