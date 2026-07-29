import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/auth/api";
import { postAdminInclude, type PostAdminPayload } from "@/lib/blog/includes";
import { SITE_URL } from "@/lib/seo";
import { blogPostPath, slugify } from "@/lib/blog/slug";
import { validateForPublish } from "@/lib/blog/seoScore";
import { writeAuditLog } from "@/lib/blog/audit";
import { createPostRevision, snapshotPost } from "@/lib/blog/revisions";

type PublishReady = {
  slug: string;
  canonicalUrl: string;
  warnings: string[];
};

/** Resolve slug/canonical and run publish validation. Throws ApiError on hard failures. */
export async function prepareForPublish(existing: PostAdminPayload): Promise<PublishReady> {
  const slug = existing.slug || slugify(existing.title);
  if (!slug) {
    throw new ApiError(400, "A title or slug is required to publish", "validation");
  }

  const clash = await prisma.post.findFirst({
    where: { slug, NOT: { id: existing.id } },
    select: { id: true },
  });
  if (clash) {
    throw new ApiError(409, "Slug already in use", "duplicate_slug");
  }

  const validation = validateForPublish({
    ...existing,
    slug,
    featuredMedia: existing.featuredMedia,
    seo: existing.seo,
  });
  if (validation.errors.length) {
    throw new ApiError(400, validation.errors.join(" "), "validation");
  }

  return {
    slug,
    canonicalUrl: existing.canonicalUrl || `${SITE_URL}${blogPostPath(slug)}`,
    warnings: validation.warnings,
  };
}

export async function publishPostNow(opts: {
  existing: PostAdminPayload;
  userId: string;
  ipAddress?: string | null;
  publishedAt?: Date;
}) {
  const { existing, userId, ipAddress } = opts;
  const { slug, canonicalUrl, warnings } = await prepareForPublish(existing);
  const previousSlug = existing.slug;

  const post = await prisma.$transaction(async (tx) => {
    if (previousSlug && previousSlug !== slug && existing.status === "published") {
      await tx.redirect.upsert({
        where: { sourcePath: blogPostPath(previousSlug) },
        create: {
          sourcePath: blogPostPath(previousSlug),
          destinationUrl: blogPostPath(slug),
          statusCode: 301,
          active: true,
          createdById: userId,
        },
        update: {
          destinationUrl: blogPostPath(slug),
          active: true,
          statusCode: 301,
        },
      });
    }

    return tx.post.update({
      where: { id: existing.id },
      data: {
        status: "published",
        slug,
        canonicalUrl,
        publishedAt: opts.publishedAt ?? existing.publishedAt ?? new Date(),
        scheduledAt: null,
        deletedAt: null,
        version: { increment: 1 },
      },
      include: postAdminInclude,
    });
  });

  await createPostRevision(existing.id, userId, "publish", await snapshotPost(post));
  await writeAuditLog({
    userId,
    action: "post.publish",
    entityType: "post",
    entityId: existing.id,
    before: { status: existing.status, slug: existing.slug },
    after: { status: post.status, slug: post.slug },
    ipAddress,
  });

  return { post, warnings, url: blogPostPath(slug) };
}

export async function schedulePost(opts: {
  existing: PostAdminPayload;
  userId: string;
  scheduledAt: Date;
  ipAddress?: string | null;
}) {
  const { existing, userId, scheduledAt, ipAddress } = opts;
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new ApiError(400, "Invalid schedule date/time", "validation");
  }
  if (scheduledAt.getTime() <= Date.now() + 30_000) {
    throw new ApiError(400, "Schedule time must be at least 30 seconds in the future", "validation");
  }

  const { slug, canonicalUrl, warnings } = await prepareForPublish(existing);

  const post = await prisma.post.update({
    where: { id: existing.id },
    data: {
      status: "scheduled",
      slug,
      canonicalUrl,
      scheduledAt,
      deletedAt: null,
      version: { increment: 1 },
    },
    include: postAdminInclude,
  });

  await createPostRevision(existing.id, userId, "schedule", await snapshotPost(post));
  await writeAuditLog({
    userId,
    action: "post.schedule",
    entityType: "post",
    entityId: existing.id,
    before: { status: existing.status, scheduledAt: existing.scheduledAt },
    after: { status: post.status, scheduledAt: post.scheduledAt },
    ipAddress,
  });

  return { post, warnings, url: blogPostPath(slug) };
}

/** Promote due scheduled posts to published. Safe to call often (public reads / admin list). */
export async function promoteDueScheduledPosts(): Promise<number> {
  const now = new Date();
  const due = await prisma.post.findMany({
    where: {
      status: "scheduled",
      deletedAt: null,
      scheduledAt: { lte: now },
    },
    select: { id: true, publishedAt: true, scheduledAt: true },
  });

  if (!due.length) return 0;

  await prisma.$transaction(
    due.map((row) =>
      prisma.post.update({
        where: { id: row.id },
        data: {
          status: "published",
          publishedAt: row.publishedAt ?? row.scheduledAt ?? now,
          scheduledAt: null,
          version: { increment: 1 },
        },
      }),
    ),
  );

  return due.length;
}
