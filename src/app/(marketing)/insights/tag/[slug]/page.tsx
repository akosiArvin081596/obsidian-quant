import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { postPublicInclude } from "@/lib/blog/includes";
import { mapPostToCard } from "@/lib/blog/public";
import PageHero from "@/components/PageHero";
import BlogCta from "@/components/blog/BlogCta";
import BlogPostGrid from "@/components/blog/BlogPostGrid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) return pageMetadata({ title: "Tag", path: `/insights/tag/${slug}`, noIndex: true });
    const count = await prisma.postTag.count({
      where: { tagId: tag.id, post: { status: "published", deletedAt: null } },
    });
    return pageMetadata({
      title: `${tag.name} | Insights`,
      description: tag.description || `Articles tagged ${tag.name}.`,
      path: `/insights/tag/${slug}`,
      noIndex: count === 0,
    });
  } catch {
    return pageMetadata({ title: "Tag", path: `/insights/tag/${slug}`, noIndex: true });
  }
}

export default async function InsightsTagPage({ params }: Props) {
  const { slug } = await params;
  let tag;
  try {
    tag = await prisma.tag.findUnique({ where: { slug } });
  } catch {
    notFound();
  }
  if (!tag) notFound();

  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      deletedAt: null,
      tags: { some: { tagId: tag.id } },
    },
    include: postPublicInclude,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Tag"
        title={tag.name}
        body={tag.description || `Articles tagged "${tag.name}".`}
        standardHeight
      />
      <BlogPostGrid
        posts={posts.map(mapPostToCard)}
        showFeatured={false}
        emptyMessage="No published articles for this tag yet."
      />
      <BlogCta compact />
    </>
  );
}
