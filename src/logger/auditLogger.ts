import audit from "./logger";

type userDetails = {
  email: string;
  userId: string;
};
export const LicenseLogger = {
  created: (
    licenseId: string,
    userDetails: userDetails,
    data?: Record<string, any>
  ) => {
    audit.info("LICENSE_CREATED", {
      event: "CREATED",
      userDetails: userDetails,
      licenseId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  },

  updated: (
    licenseId: string,
    userDetails: userDetails,
    changes: Record<string, any>
  ) => {
    audit.info("LICENSE_UPDATED", {
      event: "UPDATED",
      licenseId,
      userDetails: userDetails,
      changes,
      timestamp: new Date().toISOString(),
    });
  },

  assigned: (licenseId: string, keyId: string, assignedToUserId: string) => {
    audit.info("LICENSE_ASSIGNED", {
      event: "ASSIGNED",
      licenseId,
      keyId,
      assignedToUserId,
      timestamp: new Date().toISOString(),
    });
  },

  revoked: (licenseId: string, keyId: string, revokedBy: string) => {
    audit.info("LICENSE_REVOKED", {
      event: "REVOKED",
      licenseId,
      keyId,
      revokedBy,
      timestamp: new Date().toISOString(),
    });
  },

  deleted: (licenseId: string, userId: string) => {
    audit.info("LICENSE_DELETED", {
      event: "DELETED",
      licenseId,
      userId,
      timestamp: new Date().toISOString(),
    });
  },
};
