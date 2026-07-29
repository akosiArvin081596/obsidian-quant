import { prisma } from "@/lib/db";
import { postPublicInclude } from "@/lib/blog/includes";
import { mapPostToCard, type BlogCardPost } from "@/lib/blog/public";
import { promoteDueScheduledPosts } from "@/lib/blog/publish";
import { pickRelatedPosts } from "@/lib/blog/relatedPosts";

export async function loadPublishedPosts(limit = 24): Promise<BlogCardPost[]> {
  await promoteDueScheduledPosts();
  const posts = await prisma.post.findMany({
    where: { status: "published", deletedAt: null, robotsIndex: true },
    include: postPublicInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return posts.map(mapPostToCard);
}

export async function loadRelatedPosts(
  postId: string,
  categoryId: string | null,
  tagIds: string[],
  limit = 3,
): Promise<BlogCardPost[]> {
  const seedCategoryRows = await prisma.postCategory.findMany({
    where: { postId },
    select: { categoryId: true },
  });
  const seedCategoryIds = [
    ...new Set([
      ...(categoryId ? [categoryId] : []),
      ...seedCategoryRows.map((c) => c.categoryId),
    ]),
  ];

  const taxonomyOr = [
    ...(categoryId ? [{ primaryCategoryId: categoryId }] : []),
    ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
    ...(seedCategoryIds.length
      ? [{ categories: { some: { categoryId: { in: seedCategoryIds } } } }]
      : []),
  ];

  const relatedPool =
    taxonomyOr.length > 0
      ? await prisma.post.findMany({
          where: {
            id: { not: postId },
            status: "published",
            deletedAt: null,
            robotsIndex: true,
            OR: taxonomyOr,
          },
          include: postPublicInclude,
          orderBy: { publishedAt: "desc" },
          take: 40,
        })
      : [];

  const recentPool = await prisma.post.findMany({
    where: {
      id: { notIn: [postId, ...relatedPool.map((p) => p.id)] },
      status: "published",
      deletedAt: null,
      robotsIndex: true,
    },
    include: postPublicInclude,
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  const candidates = [...relatedPool, ...recentPool];
  const byId = new Map(candidates.map((p) => [p.id, p]));

  const scored = pickRelatedPosts(
    {
      id: postId,
      primaryCategoryId: categoryId,
      tagIds,
      categoryIds: seedCategoryIds,
    },
    candidates.map((p) => ({
      id: p.id,
      primaryCategoryId: p.primaryCategoryId,
      tagIds: p.tags.map((t) => t.tagId),
      categoryIds: p.categories.map((c) => c.categoryId),
      publishedAt: p.publishedAt,
    })),
    limit,
  );

  return scored
    .map((row) => byId.get(row.id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(mapPostToCard);
}

export async function loadPublishedCategories() {
  return prisma.category.findMany({
    where: {
      posts: {
        some: { post: { status: "published", deletedAt: null } },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
