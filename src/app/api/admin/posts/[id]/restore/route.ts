import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsRestore);
    const { id } = await ctx.params;
    const existing = await prisma.post.findUnique({ where: { id }, include: postAdminInclude });
    if (!existing) throw new ApiError(404, "Post not found", "not_found");

    const post = await prisma.post.update({
      where: { id },
      data: {
        status: existing.status === "trash" || existing.status === "archived" ? "draft" : existing.status,
        deletedAt: null,
        version: { increment: 1 },
      },
      include: postAdminInclude,
    });

    await writeAuditLog({
      userId: user.id,
      action: "post.restore",
      entityType: "post",
      entityId: id,
      before: { status: existing.status },
      after: { status: post.status },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
