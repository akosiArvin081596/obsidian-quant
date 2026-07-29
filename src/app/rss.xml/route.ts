import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { blogPostPath } from "@/lib/blog/slug";
import { BRAND } from "@/content/site";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let items: {
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
  }[] = [];

  try {
    const rows = await prisma.post.findMany({
      where: {
        status: "published",
        deletedAt: null,
        robotsIndex: true,
        slug: { not: null },
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    items = rows
      .filter((row): row is typeof row & { slug: string } => Boolean(row.slug))
      .map((row) => ({
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        publishedAt: row.publishedAt,
        updatedAt: row.updatedAt,
      }));
  } catch {
    items = [];
  }

  const lastBuild = items[0]?.updatedAt?.toUTCString() ?? new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(BRAND.name)} Blog</title>
    <link>${SITE_URL}/insights/</link>
    <description>${escapeXml("Research notes and institutional commentary from " + BRAND.name)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items
      .map((post) => {
        const link = `${SITE_URL}${blogPostPath(post.slug)}`;
        return `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${(post.publishedAt ?? post.updatedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt ?? "")}</description>
    </item>`;
      })
      .join("\n    ")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
