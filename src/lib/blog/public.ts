import type { PostPublicPayload } from "@/lib/blog/includes";
import { mediaPublicUrl } from "@/lib/blog/jsonld";
import { readingTimeMinutes } from "@/lib/blog/seoScore";

export type BlogCardPost = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: Date | null;
  authorName: string;
  categoryName: string | null;
  categorySlug: string | null;
  readMinutes: number;
  featuredImage: { url: string; alt: string | null } | null;
};

export function formatBlogDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function mapPostToCard(post: PostPublicPayload): BlogCardPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug!,
    subtitle: post.subtitle,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    authorName: post.author.name,
    categoryName: post.primaryCategory?.name ?? null,
    categorySlug: post.primaryCategory?.slug ?? null,
    readMinutes: readingTimeMinutes(post.contentHtml),
    featuredImage: post.featuredMedia
      ? {
          url: mediaPublicUrl(post.featuredMedia.storageKey),
          alt: post.featuredMedia.altText,
        }
      : null,
  };
}

export function blogHeroExcerpt(post: BlogCardPost): string {
  return post.excerpt?.trim() || post.subtitle?.trim() || "";
}
