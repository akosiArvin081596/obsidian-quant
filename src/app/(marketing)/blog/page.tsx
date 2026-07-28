import { pageMetadata } from "@/lib/seo";
import { loadPublishedCategories, loadPublishedPosts } from "@/lib/blog/queries";
import type { BlogCardPost } from "@/lib/blog/public";
import BlogCta from "@/components/blog/BlogCta";
import BlogPostGrid, { BlogCategoryNav } from "@/components/blog/BlogPostGrid";
import Eyebrow from "@/components/Eyebrow";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Blog | Obsidian Quant Group",
  description:
    "Research notes, market commentary, and institutional perspective from Obsidian Quant Group.",
  path: "/blog",
  focusKeyword: "quantitative research blog",
});

export default async function BlogIndexPage() {
  let posts: BlogCardPost[] = [];
  let categories: Awaited<ReturnType<typeof loadPublishedCategories>> = [];
  try {
    [posts, categories] = await Promise.all([loadPublishedPosts(), loadPublishedCategories()]);
  } catch {
    posts = [];
    categories = [];
  }

  return (
    <>
      {/* Compact page header — clears fixed nav, no wasted vertical space */}
      <div className="relative border-b border-gold/10 bg-obsidian px-5 pb-10 pt-28 sm:px-6 sm:pt-32 lg:px-16">
        <div className="relative z-10 mx-auto max-w-7xl">
          <Eyebrow>Research &amp; Commentary</Eyebrow>
          <h1 className="mt-4 font-serif text-4xl text-ghost sm:text-5xl lg:text-6xl">
            Perspective from the model.
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-silver/55">
            Systematic research, market structure, and risk architecture — written for institutional
            allocators evaluating quantitative mandates.
          </p>
        </div>
      </div>
      <BlogCategoryNav categories={categories} />
      <BlogPostGrid posts={posts} />
      <BlogCta />
    </>
  );
}
