import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.postsRead);
    const status = req.nextUrl.searchParams.get("status") ?? "pending";
    const comments = await prisma.comment.findMany({
      where: status === "all" ? undefined : { status: status as "pending" },
      include: {
        post: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const summary = {
      pending: await prisma.comment.count({ where: { status: "pending" } }),
      approved: await prisma.comment.count({ where: { status: "approved" } }),
      rejected: await prisma.comment.count({ where: { status: "rejected" } }),
      spam: await prisma.comment.count({ where: { status: "spam" } }),
    };

    return jsonOk({
      summary,
      comments: comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        body: c.body,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        post: c.post,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
