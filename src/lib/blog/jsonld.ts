import { BRAND } from "@/content/site";
import { SITE_URL } from "@/lib/seo";
import { blogPostPath } from "@/lib/blog/slug";
import type { PostPublicPayload } from "@/lib/blog/includes";

function absoluteMediaUrl(storageKey: string | undefined | null): string | undefined {
  if (!storageKey) return undefined;
  if (storageKey.startsWith("http")) return storageKey;
  return `${SITE_URL}/uploads/${storageKey.replace(/^\/+/, "")}`;
}

/**
 * Serialise a JSON-LD payload for inlining in a `<script>` tag. `JSON.stringify`
 * leaves `<` intact, so any value containing `</script>` would close the tag
 * early and let CMS-authored text land in the document as markup — escape it to
 * the unicode form, which parses back to `<` for consumers.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/** Site-wide Organization entity for marketing pages (audit Issue 8). */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: BRAND.legalEntity,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/obsidian-gem.webp`,
    email: BRAND.email,
    foundingDate: "2026",
    description: BRAND.intro,
    slogan: BRAND.slogan,
    areaServed: BRAND.presence.map((city) => ({
      "@type": "Place",
      name: city,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      email: BRAND.email,
      contactType: "investor relations",
      availableLanguage: "English",
    },
  };
}

export function buildBlogPostingJsonLd(post: PostPublicPayload) {
  const url = `${SITE_URL}${blogPostPath(post.slug!)}`;
  const image = absoluteMediaUrl(post.featuredMedia?.storageKey);
  const description =
    post.seo?.metaDescription || post.excerpt || BRAND.intro;

  return {
    "@context": "https://schema.org",
    "@type": post.seo?.schemaType || "BlogPosting",
    headline: post.title,
    description,
    ...(image ? { image: [image] } : {}),
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/obsidian-gem.webp`,
      },
    },
    mainEntityOfPage: url,
  };
}

export function mediaPublicUrl(storageKey: string): string {
  return `/uploads/${storageKey.replace(/^\/+/, "")}`;
}
