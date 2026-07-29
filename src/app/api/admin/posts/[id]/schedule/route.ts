import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAdminPost } from "@/lib/blog/revisions";
import { schedulePost } from "@/lib/blog/publish";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  scheduledAt: z.string().min(1),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsPublish);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing || existing.deletedAt) {
      throw new ApiError(404, "Post not found", "not_found");
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ApiError(400, "scheduledAt is required (ISO date/time)", "validation");
    }

    const scheduledAt = new Date(parsed.data.scheduledAt);
    const result = await schedulePost({
      existing,
      userId: user.id,
      scheduledAt,
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
