import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatBlogDate } from "@/lib/blog/public";

function MetaIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 opacity-60"
    >
      {children}
    </svg>
  );
}

type Props = {
  title: string;
  subtitle?: string | null;
  authorName: string;
  publishedAt: Date | null;
  readMinutes: number;
  category?: { name: string; slug: string } | null;
  featuredImage?: { url: string; alt: string | null } | null;
  className?: string;
};

export default function BlogArticleHero({
  title,
  subtitle,
  authorName,
  publishedAt,
  readMinutes,
  category,
  featuredImage,
  className,
}: Props) {
  return (
    <header className={cn("relative border-b border-gold/10 bg-obsidian", className)}>
      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[.62rem] uppercase tracking-[.2em] text-silver/35">
          <Link href="/blog/" className="transition-colors hover:text-gold">
            Blog
          </Link>
          {category ? (
            <>
              <span>/</span>
              <Link href={`/blog/category/${category.slug}/`} className="transition-colors hover:text-gold">
                {category.name}
              </Link>
            </>
          ) : null}
        </nav>

        {/* Title */}
        <h1 className="mt-5 font-serif text-3xl leading-[1.1] text-ghost sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-4 text-base font-light italic leading-relaxed text-silver/60 sm:text-lg">
            {subtitle}
          </p>
        ) : null}

        {/* Meta row */}
        <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[.7rem] uppercase tracking-[0.14em] text-silver/45">
          <li className="inline-flex items-center gap-1.5">
            <MetaIcon>
              <path d="M20 21a8 8 0 1 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </MetaIcon>
            {authorName}
          </li>
          {publishedAt ? (
            <li className="inline-flex items-center gap-1.5">
              <MetaIcon>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </MetaIcon>
              <time dateTime={publishedAt.toISOString()}>{formatBlogDate(publishedAt)}</time>
            </li>
          ) : null}
          <li className="inline-flex items-center gap-1.5">
            <MetaIcon>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </MetaIcon>
            {readMinutes} min read
          </li>
        </ul>

        {/* Featured image — below meta, inside the content column */}
        {featuredImage ? (
          <figure className="mt-8 overflow-hidden border border-gold/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredImage.url}
              alt={featuredImage.alt || title}
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>
        ) : null}
      </div>
    </header>
  );
}
