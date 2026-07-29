import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAdminPost } from "@/lib/blog/revisions";
import { ApiError } from "@/lib/auth/api";
import { publishPostNow } from "@/lib/blog/publish";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsPublish);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing || existing.deletedAt) {
      throw new ApiError(404, "Post not found", "not_found");
    }

    const result = await publishPostNow({
      existing,
      userId: user.id,
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
