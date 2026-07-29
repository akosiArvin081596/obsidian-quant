import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/blog/audit";

const importSchema = z.object({
  version: z.number(),
  posts: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().nullable().optional(),
      slug: z.string().nullable().optional(),
      excerpt: z.string().nullable().optional(),
      status: z.string().optional(),
      contentJson: z.unknown().optional(),
      contentHtml: z.string().optional(),
      focusKeyword: z.string().nullable().optional(),
      tagSlugs: z.array(z.string()).optional(),
      categorySlugs: z.array(z.string()).optional(),
      primaryCategorySlug: z.string().nullable().optional(),
      seo: z
        .object({
          metaTitle: z.string().nullable().optional(),
          metaDescription: z.string().nullable().optional(),
          socialTitle: z.string().nullable().optional(),
          socialDescription: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    }),
  ),
  tags: z
    .array(z.object({ name: z.string(), slug: z.string(), description: z.string().nullable().optional() }))
    .optional(),
  categories: z
    .array(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireUser(PERMISSIONS.postsWrite);
    const body = importSchema.parse(await req.json());

    let tagsImported = 0;
    let categoriesImported = 0;
    let postsCreated = 0;
    let postsSkipped = 0;

    if (body.tags) {
      for (const tag of body.tags) {
        await prisma.tag.upsert({
          where: { slug: tag.slug },
          create: { name: tag.name, slug: tag.slug, description: tag.description ?? null },
          update: { name: tag.name, description: tag.description ?? null },
        });
        tagsImported += 1;
      }
    }

    if (body.categories) {
      for (const cat of body.categories) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          create: { name: cat.name, slug: cat.slug, description: cat.description ?? null },
          update: { name: cat.name, description: cat.description ?? null },
        });
        categoriesImported += 1;
      }
    }

    for (const item of body.posts) {
      if (item.slug) {
        const existing = await prisma.post.findFirst({ where: { slug: item.slug } });
        if (existing) {
          postsSkipped += 1;
          continue;
        }
      }

      const post = await prisma.post.create({
        data: {
          authorId: actor.id,
          title: item.title,
          subtitle: item.subtitle ?? null,
          slug: item.slug ?? null,
          excerpt: item.excerpt ?? null,
          status: (item.status as "draft") ?? "draft",
          contentJson: (item.contentJson as object) ?? {},
          contentHtml: item.contentHtml ?? "",
          focusKeyword: item.focusKeyword ?? null,
          seo: item.seo
            ? {
                create: {
                  metaTitle: item.seo.metaTitle ?? null,
                  metaDescription: item.seo.metaDescription ?? null,
                  socialTitle: item.seo.socialTitle ?? null,
                  socialDescription: item.seo.socialDescription ?? null,
                },
              }
            : undefined,
        },
      });

      if (item.tagSlugs?.length) {
        const tags = await prisma.tag.findMany({ where: { slug: { in: item.tagSlugs } } });
        if (tags.length) {
          await prisma.postTag.createMany({
            data: tags.map((t) => ({ postId: post.id, tagId: t.id })),
          });
        }
      }

      if (item.categorySlugs?.length) {
        const cats = await prisma.category.findMany({
          where: { slug: { in: item.categorySlugs } },
        });
        if (cats.length) {
          await prisma.postCategory.createMany({
            data: cats.map((c) => ({
              postId: post.id,
              categoryId: c.id,
              isPrimary: c.slug === item.primaryCategorySlug,
            })),
          });
          if (item.primaryCategorySlug) {
            const primary = cats.find((c) => c.slug === item.primaryCategorySlug);
            if (primary) {
              await prisma.post.update({
                where: { id: post.id },
                data: { primaryCategoryId: primary.id },
              });
            }
          }
        }
      }

      postsCreated += 1;
    }

    await writeAuditLog({
      userId: actor.id,
      action: "import.blog",
      entityType: "blog",
      entityId: "bundle",
      after: { postsCreated, postsSkipped, tagsImported, categoriesImported },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ postsCreated, postsSkipped, tagsImported, categoriesImported });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid import bundle", "validation"));
    }
    return jsonError(error);
  }
}
