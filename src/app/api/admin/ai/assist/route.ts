import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { runGroqAssist, type AiAssistAction } from "@/lib/ai/groq";

const schema = z.object({
  action: z.enum(["meta_title", "meta_description", "excerpt", "outline", "improve_intro"]),
  title: z.string(),
  contentHtml: z.string(),
  focusKeyword: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireUser(PERMISSIONS.postsWrite);
    const body = schema.parse(await req.json());
    const result = await runGroqAssist({
      action: body.action as AiAssistAction,
      title: body.title,
      contentHtml: body.contentHtml,
      focusKeyword: body.focusKeyword,
    });
    return jsonOk({ result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Invalid payload", "validation"));
    }
    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return jsonError(new ApiError(503, "AI assist is not configured", "ai_unconfigured"));
    }
    return jsonError(error);
  }
}
