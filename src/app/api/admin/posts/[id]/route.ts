import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { postAdminInclude } from "@/lib/blog/includes";
import { sanitizeContentHtml } from "@/lib/blog/sanitize";
import { blogPostPath, slugify } from "@/lib/blog/slug";
import { writeAuditLog } from "@/lib/blog/audit";
import { createPostRevision, getAdminPost, snapshotPost } from "@/lib/blog/revisions";
import { computeSeoCompleteness } from "@/lib/blog/seoScore";
import { SITE_URL } from "@/lib/seo";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  contentHtml: z.string().optional(),
  featuredMediaId: z.string().nullable().optional(),
  primaryCategoryId: z.string().nullable().optional(),
  focusKeyword: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  version: z.number().int().optional(),
  tagIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  seo: z
    .object({
      metaTitle: z.string().nullable().optional(),
      metaDescription: z.string().nullable().optional(),
      socialTitle: z.string().nullable().optional(),
      socialDescription: z.string().nullable().optional(),
      socialMediaId: z.string().nullable().optional(),
      schemaType: z.string().optional(),
    })
    .optional(),
  createRevision: z.boolean().optional(),
  revisionReason: z.string().optional(),
});

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const { id } = await ctx.params;
    const post = await getAdminPost(id);
    if (!post || post.status === "trash") {
      throw new ApiError(404, "Post not found", "not_found");
    }
    const seoScore = computeSeoCompleteness({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      focusKeyword: post.focusKeyword,
      featuredMedia: post.featuredMedia,
      seo: post.seo,
      canonicalUrl: post.canonicalUrl,
      robotsIndex: post.robotsIndex,
      primaryCategoryId: post.primaryCategoryId,
      tags: post.tags,
      categories: post.categories,
    });
    return jsonOk({ post, seoScore });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsWrite);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const existing = await getAdminPost(id);
    if (!existing || existing.deletedAt) {
      throw new ApiError(404, "Post not found", "not_found");
    }

    const isAuthorOnly =
      user.roles.includes("Author") &&
      !user.roles.includes("Editor") &&
      !user.roles.includes("Administrator");
    if (isAuthorOnly && existing.authorId !== user.id) {
      throw new ApiError(403, "Authors may only edit their own posts", "forbidden");
    }

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ApiError(409, "Post was modified by another user", "version_conflict");
    }

    let nextSlug = body.slug === undefined ? undefined : body.slug ? slugify(body.slug) : null;
    if (nextSlug === undefined && body.title && !existing.slug) {
      nextSlug = slugify(body.title) || null;
    }
    if (nextSlug) {
      const clash = await prisma.post.findFirst({
        where: { slug: nextSlug, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        throw new ApiError(409, "Slug already in use", "duplicate_slug");
      }
    }

    if (body.seo !== undefined && !user.permissions.includes(PERMISSIONS.seoEdit)) {
      // Authors without seo:edit may still save content; ignore SEO payload.
      body.seo = undefined;
    }

    const contentHtml =
      body.contentHtml !== undefined ? sanitizeContentHtml(body.contentHtml) : undefined;

    const previousSlug = existing.slug;
    const slugChanged =
      nextSlug !== undefined &&
      nextSlug !== null &&
      previousSlug !== null &&
      nextSlug !== previousSlug;

    const updated = await prisma.$transaction(async (tx) => {
      if (
        slugChanged &&
        existing.status === "published" &&
        previousSlug &&
        nextSlug
      ) {
        await tx.redirect.upsert({
          where: { sourcePath: blogPostPath(previousSlug) },
          create: {
            sourcePath: blogPostPath(previousSlug),
            destinationUrl: blogPostPath(nextSlug),
            statusCode: 301,
            active: true,
            createdById: user.id,
          },
          update: {
            destinationUrl: blogPostPath(nextSlug),
            active: true,
            statusCode: 301,
          },
        });
      }

      if (body.tagIds) {
        await tx.postTag.deleteMany({ where: { postId: id } });
        if (body.tagIds.length) {
          await tx.postTag.createMany({
            data: body.tagIds.map((tagId) => ({ postId: id, tagId })),
          });
        }
      }
      if (body.categoryIds) {
        await tx.postCategory.deleteMany({ where: { postId: id } });
        if (body.categoryIds.length) {
          await tx.postCategory.createMany({
            data: body.categoryIds.map((categoryId, index) => ({
              postId: id,
              categoryId,
              isPrimary: body.primaryCategoryId
                ? categoryId === body.primaryCategoryId
                : index === 0,
            })),
          });
        }
      }

      if (body.seo) {
        await tx.postSeo.upsert({
          where: { postId: id },
          create: {
            postId: id,
            metaTitle: body.seo.metaTitle ?? null,
            metaDescription: body.seo.metaDescription ?? null,
            socialTitle: body.seo.socialTitle ?? null,
            socialDescription: body.seo.socialDescription ?? null,
            socialMediaId: body.seo.socialMediaId ?? null,
            schemaType: body.seo.schemaType ?? "BlogPosting",
          },
          update: {
            ...(body.seo.metaTitle !== undefined ? { metaTitle: body.seo.metaTitle } : {}),
            ...(body.seo.metaDescription !== undefined
              ? { metaDescription: body.seo.metaDescription }
              : {}),
            ...(body.seo.socialTitle !== undefined ? { socialTitle: body.seo.socialTitle } : {}),
            ...(body.seo.socialDescription !== undefined
              ? { socialDescription: body.seo.socialDescription }
              : {}),
            ...(body.seo.socialMediaId !== undefined
              ? { socialMediaId: body.seo.socialMediaId }
              : {}),
            ...(body.seo.schemaType !== undefined ? { schemaType: body.seo.schemaType } : {}),
          },
        });
      }

      return tx.post.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}),
          ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
          ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
          ...(body.contentJson !== undefined
            ? { contentJson: body.contentJson as Prisma.InputJsonValue }
            : {}),
          ...(contentHtml !== undefined ? { contentHtml } : {}),
          ...(body.featuredMediaId !== undefined
            ? { featuredMediaId: body.featuredMediaId }
            : {}),
          ...(body.primaryCategoryId !== undefined
            ? { primaryCategoryId: body.primaryCategoryId }
            : {}),
          ...(body.focusKeyword !== undefined ? { focusKeyword: body.focusKeyword } : {}),
          ...(body.canonicalUrl !== undefined ? { canonicalUrl: body.canonicalUrl } : {}),
          ...(body.robotsIndex !== undefined ? { robotsIndex: body.robotsIndex } : {}),
          ...(body.robotsFollow !== undefined ? { robotsFollow: body.robotsFollow } : {}),
          // Keep public canonical aligned when slug changes on a live post.
          ...(slugChanged && existing.status === "published" && nextSlug && body.canonicalUrl === undefined
            ? { canonicalUrl: `${SITE_URL}${blogPostPath(nextSlug)}` }
            : {}),
          version: { increment: 1 },
        },
        include: postAdminInclude,
      });
    });

    if (body.createRevision) {
      await createPostRevision(
        id,
        user.id,
        body.revisionReason ?? "manual_save",
        await snapshotPost(updated),
      );
    }

    return jsonOk({ post: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsDelete);
    const { id } = await ctx.params;
    const existing = await getAdminPost(id);
    if (!existing) throw new ApiError(404, "Post not found", "not_found");

    const post = await prisma.post.update({
      where: { id },
      data: { status: "trash", deletedAt: new Date(), version: { increment: 1 } },
      include: postAdminInclude,
    });

    await writeAuditLog({
      userId: user.id,
      action: "post.trash",
      entityType: "post",
      entityId: id,
      before: { status: existing.status },
      after: { status: "trash" },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error);
  }
}
