import z from "zod";

// License request (existing license)
const LicenseItemSchema = z.object({
  type: z.literal("LICENSE"),
  licenseId: z.string().uuid(),
  justification: z.string().min(1),
});

// New software request (other software)
const OtherSoftwareItemSchema = z.object({
  type: z.literal("OTHER"),
  licenseName: z.string().min(1),
  vendor: z.string().optional(),
  justification: z.string().min(1),
});

// Email account request
const EmailItemSchema = z.object({
  type: z.literal("EMAIL"),
  fullname: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  role: z.string().min(1),
  justification: z.string().min(1),
});

// Union of all types
const RequestItemSchema = z.discriminatedUnion("type", [
  LicenseItemSchema,
  OtherSoftwareItemSchema,
  EmailItemSchema,
]);

// Wrapper schema for the whole request
export const RequestSchema = z.object({
  items: z.array(RequestItemSchema).min(1),
});

export type RequestItem = z.infer<typeof RequestItemSchema>;
export type RequestPayload = z.infer<typeof RequestSchema>;

export const AddApproverSchema = z.object({
  approverId: z.string().uuid("Invalid approver ID"),
  level: z.enum(["OWNER", "MANAGER", "ITSG"], {
    message: "Invalid approval level",
  }),
});

export type AddApproverInput = z.infer<typeof AddApproverSchema>;
