import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Ctx = { params: Promise<{ id: string; revisionId: string }> };

/** Preview one revision snapshot (spec §12). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const { id, revisionId } = await ctx.params;
    const revision = await prisma.postRevision.findFirst({
      where: { id: revisionId, postId: id },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (!revision) throw new ApiError(404, "Revision not found", "not_found");
    return jsonOk({ revision });
  } catch (error) {
    return jsonError(error);
  }
}
