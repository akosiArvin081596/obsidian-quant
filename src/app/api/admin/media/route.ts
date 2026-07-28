import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED = new Set([...IMAGE_TYPES, ...VIDEO_TYPES]);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function uploadsRoot() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

export async function GET(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.mediaManage);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const media = await prisma.media.findMany({
      where: q
        ? {
            OR: [
              { originalName: { contains: q, mode: "insensitive" } },
              { altText: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ media });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(PERMISSIONS.mediaManage);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "file is required", "validation");
    }
    if (!ALLOWED.has(file.type)) {
      throw new ApiError(
        400,
        "Unsupported file type. Use JPEG/PNG/WebP/AVIF images or MP4/WebM/MOV videos.",
        "validation",
      );
    }

    const isVideo = VIDEO_TYPES.has(file.type);
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      throw new ApiError(
        400,
        isVideo ? "Video too large (max 50MB)" : "Image too large (max 8MB)",
        "validation",
      );
    }

    const ext = EXT_BY_MIME[file.type] ?? "bin";
    const storageKey = `${new Date().toISOString().slice(0, 10)}/${randomBytes(12).toString("hex")}.${ext}`;
    const dest = path.join(uploadsRoot(), storageKey);
    await mkdir(path.dirname(dest), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buffer);

    const altText = String(form.get("altText") ?? "") || null;
    const media = await prisma.media.create({
      data: {
        storageKey,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        altText,
        uploadedById: user.id,
      },
    });

    return jsonOk({ media }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
