import path from "node:path";
import { prisma } from "@/lib/db";
import { blogPostPath, ensureTrailingSlash } from "@/lib/blog/slug";
import {
  brokenOnly,
  scanHtmlLinks,
  type InternalResolveContext,
  type LinkIssue,
} from "@/lib/blog/linkCheck";

async function buildInternalContext(): Promise<InternalResolveContext> {
  const [posts, redirects, categories, tags] = await Promise.all([
    prisma.post.findMany({
      where: { status: "published", deletedAt: null, slug: { not: null } },
      select: { slug: true },
    }),
    prisma.redirect.findMany({
      where: { active: true },
      select: { sourcePath: true },
    }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
  ]);

  return {
    publishedBlogPaths: new Set(
      posts.filter((p) => p.slug).map((p) => blogPostPath(p.slug!)),
    ),
    redirectSources: new Set(
      redirects.map((r) => {
        const p = r.sourcePath.startsWith("/") ? r.sourcePath : `/${r.sourcePath}`;
        return p.startsWith("/uploads/") ? p : ensureTrailingSlash(p);
      }),
    ),
    taxonomyPaths: new Set([
      ...categories.map((c) => ensureTrailingSlash(`/blog/category/${c.slug}`)),
      ...tags.map((t) => ensureTrailingSlash(`/blog/tag/${t.slug}`)),
    ]),
    uploadsRoot: process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"),
  };
}

export async function scanPostLinks(
  postId: string,
  opts?: { checkExternal?: boolean },
): Promise<{ postId: string; title: string; issues: LinkIssue[]; broken: LinkIssue[] }> {
  const post = await prisma.post.findFirst({
    where: { id: postId, NOT: { status: "trash" } },
    select: { id: true, title: true, contentHtml: true, canonicalUrl: true },
  });
  if (!post) {
    throw new Error("Post not found");
  }

  const internal = await buildInternalContext();
  const html = [post.contentHtml, post.canonicalUrl ? `<a href="${post.canonicalUrl}"></a>` : ""]
    .filter(Boolean)
    .join("\n");

  const issues = await scanHtmlLinks(html, {
    checkExternal: opts?.checkExternal ?? true,
    internal,
    postId: post.id,
    postTitle: post.title.trim() || "Untitled draft",
  });

  return {
    postId: post.id,
    title: post.title.trim() || "Untitled draft",
    issues,
    broken: brokenOnly(issues),
  };
}

export async function scanAllPostLinks(opts?: {
  checkExternal?: boolean;
}): Promise<{
  scanned: number;
  brokenCount: number;
  byPost: { postId: string; title: string; broken: LinkIssue[] }[];
  broken: LinkIssue[];
}> {
  const posts = await prisma.post.findMany({
    where: { NOT: { status: "trash" }, deletedAt: null },
    select: { id: true, title: true, contentHtml: true, canonicalUrl: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const internal = await buildInternalContext();
  const byPost: { postId: string; title: string; broken: LinkIssue[] }[] = [];
  const allBroken: LinkIssue[] = [];

  for (const post of posts) {
    const html = [post.contentHtml, post.canonicalUrl ? `<a href="${post.canonicalUrl}"></a>` : ""]
      .filter(Boolean)
      .join("\n");
    const issues = await scanHtmlLinks(html, {
      checkExternal: opts?.checkExternal ?? true,
      internal,
      postId: post.id,
      postTitle: post.title.trim() || "Untitled draft",
    });
    const broken = brokenOnly(issues);
    if (broken.length) {
      byPost.push({
        postId: post.id,
        title: post.title.trim() || "Untitled draft",
        broken,
      });
      allBroken.push(...broken);
    }
  }

  return {
    scanned: posts.length,
    brokenCount: allBroken.length,
    byPost,
    broken: allBroken,
  };
}
