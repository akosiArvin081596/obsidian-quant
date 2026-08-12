import Link from "next/link";
import Section from "@/components/Section";
import { INSIGHTS_VISIBLE } from "@/content/site";
import type { BlogCardPost } from "@/lib/blog/public";
import { formatBlogDate } from "@/lib/blog/public";

type Props = {
  posts: BlogCardPost[];
  title?: string;
};

export default function BlogRelatedPosts({ posts, title = "Continue reading" }: Props) {
  if (!posts.length) return null;

  return (
    <Section className="border-t border-gold/10 bg-obsidian" spacing="py-16 lg:py-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl text-ghost lg:text-3xl">{title}</h2>
        {INSIGHTS_VISIBLE ? (
          <Link
            href="/insights/"
            className="text-[.65rem] uppercase tracking-[0.18em] text-gold hover:underline"
          >
            All posts
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group border border-gold/10 bg-midnight/30 p-5 transition-colors hover:border-gold/25 hover:bg-midnight/50"
          >
            {post.featuredImage ? (
              <Link href={`/insights/${post.slug}/`} tabIndex={-1} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt || post.title}
                  className="mb-4 aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
              </Link>
            ) : null}
            <p className="text-[.6rem] uppercase tracking-[0.18em] text-silver/40">
              {formatBlogDate(post.publishedAt)} · {post.readMinutes} min
            </p>
            <h3 className="mt-2 font-serif text-xl text-ghost transition-colors group-hover:text-gold">
              <Link href={`/insights/${post.slug}/`}>{post.title}</Link>
            </h3>
          </article>
        ))}
      </div>
    </Section>
  );
}
