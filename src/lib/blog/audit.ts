import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: (input.before as Prisma.InputJsonValue) ?? undefined,
      afterJson: (input.after as Prisma.InputJsonValue) ?? undefined,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
