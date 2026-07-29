import { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { createPostRevision, getAdminPost, snapshotPost } from "@/lib/blog/revisions";

type Ctx = { params: Promise<{ id: string }> };

/** Cancel a scheduled publish and return the post to draft. */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsPublish);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing || existing.deletedAt) {
      throw new ApiError(404, "Post not found", "not_found");
    }
    if (existing.status !== "scheduled") {
      throw new ApiError(400, "Post is not scheduled", "validation");
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        status: "draft",
        scheduledAt: null,
        version: { increment: 1 },
      },
      include: postAdminInclude,
    });

    await createPostRevision(id, user.id, "unschedule", await snapshotPost(post));
    await writeAuditLog({
      userId: user.id,
      action: "post.unschedule",
      entityType: "post",
      entityId: id,
      before: { status: existing.status, scheduledAt: existing.scheduledAt },
      after: { status: "draft", scheduledAt: null },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
