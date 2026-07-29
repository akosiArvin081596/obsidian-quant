import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { EMPTY_CONTENT_JSON } from "@/lib/blog/sanitize";
import { postAdminInclude } from "@/lib/blog/includes";
import { writeAuditLog } from "@/lib/blog/audit";
import { computeSeoCompleteness } from "@/lib/blog/seoScore";
import { promoteDueScheduledPosts } from "@/lib/blog/publish";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.postsRead);
    await promoteDueScheduledPosts();
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status");
    const mine = searchParams.get("mine") === "1";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const sort = searchParams.get("sort") ?? "updatedAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where = {
      ...(status ? { status: status as never } : { NOT: { status: "trash" as const } }),
      ...(mine ? { authorId: user.id } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
              { focusKeyword: { contains: q, mode: "insensitive" as const } },
              { author: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const orderBy =
      sort === "title"
        ? { title: order as "asc" | "desc" }
        : sort === "publishedAt"
          ? { publishedAt: order as "asc" | "desc" }
          : sort === "status"
            ? { status: order as "asc" | "desc" }
            : { updatedAt: order as "asc" | "desc" };

    const [total, posts, counts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: postAdminInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const summary = {
      published: 0,
      draft: 0,
      scheduled: 0,
      pending_review: 0,
      archived: 0,
      unpublished: 0,
      trash: 0,
      total: 0,
    };
    for (const row of counts) {
      summary[row.status as keyof typeof summary] = row._count._all;
      summary.total += row._count._all;
    }

    const items = posts.map((post) => ({
      ...post,
      seoScore: computeSeoCompleteness({
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
      }).score,
    }));

    return jsonOk({ items, total, page, pageSize, summary });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.postsWrite);
    const body = await req.json().catch(() => ({}));
    const parsed = z
      .object({
        title: z.string().optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid payload", "validation");
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        title: parsed.data.title ?? "",
        contentJson: EMPTY_CONTENT_JSON,
        contentHtml: "",
        status: "draft",
        seo: { create: {} },
      },
      include: postAdminInclude,
    });

    await writeAuditLog({
      userId: user.id,
      action: "post.create",
      entityType: "post",
      entityId: post.id,
      after: { id: post.id, status: post.status },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ post }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
