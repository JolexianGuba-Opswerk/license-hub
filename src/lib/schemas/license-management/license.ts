import { z } from "zod";

// Enums
export const LicenseStatusEnum = z.enum(["AVAILABLE", "FULL", "EXPIRED"]);
export type LicenseStatus = z.infer<typeof LicenseStatusEnum>;

export const LicenseKeyStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "ASSIGNED",
  "REVOKED",
]);
export type LicenseKeyStatus = z.infer<typeof LicenseKeyStatusEnum>;

// LicenseKey Type & Zod
export const LicenseKeySchema = z.object({
  id: z.string().uuid(),
  licenseId: z.string().uuid(),
  key: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "ASSIGNED", "REVOKED"]),
});

export type CreateLicenseKey = z.infer<typeof LicenseKeySchema>;

// License Type & Zod
export const CreatelicenseSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  vendor: z.string().max(50, "Vendor name must be at most 50 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  totalSeats: z
    .number()
    .min(1, "Total seats must be at least 1")
    .max(1000, "Total seats cannot exceed 1000"),

  cost: z
    .number()
    .min(0, "Cost must be at least 0")
    .max(1000000, "Cost cannot exceed 1,000,000")
    .optional(),
  expiryDate: z.string().refine(
    (date) => {
      const d = new Date(date);
      return !isNaN(d.getTime()) && d > new Date();
    },
    { message: "Expiry date must be a valid future date" }
  ),
  type: z.enum(["SEAT_BASED", "KEY_BASED"]),
});

export type CreateLicense = z.infer<typeof CreatelicenseSchema>;

export interface LicenseKey {
  id: string;
  licenseId: string;
  key: string | null;
  status: LicenseKeyStatus;
  createdAt: string; // ISO date string from API
  updatedAt: string; // ISO date string from API
  addedById?: string | null;
  addedBy?: {
    id: string;
    name: string;
    department: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null; // convenience if your API includes assigned user
}

export interface License {
  id: string;
  name: string;
  vendor?: string;
  type: "SEAT_BASED" | "KEY_BASED";
  description?: string;
  totalSeats: number;
  status: "AVAILABLE" | "FULL" | "EXPIRED";
  cost?: number;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  licenseAddedBy: {
    name: string;
    role: string;
    department: string;
  };
  licenseKeys: LicenseKey[];
  _count: {
    licenseKeys: number;
  };
  unassignedKeysCount: number;
}

export interface LicenseResponse {
  data: License[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
  };
}
