import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BRAND } from "@/content/site";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { postPublicInclude } from "@/lib/blog/includes";
import { buildBlogPostingJsonLd, mediaPublicUrl } from "@/lib/blog/jsonld";
import { readingTimeMinutes } from "@/lib/blog/seoScore";
import { loadRelatedPosts } from "@/lib/blog/queries";
import type { BlogCardPost } from "@/lib/blog/public";
import { blogPostPath, ensureTrailingSlash } from "@/lib/blog/slug";
import { promoteDueScheduledPosts } from "@/lib/blog/publish";
import BlogArticleHero from "@/components/blog/BlogArticleHero";
import BlogCta from "@/components/blog/BlogCta";
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts";
import ArticleComments from "@/components/blog/ArticleComments";
import Section from "@/components/Section";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function loadPost(slug: string) {
  await promoteDueScheduledPosts();
  return prisma.post.findFirst({
    where: { slug, status: "published", deletedAt: null },
    include: postPublicInclude,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await loadPost(slug);
    if (!post) return pageMetadata({ title: "Not found", path: `/blog/${slug}`, noIndex: true });

    const image = post.featuredMedia
      ? `${SITE_URL}${mediaPublicUrl(post.featuredMedia.storageKey)}`
      : undefined;
    const description = post.seo?.metaDescription || post.excerpt || BRAND.intro;

    return pageMetadata({
      title: post.seo?.metaTitle || post.title,
      description,
      path: `/blog/${post.slug}`,
      socialTitle: post.seo?.socialTitle || undefined,
      socialDescription: post.seo?.socialDescription || undefined,
      ogImage: image,
      noIndex: !post.robotsIndex,
    });
  } catch {
    return pageMetadata({ title: "Blog", path: "/blog", noIndex: true });
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await loadPost(slug);
  } catch {
    notFound();
  }

  if (!post) {
    let hit: { id: string; destinationUrl: string } | null = null;
    try {
      hit = await prisma.redirect.findFirst({
        where: {
          active: true,
          OR: [
            { sourcePath: blogPostPath(slug) },
            { sourcePath: `/blog/${slug}` },
            { sourcePath: `/blog/${slug}/` },
          ],
        },
        select: { id: true, destinationUrl: true },
      });
      if (hit) {
        await prisma.redirect.update({
          where: { id: hit.id },
          data: { hitCount: { increment: 1 } },
        });
      }
    } catch {
      hit = null;
    }
    // redirect() throws a special Next control-flow error — must not be caught above.
    if (hit) {
      redirect(ensureTrailingSlash(hit.destinationUrl));
    }
    notFound();
  }

  const jsonLd = buildBlogPostingJsonLd(post);
  const readMinutes = readingTimeMinutes(post.contentHtml);
  const featuredImage = post.featuredMedia
    ? {
        url: mediaPublicUrl(post.featuredMedia.storageKey),
        alt: post.featuredMedia.altText,
      }
    : null;

  let related: BlogCardPost[] = [];
  try {
    related = await loadRelatedPosts(
      post.id,
      post.primaryCategoryId,
      post.tags.map(({ tag }) => tag.id),
    );
  } catch {
    related = [];
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticleHero
        title={post.title}
        subtitle={post.subtitle}
        authorName={post.author.name}
        publishedAt={post.publishedAt}
        readMinutes={readMinutes}
        category={post.primaryCategory}
        featuredImage={featuredImage}
      />
      <Section className="bg-midnight" spacing="py-16 lg:py-24">
        <article
          className="prose-blog mx-auto max-w-3xl text-[1.05rem] leading-[1.85] text-silver/85"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
        {post.author.bio ? (
          <aside className="mx-auto mt-14 max-w-3xl border border-gold/15 bg-obsidian/40 p-6 sm:p-8">
            <p className="text-[.62rem] uppercase tracking-[.2em] text-gold">Author</p>
            <p className="mt-2 font-serif text-xl text-ghost">{post.author.name}</p>
            <p className="mt-3 text-sm font-light leading-relaxed text-silver/65">{post.author.bio}</p>
          </aside>
        ) : null}
        {post.tags.length ? (
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-2">
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}/`}
                className="border border-gold/20 px-3 py-1.5 text-[.65rem] uppercase tracking-[.14em] text-gold/80 transition-colors hover:border-gold/50 hover:bg-gold/5"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="mx-auto max-w-3xl">
          <ArticleComments slug={slug} />
        </div>
      </Section>
      <BlogRelatedPosts posts={related} />
      <BlogCta
        compact
        title="Discuss this research with our team."
        body="Qualified institutional investors can request a confidential briefing on strategy fit, risk limits, and onboarding requirements."
      />
    </>
  );
}
