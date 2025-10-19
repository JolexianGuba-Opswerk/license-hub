import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

interface LogAuditEventProps {
  userId?: string; // For system or user actions
  entity: string; // Table name or entity name
  entityId?: string;
  action: AuditAction;
  description: string;
  changes?;
  ipAddress?: string;
  userAgent?: string;
  tx?; // Optional Prisma transaction client
}

export async function logAuditEvent({
  userId,
  entity,
  entityId,
  action,
  description,
  changes,
  ipAddress,
  userAgent,
  tx,
}: LogAuditEventProps) {
  try {
    const client = tx || prisma;

    await client.auditLog.create({
      data: {
        userId,
        entity,
        entityId,
        action,
        description,
        changes,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
