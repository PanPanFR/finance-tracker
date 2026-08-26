/**
 * Shared AI client for 9router (OpenAI-compatible) with Gemini fallback.
 * Endpoint: POST {baseUrl}/chat/completions
 * Auth: Authorization: Bearer <apiKey>
 */

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function getAiConfig(env?: Record<string, string | undefined>): AiConfig | null {
  const rawEnv = env ?? ({} as Record<string, string | undefined>);
  // Prefer new AI_* vars, fallback to GOOGLE_API_KEY for backwards compat
  const baseUrl =
    rawEnv.AI_BASE_URL ||
    rawEnv.AI_BASE_URL?.trim() ||
    process.env.AI_BASE_URL ||
    "https://9router.panpan.my.id/v1";

  const apiKey =
    rawEnv.AI_API_KEY ||
    rawEnv.GOOGLE_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

  const model =
    rawEnv.AI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";

  if (!apiKey) return null;

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    model,
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callChatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  opts?: { temperature?: number; max_tokens?: number }
): Promise<Response> {
  const url = `${config.baseUrl}/chat/completions`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.max_tokens ?? 512,
      stream: false,
    }),
  });
}

/** Extract text content from OpenAI-compatible response, with Gemini shape fallback */
export function extractContent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  // OpenAI shape: choices[0].message.content
  const choices = d.choices as unknown;
  if (Array.isArray(choices) && choices[0]) {
    const c0 = choices[0] as Record<string, unknown>;
    const msg = c0.message as Record<string, unknown> | undefined;
    if (msg && typeof msg.content === "string") return msg.content;
    // Some providers return choices[0].text
    if (typeof c0.text === "string") return c0.text;
  }

  // Gemini shape fallback: candidates[0].content.parts[0].text
  const candidates = d.candidates as unknown;
  if (Array.isArray(candidates) && candidates[0]) {
    const cand = candidates[0] as Record<string, unknown>;
    const content = cand.content as Record<string, unknown> | undefined;
    const parts = content?.parts as unknown;
    if (Array.isArray(parts) && parts[0]) {
      const p0 = parts[0] as Record<string, unknown>;
      if (typeof p0.text === "string") return p0.text;
    }
  }

  // Direct content string
  if (typeof d.content === "string") return d.content;

  return null;
}
