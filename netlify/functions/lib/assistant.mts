import type { AuthInfo } from "./types.mts";
import { jsonResponse, parseBody, errorResponse } from "./response.mts";
import { assistantRequestSchema } from "./validation.mts";

const extractAssistantText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim();
  }

  const output = record.output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const text = (block as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    }
  }

  return null;
};

export const handleAssistant = async (req: Request, _auth: AuthInfo, requestId: string) => {
  const parsed = await parseBody(req, assistantRequestSchema, requestId);
  if ("error" in parsed) return parsed.error;

  const openAiApiKey = parsed.data.openAiAccessToken ?? Netlify.env.get("OPENAI_API_KEY");
  if (!openAiApiKey) {
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Assistant sem credencial OpenAI",
      requestId,
      status: 500,
    });
  }

  const model = Netlify.env.get("OPENAI_CODEX_MODEL") || "codex-mini-latest";
  const history = parsed.data.history ?? [];

  const systemInstruction =
    "Você é um assistente financeiro para um app de controle PF/PJ. " +
    "Responda em português do Brasil, seja objetivo e prático, e dê recomendações acionáveis.";

  const input = [
    { role: "system", content: systemInstruction },
    ...history.map((message) => ({ role: message.role, content: message.content })),
    {
      role: "user",
      content:
        `${parsed.data.message}\n\n` +
        "Contexto do usuário: pessoa autenticada em app financeiro PF/PJ.",
    },
  ];

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      temperature: 0.3,
    }),
  });

  if (!openAiResponse.ok) {
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Assistant provider request failed",
      requestId,
      status: 502,
    });
  }

  const openAiPayload = (await openAiResponse.json()) as unknown;
  const reply = extractAssistantText(openAiPayload);
  if (!reply) {
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Assistant response was empty",
      requestId,
      status: 502,
    });
  }

  return jsonResponse({ reply });
};
