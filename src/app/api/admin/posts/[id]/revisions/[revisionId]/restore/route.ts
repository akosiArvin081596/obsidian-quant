import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { createPostRevision, getAdminPost, snapshotPost } from "@/lib/blog/revisions";

type Ctx = { params: Promise<{ id: string; revisionId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsWrite);
    const { id, revisionId } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing) throw new ApiError(404, "Post not found", "not_found");

    const revision = await prisma.postRevision.findFirst({
      where: { id: revisionId, postId: id },
    });
    if (!revision) throw new ApiError(404, "Revision not found", "not_found");

    const snap = revision.snapshotJson as Record<string, unknown>;
    await createPostRevision(id, user.id, "pre_restore", await snapshotPost(existing));

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: (snap.title as string) ?? existing.title,
        subtitle: (snap.subtitle as string | null) ?? null,
        slug: (snap.slug as string | null) ?? existing.slug,
        excerpt: (snap.excerpt as string | null) ?? null,
        contentJson: (snap.contentJson as Prisma.InputJsonValue) ?? existing.contentJson,
        contentHtml: (snap.contentHtml as string) ?? existing.contentHtml,
        featuredMediaId: (snap.featuredMediaId as string | null) ?? null,
        primaryCategoryId: (snap.primaryCategoryId as string | null) ?? null,
        focusKeyword: (snap.focusKeyword as string | null) ?? null,
        canonicalUrl: (snap.canonicalUrl as string | null) ?? null,
        robotsIndex: (snap.robotsIndex as boolean) ?? true,
        robotsFollow: (snap.robotsFollow as boolean) ?? true,
        version: { increment: 1 },
      },
      include: postAdminInclude,
    });

    await createPostRevision(id, user.id, "restore", await snapshotPost(post));
    await writeAuditLog({
      userId: user.id,
      action: "post.revision_restore",
      entityType: "post",
      entityId: id,
      after: { revisionId, revisionNo: revision.revisionNo },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
