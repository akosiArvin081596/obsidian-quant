import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk } from "@/lib/auth/api";
import { postPublicInclude } from "@/lib/blog/includes";
import { buildBlogPostingJsonLd, mediaPublicUrl } from "@/lib/blog/jsonld";
import { readingTimeMinutes } from "@/lib/blog/seoScore";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const post = await prisma.post.findFirst({
      where: {
        slug,
        status: "published",
        deletedAt: null,
      },
      include: postPublicInclude,
    });
    if (!post) throw new ApiError(404, "Post not found", "not_found");

    return jsonOk({
      post: {
        ...post,
        featuredImage: post.featuredMedia
          ? {
              url: mediaPublicUrl(post.featuredMedia.storageKey),
              alt: post.featuredMedia.altText,
            }
          : null,
        tags: post.tags.map((t) => t.tag),
        categories: post.categories.map((c) => c.category),
        readMinutes: readingTimeMinutes(post.contentHtml),
        jsonLd: buildBlogPostingJsonLd(post),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
