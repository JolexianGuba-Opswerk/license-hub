// schemas/user.ts
import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  position: z.string(),
  department: z.enum(["ITSG", "SRE", "HR", "SSED"]),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN", "ACCOUNT_OWNER", "FINANCE"]),
  manager: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  addedBy: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
