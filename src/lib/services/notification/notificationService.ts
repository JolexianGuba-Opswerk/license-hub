import { PrismaClient, NotificationType, Prisma } from "@prisma/client";
import { notificationTemplates } from "./notificationTemplate";
import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  payload?: Record<string, any>;
  url?: string | null;
  sendEmail?: boolean;
};

// PUSH NOTIFICATION WITH TRANSACTION WRAP
export async function sendNotification(
  input: CreateNotificationInput,
  tx?: Prisma.TransactionClient
) {
  try {
    const client = tx || prisma;

    const template = notificationTemplates[input.type];
    const { title, message } = template(input.payload || {});

    const notification = await client.notification.create({
      data: {
        userId: input.userId,
        title,
        message,
        type: input.type,
        url: input.url ?? null,
        read: false,
      },
    });

    if (input.sendEmail) {
      // TODO: add email sending here if needed later
    }

    return notification;
  } catch (err) {
    console.error("Failed to send notification:", err);
    throw new Error("Notification creation failed");
  }
}
// MARK AS READ NOTIFICATION
export async function readNotification(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    return { success: false, error: "Something went wrong" };
  }
}
