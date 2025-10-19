import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  role: z.enum([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
    "ACCOUNT_OWNER",
    "FINANCE",
    "TEAM_LEAD",
  ]),
  department: z.enum(["ITSG", "SRE", "HR", "SSED", "FINANCE"]),
  position: z.string().max(100, "Position is too long").nullable(),
  managerId: z
    .union([z.literal("none"), z.string().uuid()])
    .transform((val) => (val === "none" ? null : val))
    .optional(),
});

export const updateUserSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  role: z.enum([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
    "ACCOUNT_OWNER",
    "FINANCE",
    "TEAM_LEAD",
  ]),
  department: z.enum(["ITSG", "SRE", "HR", "SSED", "FINANCE"]),
  position: z.string().max(100, "Position is too long").nullable(),
  managerId: z
    .union([z.literal("none"), z.string().uuid()])
    .transform((val) => (val === "none" ? null : val))
    .optional(),
});

export type UserType = z.infer<typeof createUserSchema>;
export type UpdateUserType = z.infer<typeof updateUserSchema>;
