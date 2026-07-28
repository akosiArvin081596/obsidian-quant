import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { EMPTY_CONTENT_JSON } from "@/lib/blog/sanitize";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { getAdminPost } from "@/lib/blog/revisions";

type Ctx = { params: Promise<{ id: string }> };

/** Duplicate a post into a new draft (dashboard row action). */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.postsWrite);
    const { id } = await ctx.params;
    const source = await getAdminPost(id);
    if (!source || source.status === "trash") {
      throw new ApiError(404, "Post not found", "not_found");
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId: user.id,
          title: source.title ? `${source.title} (copy)` : "Untitled draft",
          subtitle: source.subtitle,
          slug: null,
          excerpt: source.excerpt,
          status: "draft",
          contentJson: (source.contentJson as Prisma.InputJsonValue) ?? EMPTY_CONTENT_JSON,
          contentHtml: source.contentHtml,
          featuredMediaId: source.featuredMediaId,
          primaryCategoryId: source.primaryCategoryId,
          focusKeyword: source.focusKeyword,
          robotsIndex: true,
          robotsFollow: true,
          seo: {
            create: {
              metaTitle: source.seo?.metaTitle ?? null,
              metaDescription: source.seo?.metaDescription ?? null,
              socialTitle: source.seo?.socialTitle ?? null,
              socialDescription: source.seo?.socialDescription ?? null,
              socialMediaId: source.seo?.socialMediaId ?? null,
              schemaType: source.seo?.schemaType ?? "BlogPosting",
            },
          },
        },
      });

      if (source.tags.length) {
        await tx.postTag.createMany({
          data: source.tags.map((t) => ({ postId: created.id, tagId: t.tagId })),
        });
      }
      if (source.categories.length) {
        await tx.postCategory.createMany({
          data: source.categories.map((c) => ({
            postId: created.id,
            categoryId: c.categoryId,
            isPrimary: c.isPrimary,
          })),
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: created.id },
        include: postAdminInclude,
      });
    });

    await writeAuditLog({
      userId: user.id,
      action: "post.duplicate",
      entityType: "post",
      entityId: post.id,
      after: { sourceId: id },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
