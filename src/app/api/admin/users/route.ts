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

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.usersManage);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: userSelect,
      orderBy: { name: "asc" },
      take: 200,
    });
    const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
    return jsonOk({
      users: users.map(serializeUser),
      roles: roles.map((r) => ({ id: r.id, name: r.name })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleIds: z.array(z.string()).min(1),
  bio: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireUser(PERMISSIONS.usersManage);
    const body = createSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "Email already in use", "duplicate_email");
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email,
        passwordHash,
        bio: body.bio?.trim() || null,
        roles: { create: body.roleIds.map((roleId) => ({ roleId })) },
      },
      select: userSelect,
    });

    await writeAuditLog({
      userId: actor.id,
      action: "user.create",
      entityType: "user",
      entityId: user.id,
      after: serializeUser(user),
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}
