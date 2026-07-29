import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scanAllPostLinks } from "@/lib/blog/linkScan";

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const checkExternal = req.nextUrl.searchParams.get("external") !== "0";
    const result = await scanAllPostLinks({ checkExternal });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
