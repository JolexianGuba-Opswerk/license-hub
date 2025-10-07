import { NotificationType } from "@prisma/client";

type TemplateFn = (payload?: any) => { title: string; message: string };

export const notificationTemplates: Record<NotificationType, TemplateFn> = {
  LICENSE_CREATED: (payload) => ({
    title: "License Created",
    message: `A new license (${
      payload?.licenseName ?? "Unknown"
    }) from vendor (${payload?.vendor ?? "Unknown Vendor"}) has been created.`,
  }),

  LICENSE_ASSIGNED: (payload) => ({
    title: "License Assigned",
    message: `License ${payload?.licenseName ?? ""} has been assigned to ${
      payload?.assigneeName ?? "a user"
    }.`,
  }),
  LICENSE_EXPIRED: (payload) => ({
    title: "License Expired",
    message: `License ${payload?.licenseKey ?? ""} expired on ${
      payload?.expiredAt ?? "an unknown date"
    }.`,
  }),
  LICENSE_REQUESTED: (payload) => ({
    title: "License Requested",
    message: `${payload?.requesterName ?? "A user"} has requested a license.`,
  }),
  PROCUREMENT_REQUEST: (payload) => ({
    title: "Procurement Request",
    message: `${
      payload?.requesterName ?? "A user"
    } submitted a procurement request for ${payload?.item ?? "an item"}.`,
  }),
  USER_ADDED: (payload) => {
    if (payload?.forUser) {
      return {
        title: "Welcome to the License Hub",
        message: `You’ve been successfully added to the ${
          payload.department ?? "organization"
        }.`,
      };
    }

    return {
      title: "New User Added",
      message: `${payload?.userName ?? "A new user"} has been added to the ${
        payload?.department ?? "system"
      }.`,
    };
  },
  GENERAL: (payload) => ({
    title: payload?.title ?? "Notification",
    message: payload?.message ?? "You have a new notification.",
  }),
};
