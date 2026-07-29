import Link from "next/link";
import { cn } from "@/lib/cn";
import type { BlogCardPost } from "@/lib/blog/public";
import { formatBlogDate } from "@/lib/blog/public";

type Props = {
  post: BlogCardPost;
  featured?: boolean;
  priority?: boolean;
};

export default function BlogPostCard({ post, featured = false, priority = false }: Props) {
  const href = `/insights/${post.slug}/`;
  const excerpt = post.excerpt?.trim() || post.subtitle?.trim();

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-gold/10 bg-obsidian/80 transition-all duration-300 hover:border-gold/35 hover:bg-midnight/60",
        featured ? "lg:flex-row lg:items-stretch" : "",
      )}
    >
      {/* Full-card link — sits behind interactive children */}
      <Link href={href} className="absolute inset-0 z-10" aria-label={`Read: ${post.title}`} />

      {post.featuredImage ? (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-midnight/60",
            featured ? "aspect-[16/10] lg:aspect-auto lg:w-[46%]" : "aspect-[16/10]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent" />
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col justify-between p-6 sm:p-8", featured && "lg:p-10")}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {post.categoryName && post.categorySlug ? (
              /* z-20 so category link stays clickable above the card overlay */
              <Link
                href={`/insights/category/${post.categorySlug}/`}
                className="relative z-20 inline-flex items-center gap-2 border border-gold/25 bg-midnight/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold transition-colors hover:border-gold/50"
              >
                <span className="h-1 w-1 rotate-45 bg-gold" aria-hidden />
                {post.categoryName}
              </Link>
            ) : null}
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-silver/40">
              {formatBlogDate(post.publishedAt)}
            </span>
          </div>

          <h2
            className={cn(
              "mt-5 font-serif text-ghost transition-colors duration-300 group-hover:text-gold",
              featured ? "text-3xl lg:text-4xl" : "text-2xl",
            )}
          >
            {post.title}
          </h2>

          {excerpt ? (
            <p
              className={cn(
                "mt-3 font-light leading-relaxed text-silver/65",
                featured ? "max-w-2xl text-sm sm:text-base" : "line-clamp-3 text-sm",
              )}
            >
              {excerpt}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-silver/10 pt-5">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-silver/40">
            {post.authorName}
          </span>
          <span className="text-silver/20">·</span>
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-silver/40">
            {post.readMinutes} min read
          </span>
          <span
            className="ml-auto flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold/60 transition-colors duration-300 group-hover:text-gold"
            aria-hidden
          >
            Read
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </article>
  );
}
