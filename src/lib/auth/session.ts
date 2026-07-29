import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { PermissionKey } from "@/lib/auth/permissions";
import { createSessionToken, hashToken } from "@/lib/auth/password";

export const SESSION_COOKIE = "oqg_admin_session";
const SESSION_DAYS = 14;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: PermissionKey[];
};

function sessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d;
}

export async function createSession(userId: string): Promise<string> {
  const token = createSessionToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: sessionExpiry(),
    },
  });
  return token;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: sessionExpiry(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || session.user.status !== "active") {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  const roles = session.user.roles.map((ur) => ur.role.name);
  const permissions = [
    ...new Set(
      session.user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.key as PermissionKey),
      ),
    ),
  ];

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    roles,
    permissions,
  };
}

export function userHasPermission(user: AuthUser, permission: PermissionKey): boolean {
  return user.permissions.includes(permission);
}
