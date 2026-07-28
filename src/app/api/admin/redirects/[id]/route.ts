import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ensureTrailingSlash } from "@/lib/blog/slug";
import { writeAuditLog } from "@/lib/blog/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.redirectsManage);
    const { id } = await ctx.params;
    const body = z
      .object({
        destinationUrl: z.string().min(1).optional(),
        statusCode: z.number().int().optional(),
        active: z.boolean().optional(),
      })
      .parse(await req.json());

    const redirect = await prisma.redirect.update({
      where: { id },
      data: {
        ...(body.destinationUrl !== undefined
          ? {
              destinationUrl: body.destinationUrl.startsWith("http")
                ? body.destinationUrl
                : ensureTrailingSlash(
                    body.destinationUrl.startsWith("/")
                      ? body.destinationUrl
                      : `/${body.destinationUrl}`,
                  ),
            }
          : {}),
        ...(body.statusCode !== undefined ? { statusCode: body.statusCode } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "redirect.update",
      entityType: "redirect",
      entityId: id,
      after: body,
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ redirect });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(PERMISSIONS.redirectsManage);
    const { id } = await ctx.params;
    await prisma.redirect.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id,
      action: "redirect.delete",
      entityType: "redirect",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for"),
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
