import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { blogPostPath } from "@/lib/blog/slug";

export const dynamic = "force-dynamic";

/** Post-only sitemap fragment (spec §12). */
export async function GET() {
  let urls: { loc: string; lastmod?: string }[] = [];
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "published",
        deletedAt: null,
        robotsIndex: true,
        slug: { not: null },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    urls = posts.map((p) => ({
      loc: `${SITE_URL}${blogPostPath(p.slug!)}`,
      lastmod: p.updatedAt.toISOString(),
    }));
  } catch {
    urls = [];
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
