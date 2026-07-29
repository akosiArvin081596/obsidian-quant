import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { blogPostPath } from "@/lib/blog/slug";

/**
 * Internal link search for the editor (spec §7.2 / §14.5).
 * Returns published (and optionally draft) posts as link targets.
 */
export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const includeDrafts = req.nextUrl.searchParams.get("drafts") === "1";

    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        status: includeDrafts
          ? { in: ["published", "draft", "unpublished"] }
          : "published",
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        slug: { not: null },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        excerpt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    });

    return jsonOk({
      items: posts.map((p) => ({
        id: p.id,
        title: p.title || "Untitled",
        slug: p.slug,
        status: p.status,
        excerpt: p.excerpt,
        href: blogPostPath(p.slug!),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
