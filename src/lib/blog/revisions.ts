import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { postAdminInclude, type PostAdminPayload } from "@/lib/blog/includes";

export async function createPostRevision(
  postId: string,
  createdById: string,
  reason: string,
  snapshot: unknown,
) {
  const latest = await prisma.postRevision.findFirst({
    where: { postId },
    orderBy: { revisionNo: "desc" },
    select: { revisionNo: true },
  });
  const revisionNo = (latest?.revisionNo ?? 0) + 1;
  return prisma.postRevision.create({
    data: {
      postId,
      revisionNo,
      createdById,
      reason,
      snapshotJson: snapshot as Prisma.InputJsonValue,
    },
  });
}

export async function snapshotPost(post: PostAdminPayload) {
  return {
    title: post.title,
    subtitle: post.subtitle,
    slug: post.slug,
    excerpt: post.excerpt,
    status: post.status,
    contentJson: post.contentJson,
    contentHtml: post.contentHtml,
    featuredMediaId: post.featuredMediaId,
    primaryCategoryId: post.primaryCategoryId,
    focusKeyword: post.focusKeyword,
    publishedAt: post.publishedAt,
    scheduledAt: post.scheduledAt,
    canonicalUrl: post.canonicalUrl,
    robotsIndex: post.robotsIndex,
    robotsFollow: post.robotsFollow,
    version: post.version,
    seo: post.seo,
    tagIds: post.tags.map((t) => t.tagId),
    categoryIds: post.categories.map((c) => c.categoryId),
  };
}

export async function getAdminPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: postAdminInclude,
  });
}
