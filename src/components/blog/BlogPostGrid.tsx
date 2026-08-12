import Link from "next/link";
import Section from "@/components/Section";
import { INSIGHTS_VISIBLE } from "@/content/site";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { BlogCardPost } from "@/lib/blog/public";

type Props = {
  posts: BlogCardPost[];
  emptyMessage?: string;
  showFeatured?: boolean;
};

export default function BlogPostGrid({
  posts,
  emptyMessage = "Publications will appear here once the first article is published.",
  showFeatured = true,
}: Props) {
  if (!posts.length) {
    return (
      <Section className="border-y border-gold/10 bg-midnight">
        <p className="py-16 text-center text-silver/50">{emptyMessage}</p>
      </Section>
    );
  }

  const featured = showFeatured && posts.length > 0 ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;

  return (
    <Section className="border-y border-gold/10 bg-midnight">
      {featured ? (
        <div className="mb-8">
          <BlogPostCard post={featured} featured priority />
        </div>
      ) : null}

      {gridPosts.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}

export function BlogCategoryNav({
  categories,
  activeSlug,
}: {
  categories: { name: string; slug: string }[];
  activeSlug?: string;
}) {
  if (!INSIGHTS_VISIBLE || !categories.length) return null;

  return (
    <Section className="border-b border-gold/10 bg-obsidian" spacing="py-8 lg:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/insights/"
          className={`border px-3 py-1.5 text-[.62rem] uppercase tracking-[.18em] transition-colors ${
            !activeSlug
              ? "border-gold/40 bg-gold/10 text-gold"
              : "border-gold/15 text-silver/50 hover:border-gold/30 hover:text-gold"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/insights/category/${cat.slug}/`}
            className={`border px-3 py-1.5 text-[.62rem] uppercase tracking-[.18em] transition-colors ${
              activeSlug === cat.slug
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-gold/15 text-silver/50 hover:border-gold/30 hover:text-gold"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}
