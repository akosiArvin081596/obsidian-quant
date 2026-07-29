import type { PostSeo, Media, Tag, Category } from "@prisma/client";

type SeoScoreInput = {
  title: string;
  slug: string | null;
  excerpt: string | null;
  contentHtml: string;
  focusKeyword: string | null;
  featuredMedia: Pick<Media, "altText"> | null;
  seo: Pick<
    PostSeo,
    "metaTitle" | "metaDescription" | "socialTitle" | "socialDescription"
  > | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  primaryCategoryId: string | null;
  tags: { tag: Pick<Tag, "id"> }[];
  categories: { category: Pick<Category, "id"> }[];
};

export type SeoScoreResult = {
  score: number;
  checks: { id: string; label: string; ok: boolean; weight: number }[];
};

export function computeSeoCompleteness(input: SeoScoreInput): SeoScoreResult {
  const hasHeading = /<h[2-4]\b/i.test(input.contentHtml);
  const hasInternalLink = /href=["']\/(?:blog|firm|strategy|architecture|contact)/i.test(
    input.contentHtml,
  );
  const metaDesc = input.seo?.metaDescription || input.excerpt;
  const checks = [
    {
      id: "title_slug",
      label: "Title and slug completed",
      ok: Boolean(input.title.trim() && input.slug),
      weight: 15,
    },
    {
      id: "excerpt_meta",
      label: "Excerpt and meta description completed",
      ok: Boolean(input.excerpt?.trim() && metaDesc?.trim()),
      weight: 15,
    },
    {
      id: "featured_alt",
      label: "Featured image and alt text completed",
      ok: Boolean(input.featuredMedia && (input.featuredMedia.altText ?? "").trim()),
      weight: 15,
    },
    {
      id: "canonical_index",
      label: "Valid canonical and index settings",
      ok: Boolean(input.canonicalUrl || input.slug) && input.robotsIndex,
      weight: 15,
    },
    {
      id: "taxonomy",
      label: "Primary category and relevant tags",
      ok: Boolean(input.primaryCategoryId || input.categories.length) && input.tags.length > 0,
      weight: 10,
    },
    {
      id: "headings",
      label: "Useful heading structure",
      ok: hasHeading,
      weight: 10,
    },
    {
      id: "internal_links",
      label: "At least one relevant internal link",
      ok: hasInternalLink,
      weight: 10,
    },
    {
      id: "schema",
      label: "Article structured data valid",
      ok: Boolean(input.title.trim() && input.slug && input.excerpt?.trim()),
      weight: 10,
    },
  ];

  const score = checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
  return { score, checks };
}

export type PublishValidation = {
  errors: string[];
  warnings: string[];
};

export function validateForPublish(post: {
  title: string;
  slug: string | null;
  contentHtml: string;
  authorId: string;
  featuredMediaId: string | null;
  featuredMedia?: { altText: string | null } | null;
  seo?: { metaTitle: string | null; metaDescription: string | null } | null;
  excerpt: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
}): PublishValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!post.title.trim()) errors.push("Title is required.");
  if (!post.contentHtml.replace(/<[^>]+>/g, "").trim()) errors.push("Body content is required.");
  if (!post.slug) errors.push("Slug is required.");
  if (!post.authorId) errors.push("Author is required.");
  if (!post.featuredMediaId) warnings.push("Featured image is missing.");
  if (post.featuredMediaId && !(post.featuredMedia?.altText ?? "").trim()) {
    warnings.push("Featured image is missing alt text.");
  }
  if (!post.seo?.metaTitle && !post.title.trim()) warnings.push("Meta title is missing.");
  if (!post.seo?.metaDescription && !post.excerpt?.trim()) {
    warnings.push("Meta description is missing.");
  }
  if (post.canonicalUrl) {
    try {
      const u = new URL(post.canonicalUrl);
      if (!["http:", "https:"].includes(u.protocol)) errors.push("Canonical URL is invalid.");
    } catch {
      errors.push("Canonical URL is invalid.");
    }
  }
  if (!post.robotsIndex) warnings.push("Publishing with noindex.");

  return { errors, warnings };
}

export function readingTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
