import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { slugify } from "@/lib/blog/slug";

export async function GET() {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return jsonOk({ categories });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.categoriesManage);
    const body = z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
        parentId: z.string().nullable().optional(),
      })
      .parse(await req.json());
    const slug = slugify(body.name);
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description,
        parentId: body.parentId ?? null,
      },
    });
    return jsonOk({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
