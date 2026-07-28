import { NextResponse } from "next/server";
import { getCurrentUser, userHasPermission, type AuthUser } from "@/lib/auth/session";
import type { PermissionKey } from "@/lib/auth/permissions";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.status },
    );
  }

  // Surface DB connectivity issues clearly in development (e.g. wrong port / down Postgres).
  const prismaCode =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";
  if (
    process.env.NODE_ENV === "development" &&
    (prismaCode.startsWith("P1") || prismaCode.startsWith("P2"))
  ) {
    const message =
      error instanceof Error ? error.message : "Database error";
    console.error(error);
    return NextResponse.json(
      {
        error: {
          message: `Database unavailable (${prismaCode}): ${message}. Check DATABASE_URL and that Docker Postgres is running (host port 5433).`,
          code: prismaCode,
        },
      },
      { status: 503 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { message: "Internal server error", code: "internal" } },
    { status: 500 },
  );
}

export async function requireUser(permission?: PermissionKey): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Authentication required", "unauthorized");
  }
  if (permission && !userHasPermission(user, permission)) {
    throw new ApiError(403, "Insufficient permission", "forbidden");
  }
  return user;
}
