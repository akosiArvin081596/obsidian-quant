import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { postPublicInclude } from "@/lib/blog/includes";
import { mapPostToCard } from "@/lib/blog/public";
import { loadPublishedCategories } from "@/lib/blog/queries";
import PageHero from "@/components/PageHero";
import BlogCta from "@/components/blog/BlogCta";
import BlogPostGrid, { BlogCategoryNav } from "@/components/blog/BlogPostGrid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      return pageMetadata({ title: "Category", path: `/blog/category/${slug}`, noIndex: true });
    }
    const count = await prisma.postCategory.count({
      where: { categoryId: category.id, post: { status: "published", deletedAt: null } },
    });
    return pageMetadata({
      title: `${category.name} | Blog`,
      description: category.description || `Articles in ${category.name}.`,
      path: `/blog/category/${slug}`,
      noIndex: count === 0,
    });
  } catch {
    return pageMetadata({ title: "Category", path: `/blog/category/${slug}`, noIndex: true });
  }
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  let category;
  try {
    category = await prisma.category.findUnique({ where: { slug } });
  } catch {
    notFound();
  }
  if (!category) notFound();

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: "published",
        deletedAt: null,
        categories: { some: { categoryId: category.id } },
      },
      include: postPublicInclude,
      orderBy: { publishedAt: "desc" },
    }),
    loadPublishedCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Category"
        title={category.name}
        body={category.description || `Articles in “${category.name}”.`}
        standardHeight
      />
      <BlogCategoryNav categories={categories} activeSlug={slug} />
      <BlogPostGrid
        posts={posts.map(mapPostToCard)}
        showFeatured={posts.length > 1}
        emptyMessage="No published articles in this category yet."
      />
      <BlogCta compact />
    </>
  );
}
