import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const { id } = await ctx.params;
    const revisions = await prisma.postRevision.findMany({
      where: { postId: id },
      orderBy: { revisionNo: "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    return jsonOk({ revisions });
  } catch (error) {
    return jsonError(error);
  }
}
