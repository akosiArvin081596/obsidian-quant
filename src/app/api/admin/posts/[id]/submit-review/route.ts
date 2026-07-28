import { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { createPostRevision, getAdminPost, snapshotPost } from "@/lib/blog/revisions";

type Ctx = { params: Promise<{ id: string }> };

/** Author / editor submits a draft for editorial review. */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsWrite);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing || existing.deletedAt) {
      throw new ApiError(404, "Post not found", "not_found");
    }

    if (!existing.title.trim()) {
      throw new ApiError(400, "Add a title before submitting for review", "validation");
    }
    if (!existing.contentHtml.replace(/<[^>]+>/g, "").trim()) {
      throw new ApiError(400, "Add body content before submitting for review", "validation");
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        status: "pending_review",
        scheduledAt: null,
        version: { increment: 1 },
      },
      include: postAdminInclude,
    });

    await createPostRevision(id, user.id, "submit_review", await snapshotPost(post));
    await writeAuditLog({
      userId: user.id,
      action: "post.submit_review",
      entityType: "post",
      entityId: id,
      before: { status: existing.status },
      after: { status: "pending_review" },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
