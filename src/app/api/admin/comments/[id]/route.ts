import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/blog/audit";

type RouteCtx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "spam"]),
});

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireUser(PERMISSIONS.postsWrite);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const before = await prisma.comment.findUnique({ where: { id } });
    if (!before) throw new ApiError(404, "Comment not found", "not_found");

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        status: body.status,
        moderatedAt: new Date(),
        moderatedById: actor.id,
      },
    });

    await writeAuditLog({
      userId: actor.id,
      action: "comment.moderate",
      entityType: "comment",
      entityId: id,
      before: { status: before.status },
      after: { status: comment.status },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ comment: { id: comment.id, status: comment.status } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
