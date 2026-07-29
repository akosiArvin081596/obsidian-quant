import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/auth/api";
import { postPublicInclude } from "@/lib/blog/includes";
import { readingTimeMinutes } from "@/lib/blog/seoScore";
import { mediaPublicUrl } from "@/lib/blog/jsonld";
import { promoteDueScheduledPosts } from "@/lib/blog/publish";

export async function GET(req: NextRequest) {
  try {
    await promoteDueScheduledPosts();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 12)));
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");

    const where = {
      status: "published" as const,
      robotsIndex: true,
      deletedAt: null,
      ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
      ...(category
        ? { categories: { some: { category: { slug: category } } } }
        : {}),
    };

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: postPublicInclude,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonOk({
      total,
      page,
      pageSize,
      items: posts.map((post) => ({
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        slug: post.slug,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        author: post.author,
        primaryCategory: post.primaryCategory,
        tags: post.tags.map((t) => t.tag),
        featuredImage: post.featuredMedia
          ? {
              url: mediaPublicUrl(post.featuredMedia.storageKey),
              alt: post.featuredMedia.altText,
            }
          : null,
        readMinutes: readingTimeMinutes(post.contentHtml),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
