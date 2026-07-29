import { Prisma } from "@prisma/client";

export const postAdminInclude = {
  author: { select: { id: true, name: true, email: true } },
  featuredMedia: true,
  primaryCategory: true,
  seo: { include: { socialMedia: true } },
  tags: { include: { tag: true } },
  categories: { include: { category: true } },
} satisfies Prisma.PostInclude;

export type PostAdminPayload = Prisma.PostGetPayload<{ include: typeof postAdminInclude }>;

export const postPublicInclude = {
  author: { select: { id: true, name: true, bio: true } },
  featuredMedia: true,
  primaryCategory: true,
  seo: { include: { socialMedia: true } },
  tags: { include: { tag: true } },
  categories: { include: { category: true } },
} satisfies Prisma.PostInclude;

export type PostPublicPayload = Prisma.PostGetPayload<{ include: typeof postPublicInclude }>;
