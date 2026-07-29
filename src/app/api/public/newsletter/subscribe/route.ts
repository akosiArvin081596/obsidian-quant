import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, jsonError, jsonOk } from "@/lib/auth/api";

const schema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        source: body.source?.trim() || "blog",
        status: "active",
      },
      update: {
        status: "active",
        unsubscribedAt: null,
        source: body.source?.trim() || undefined,
      },
    });

    return jsonOk({ ok: true, id: subscriber.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid email", "validation"));
    }
    return jsonError(error);
  }
}
