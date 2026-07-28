import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { slugify } from "@/lib/blog/slug";

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const tags = await prisma.tag.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: 100,
    });
    return jsonOk({ tags });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.tagsManage);
    const body = z.object({ name: z.string().min(1) }).parse(await req.json());
    const slug = slugify(body.name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { name: body.name.trim(), slug },
      update: { name: body.name.trim() },
    });
    return jsonOk({ tag }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
