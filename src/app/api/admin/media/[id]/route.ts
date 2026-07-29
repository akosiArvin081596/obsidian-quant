import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireUser(PERMISSIONS.mediaManage);
    const { id } = await ctx.params;
    const body = z
      .object({
        altText: z.string().nullable().optional(),
        caption: z.string().nullable().optional(),
        credit: z.string().nullable().optional(),
        focalX: z.number().nullable().optional(),
        focalY: z.number().nullable().optional(),
      })
      .parse(await req.json());

    const media = await prisma.media.update({
      where: { id },
      data: body,
    });
    return jsonOk({ media });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
