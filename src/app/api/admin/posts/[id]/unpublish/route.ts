import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { createPostRevision, getAdminPost, snapshotPost } from "@/lib/blog/revisions";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsPublish);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing) throw new ApiError(404, "Post not found", "not_found");

    const post = await prisma.post.update({
      where: { id },
      data: { status: "unpublished", scheduledAt: null, version: { increment: 1 } },
      include: postAdminInclude,
    });

    await createPostRevision(id, user.id, "unpublish", await snapshotPost(post));
    await writeAuditLog({
      userId: user.id,
      action: "post.unpublish",
      entityType: "post",
      entityId: id,
      before: { status: existing.status },
      after: { status: "unpublished" },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
