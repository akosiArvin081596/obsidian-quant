const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type AiAssistAction =
  | "meta_title"
  | "meta_description"
  | "excerpt"
  | "outline"
  | "improve_intro";

const ACTION_PROMPTS: Record<AiAssistAction, string> = {
  meta_title:
    "Write a concise SEO meta title (max 60 characters) for this blog post. Return only the title text, no quotes.",
  meta_description:
    "Write an SEO meta description (max 155 characters) for this blog post. Return only the description text.",
  excerpt:
    "Write a compelling 1–2 sentence excerpt for this blog post. Return only the excerpt text.",
  outline:
    "Suggest a structured outline (H2/H3 headings only, markdown format) for this blog post topic.",
  improve_intro:
    "Improve the opening paragraph of this blog post for clarity and engagement. Return only the improved paragraph.",
};

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export async function runGroqAssist(input: {
  action: AiAssistAction;
  title: string;
  contentHtml: string;
  focusKeyword?: string | null;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const plain = input.contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const context = [
    `Title: ${input.title || "Untitled"}`,
    input.focusKeyword ? `Focus keyword: ${input.focusKeyword}` : null,
    plain ? `Body excerpt: ${plain.slice(0, 4000)}` : "Body: (empty)",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL,
      temperature: 0.4,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "You are an editorial assistant for a quantitative finance blog. Be precise, professional, and avoid hype.",
        },
        {
          role: "user",
          content: `${ACTION_PROMPTS[input.action]}\n\n${context}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Groq");
  return text;
}
