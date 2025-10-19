import { NotificationType } from "@prisma/client";

type TemplateFn = (payload) => { title: string; message: string };

export const notificationTemplates: Record<NotificationType, TemplateFn> = {
  LICENSE_CREATED: (payload) => ({
    title: "License Created",
    message: `A new license (${
      payload?.licenseName ?? "Unknown"
    }) from vendor (${payload?.vendor ?? "Unknown Vendor"}) has been created.`,
  }),
  LICENSE_ASSIGNED: (payload) => ({
    title: "License Assigned",
    message:
      payload?.message ||
      `License ${payload?.licenseName ?? ""} has been assigned to ${
        payload?.assigneeName ?? "a user"
      }.`,
  }),
  LICENSE_EXPIRED: (payload) => ({
    title: "License Expired",
    message: `The license **${payload?.name ?? "Unknown"}** from vendor **${
      payload?.vendor ?? "Unknown Vendor"
    }** expired on ${payload?.expiredAt ?? "an unknown date"}.`,
  }),
  LICENSE_REQUESTED: (payload) => {
    const isForAdmin = payload?.forAdmin === true;
    const newApprover = payload?.newApprover === true;

    // Map status to friendly messages
    const statusMessages: Record<string, string> = {
      ASSIGNING: "is currently being assigned",
      DENIED: `has been denied${
        payload?.reason ? ` (Reason: ${payload.reason})` : ""
      }`,
      REVIEWING: "is under review by approvers",
      APPROVED: "has been approved",
      CREATED: "has been created",
    };

    const actionMessage = statusMessages[payload.status] ?? "was updated";

    if (newApprover) {
      return {
        title: `You’ve been added as an approver for license request ${payload.licenseName}`,
        message: `${payload?.requestorName ?? "A user"} requested **${
          payload?.licenseName ?? "a license"
        }** from ${
          payload?.vendor ?? "an unknown vendor"
        }. Your approval is now required.`,
      };
    }

    if (isForAdmin) {
      return {
        title: `License Request ${payload.status}`,
        message: `${
          payload?.requestorName ?? "A user"
        }'s license request for **${
          payload?.licenseName ?? "Unknown License"
        }** (${payload?.vendor ?? "Unknown Vendor"}) ${actionMessage}.`,
      };
    }

    return {
      title: `Your License Request is ${payload.status}`,
      message: `Your request for **${
        payload?.licenseName ?? "Unknown License"
      }** (${payload?.vendor ?? "Unknown Vendor"}) ${actionMessage}.`,
    };
  },
  PROCUREMENT_CREATED: (payload) => ({
    title: "Procurement Request Created",
    message: payload.isOwner
      ? `You successfully submitted a new procurement request for ${
          payload?.item ?? "an item"
        }.`
      : `${
          payload?.requesterName ?? "A user"
        } submitted a new procurement request for ${
          payload?.item ?? "an item"
        }.`,
  }),

  PROCUREMENT_APPROVED: (payload) => ({
    title: "Procurement Request Approved",
    message: `Your procurement request for **${
      payload?.item ?? "an item"
    }** has been approved by **${payload?.approverName ?? "an approver"}**. 
Please upload the required proof of purchase at your earliest convenience to complete the process.`,
  }),

  PROCUREMENT_REJECTED: (payload) => ({
    title: "Procurement Request Rejected",
    message: `Procurement request for ${
      payload?.item ?? "an item"
    } was rejected by ${payload?.approverName ?? "an approver"}${
      payload?.reason ? ` with the reason: "${payload.reason}".` : "."
    }`,
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
