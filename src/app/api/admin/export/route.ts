import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET() {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const [posts, tags, categories, redirects] = await Promise.all([
      prisma.post.findMany({
        where: { deletedAt: null },
        include: {
          seo: true,
          tags: { include: { tag: true } },
          categories: { include: { category: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.redirect.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const bundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      posts: posts.map((p) => ({
        title: p.title,
        subtitle: p.subtitle,
        slug: p.slug,
        excerpt: p.excerpt,
        status: p.status,
        contentJson: p.contentJson,
        contentHtml: p.contentHtml,
        focusKeyword: p.focusKeyword,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        scheduledAt: p.scheduledAt?.toISOString() ?? null,
        canonicalUrl: p.canonicalUrl,
        robotsIndex: p.robotsIndex,
        robotsFollow: p.robotsFollow,
        seo: p.seo,
        tagSlugs: p.tags.map((t) => t.tag.slug),
        categorySlugs: p.categories.map((c) => c.category.slug),
        primaryCategorySlug:
          p.categories.find((c) => c.isPrimary)?.category.slug ??
          p.categories[0]?.category.slug ??
          null,
      })),
      tags,
      categories,
      redirects,
    };

    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="blog-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
