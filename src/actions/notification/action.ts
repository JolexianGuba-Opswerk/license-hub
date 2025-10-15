"use server";

import { readNotification } from "@/lib/services/notification/notificationService";

type notificationId = string;

export async function updateNotificationAction(formData: notificationId) {
  const response = await readNotification(formData);
  if (!response.success) {
    return { error: "Something went wrong" };
  }

  return { success: true };
}
