import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk } from "@/lib/auth/api";
import sanitizeHtml from "sanitize-html";

type RouteCtx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { slug } = await ctx.params;
    const post = await prisma.post.findFirst({
      where: { slug, status: "published", deletedAt: null },
      select: { id: true },
    });
    if (!post) return jsonOk({ comments: [] });

    const comments = await prisma.comment.findMany({
      where: { postId: post.id, status: "approved" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        authorName: true,
        body: true,
        createdAt: true,
      },
    });

    return jsonOk({
      comments: comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { slug } = await ctx.params;
    const post = await prisma.post.findFirst({
      where: { slug, status: "published", deletedAt: null },
      select: { id: true },
    });
    if (!post) throw new ApiError(404, "Post not found", "not_found");

    const body = (await req.json()) as {
      authorName?: string;
      authorEmail?: string;
      body?: string;
    };

    const authorName = body.authorName?.trim();
    const commentBody = body.body?.trim();
    if (!authorName || !commentBody) {
      throw new ApiError(400, "Name and comment are required", "validation");
    }

    const cleanBody = sanitizeHtml(commentBody, {
      allowedTags: [],
      allowedAttributes: {},
    });

    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        authorName: authorName.slice(0, 120),
        authorEmail: body.authorEmail?.trim().slice(0, 200) || null,
        body: cleanBody.slice(0, 5000),
        status: "pending",
      },
    });

    return jsonOk(
      {
        ok: true,
        message: "Comment submitted for moderation.",
        id: comment.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
