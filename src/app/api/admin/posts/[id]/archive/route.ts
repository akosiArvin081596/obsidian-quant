import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { getAdminPost } from "@/lib/blog/revisions";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsPublish);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing) throw new ApiError(404, "Post not found", "not_found");

    const post = await prisma.post.update({
      where: { id },
      data: { status: "archived", version: { increment: 1 } },
      include: postAdminInclude,
    });

    await writeAuditLog({
      userId: user.id,
      action: "post.archive",
      entityType: "post",
      entityId: id,
      before: { status: existing.status },
      after: { status: "archived" },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
