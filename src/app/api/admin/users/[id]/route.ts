import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/blog/audit";

const userSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
  roles: { include: { role: { select: { id: true, name: true } } } },
} as const;

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  status: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  roles: { role: { id: string; name: string } }[];
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
  };
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requireUser(PERMISSIONS.usersManage);
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new ApiError(404, "User not found", "not_found");
    return jsonOk({ user: serializeUser(user) });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  bio: z.string().nullable().optional(),
  roleIds: z.array(z.string()).min(1).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireUser(PERMISSIONS.usersManage);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const before = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!before) throw new ApiError(404, "User not found", "not_found");

    if (body.status === "disabled" && actor.id === id) {
      throw new ApiError(400, "Cannot disable your own account", "self_disable");
    }

    if (body.email) {
      const email = body.email.toLowerCase();
      const dup = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (dup) throw new ApiError(409, "Email already in use", "duplicate_email");
    }

    const passwordHash = body.password ? await hashPassword(body.password) : undefined;

    if (body.roleIds) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.createMany({
        data: body.roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        email: body.email?.toLowerCase(),
        status: body.status,
        bio: body.bio === undefined ? undefined : body.bio,
        passwordHash,
      },
      select: userSelect,
    });

    if (body.status === "disabled") {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    await writeAuditLog({
      userId: actor.id,
      action: "user.update",
      entityType: "user",
      entityId: id,
      before: serializeUser(before),
      after: serializeUser(user),
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ user: serializeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
