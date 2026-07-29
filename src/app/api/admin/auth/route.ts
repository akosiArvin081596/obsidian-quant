import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk } from "@/lib/auth/api";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getCurrentUser,
  getSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/blog/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user || user.status !== "active") {
      throw new ApiError(401, "Invalid email or password", "invalid_credentials");
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      throw new ApiError(401, "Invalid email or password", "invalid_credentials");
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);
    await writeAuditLog({
      userId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles.map((r) => r.role.name),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    return jsonError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getSessionToken();
    const user = await getCurrentUser();
    await destroySession(token);
    await clearSessionCookie();
    if (user) {
      await writeAuditLog({
        userId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: user.id,
        ipAddress: req.headers.get("x-forwarded-for"),
      });
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonOk({ user: null });
    }
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
