import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { blogPostPath } from "@/lib/insights/slug";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/",
  "/firm/",
  "/strategy/",
  "/architecture/",
  "/contact/",
  "/insights/",
  "/legal/regulatory-disclosure/",
  "/legal/data-cryptography/",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "/" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/insights") ? 0.7 : 0.8,
  }));

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.post.findMany({
      where: { status: "published", deletedAt: null, robotsIndex: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    });
    postEntries = posts.map((post) => ({
      url: `${SITE_URL}${blogPostPath(post.slug!)}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const tags = await prisma.tag.findMany({
      where: { posts: { some: { post: { status: "published", deletedAt: null } } } },
      select: { slug: true },
    });
    const categories = await prisma.category.findMany({
      where: { posts: { some: { post: { status: "published", deletedAt: null } } } },
      select: { slug: true },
    });

    postEntries = [
      ...postEntries,
      ...tags.map((t) => ({
        url: `${SITE_URL}/insights/tag/${t.slug}/`,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      })),
      ...categories.map((c) => ({
        url: `${SITE_URL}/insights/category/${c.slug}/`,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      })),
    ];
  } catch {
    // DB unavailable during build without env — ship static URLs only.
  }

  return [...staticEntries, ...postEntries];
}
