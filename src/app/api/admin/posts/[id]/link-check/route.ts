import { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scanPostLinks } from "@/lib/blog/linkScan";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const { id } = await ctx.params;
    const checkExternal = req.nextUrl.searchParams.get("external") !== "0";
    try {
      const result = await scanPostLinks(id, { checkExternal });
      return jsonOk(result);
    } catch {
      throw new ApiError(404, "Post not found", "not_found");
    }
  } catch (error) {
    return jsonError(error);
  }
}
