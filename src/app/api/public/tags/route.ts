import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/auth/api";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      where: { posts: { some: { post: { status: "published", deletedAt: null } } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true },
    });
    return jsonOk({ tags });
  } catch (error) {
    return jsonError(error);
  }
}
