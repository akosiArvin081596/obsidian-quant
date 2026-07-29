import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ path: string[] }> };

function uploadsRoot() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const segments = (await ctx.params).path ?? [];
  if (!segments.length || segments.some((s) => s.includes(".."))) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Defence in depth: resolve the final path and confirm it is still inside the
  // uploads root, so an absolute segment or an encoding trick that slips past the
  // ".." check above still cannot escape the directory.
  const root = path.resolve(uploadsRoot());
  const filePath = path.resolve(root, ...segments);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
