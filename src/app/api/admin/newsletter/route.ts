import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.settingsManage);
    const status = req.nextUrl.searchParams.get("status") ?? "";
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: status ? { status: status as "active" | "unsubscribed" } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const summary = {
      active: await prisma.newsletterSubscriber.count({ where: { status: "active" } }),
      unsubscribed: await prisma.newsletterSubscriber.count({ where: { status: "unsubscribed" } }),
    };
    return jsonOk({
      summary,
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        status: s.status,
        source: s.source,
        createdAt: s.createdAt.toISOString(),
        unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
