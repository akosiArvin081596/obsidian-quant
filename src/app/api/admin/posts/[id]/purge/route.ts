import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/blog/audit";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Permanently delete a trashed post. Spec §8: elevated permission + confirmation.
 * Restricted to Administrator.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsDelete);
    if (!user.roles.includes("Administrator")) {
      throw new ApiError(403, "Only administrators can permanently delete posts", "forbidden");
    }

    const { id } = await ctx.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Post not found", "not_found");
    if (existing.status !== "trash") {
      throw new ApiError(400, "Move the post to Trash before permanent deletion", "validation");
    }

    await prisma.$transaction(async (tx) => {
      await tx.postRevision.deleteMany({ where: { postId: id } });
      await tx.postTag.deleteMany({ where: { postId: id } });
      await tx.postCategory.deleteMany({ where: { postId: id } });
      await tx.postSeo.deleteMany({ where: { postId: id } });
      await tx.post.delete({ where: { id } });
    });

    await writeAuditLog({
      userId: user.id,
      action: "post.purge",
      entityType: "post",
      entityId: id,
      before: { title: existing.title, slug: existing.slug },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
