import "dotenv/config";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export class GroqError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

/**
 * Fires one chat completion against the Groq API. Returns the response
 * text plus real usage/timing — these feed the resource-usage panel in the
 * UI, so they come straight from Groq's response rather than being
 * estimated client-side.
 */
export async function callGroq({ model, messages, temperature, maxTokens }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError("Missing GROQ_API_KEY", 401);
  }

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_completion_tokens: maxTokens,
      }),
    });
  } catch (err) {
    throw new GroqError(`Could not reach the Groq API: ${err.message}`, 502);
  }

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      // response wasn't JSON — leave body null
    }
    const message = body?.error?.message || `Groq API error (${response.status})`;
    throw new GroqError(message, response.status);
  }

  const data = await response.json();
  const durationMs = Date.now() - startedAt;
  const message = data?.choices?.[0]?.message;
  // Reasoning models (e.g. openai/gpt-oss-20b on Groq) return their
  // step-by-step thinking in a separate `reasoning` field, with `content`
  // holding just the final "Final Answer: ..." line — combine them so the
  // UI has the full reasoning trace to show, not just the answer.
  const text = [message?.reasoning, message?.content].filter(Boolean).join("\n").trim();
  if (!text) {
    throw new GroqError("The Groq API returned an empty response.", 502);
  }

  return {
    text,
    durationMs,
    usage: {
      promptTokens: data?.usage?.prompt_tokens ?? null,
      completionTokens: data?.usage?.completion_tokens ?? null,
      totalTokens: data?.usage?.total_tokens ?? null,
    },
  };
}
