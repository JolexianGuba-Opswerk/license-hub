import { PrismaClient, NotificationType } from "@prisma/client";
import { notificationTemplates } from "./notificationTemplate";

const prisma = new PrismaClient();

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  payload?: any;
  url?: string | null;
  sendEmail?: boolean;
};

export async function sendNotification(input: CreateNotificationInput) {
  // Generate title + message from template
  const template = notificationTemplates[input.type];
  const { title, message } = template(input.payload);

  const notification = await prisma.notification.create({
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
    // TODO: For send email purposes.
  }

  return notification;
}

export async function readNotificaiton(notificationId: string) {
  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
