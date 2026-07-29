import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ensureTrailingSlash } from "@/lib/blog/slug";
import { writeAuditLog } from "@/lib/blog/audit";

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.redirectsManage);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const redirects = await prisma.redirect.findMany({
      where: q
        ? {
            OR: [
              { sourcePath: { contains: q, mode: "insensitive" } },
              { destinationUrl: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      take: 200,
    });
    return jsonOk({ redirects });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.redirectsManage);
    const body = z
      .object({
        sourcePath: z.string().min(1),
        destinationUrl: z.string().min(1),
        statusCode: z.number().int().optional(),
        active: z.boolean().optional(),
      })
      .parse(await req.json());

    const sourcePath = ensureTrailingSlash(
      body.sourcePath.startsWith("/") ? body.sourcePath : `/${body.sourcePath}`,
    );
    const destinationUrl = body.destinationUrl.startsWith("http")
      ? body.destinationUrl
      : ensureTrailingSlash(
          body.destinationUrl.startsWith("/")
            ? body.destinationUrl
            : `/${body.destinationUrl}`,
        );

    if (sourcePath === destinationUrl || sourcePath === ensureTrailingSlash(destinationUrl)) {
      throw new ApiError(400, "Redirect source and destination must differ", "validation");
    }

    const redirect = await prisma.redirect.upsert({
      where: { sourcePath },
      create: {
        sourcePath,
        destinationUrl,
        statusCode: body.statusCode ?? 301,
        active: body.active ?? true,
        createdById: user.id,
      },
      update: {
        destinationUrl,
        statusCode: body.statusCode ?? 301,
        active: body.active ?? true,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "redirect.upsert",
      entityType: "redirect",
      entityId: redirect.id,
      after: { sourcePath, destinationUrl },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ redirect }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
