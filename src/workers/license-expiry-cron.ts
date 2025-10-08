import cron from "node-cron";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { PrismaClient } from "@prisma/client";
import { log } from "@/lib/cron-logger";
const prisma = new PrismaClient();

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

cron.schedule("* * * * *", async () => {
  log("Checking licenses nearing expiry...");
  console.log("Checking licenses nearing expiry...");

  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 3);

  // Get licenses expiring soon or already expired
  const licenses = await prisma.license.findMany({
    where: {
      expiryDate: { lte: threeDaysLater },
    },
    select: { id: true, vendor: true, expiryDate: true, name: true },
    orderBy: { expiryDate: "asc" },
  });

  // Get ITSG admins
  const itsgAdmins = await prisma.userDetails.findMany({
    where: {
      department: "ITSG",
      role: { in: ["ACCOUNT_OWNER", "ADMIN", "MANAGER"] },
    },
    select: { id: true },
  });

  if (!licenses.length) {
    log("No expiring or expired licenses today");
    console.log(" No expiring or expired licenses today");
    return;
  }

  for (const license of licenses) {
    const expired = new Date(license.expiryDate!) < now;

    const payload = {
      name: license.name,
      vendor: license.vendor,
      expiredAt: formatDate(license.expiryDate!),
    };

    for (const admin of itsgAdmins) {
      await sendNotification({
        userId: admin.id,
        type: "LICENSE_EXPIRED",
        payload,
        url: `/license-management/${license.id}`,
      });
    }
    log(
      `📨 Sent ${expired ? "expired" : "expiring soon"} alert for ${
        license.name
      } (${license.vendor})`
    );
    console.log(
      `📨 Sent ${expired ? "expired" : "expiring soon"} alert for ${
        license.name
      } (${license.vendor})`
    );
  }
});
