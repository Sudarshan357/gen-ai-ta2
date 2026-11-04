// Vercel serverless function for POST /api/self-consistency. Reuses the
// exact same logic as server/index.js's Express route (used for local dev
// via `npm run dev`) — this is just the request/response adapter for
// Vercel's Node.js runtime, which parses the JSON body into `req.body` for us.
import { runSingleAndSelfConsistency } from "../server/selfConsistency.js";
import {
  TEMPERATURE,
  MIN_TEMPERATURE,
  MAX_TEMPERATURE,
  MIN_SAMPLES,
  MAX_SAMPLES,
  MODEL_IDS,
  MODEL,
} from "../server/config.js";
import { friendlyError } from "../server/httpErrors.js";
import { isRateLimited } from "../server/rateLimit.js";

export const config = {
  maxDuration: 30, // a few parallel Groq calls per request; default 10s can be tight
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (isRateLimited(req, res)) return;

  const { question, numSamples, temperature, model, adaptive } = req.body ?? {};

  if (typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "`question` is required." });
    return;
  }
  const n = Number(numSamples);
  if (!Number.isInteger(n) || n < MIN_SAMPLES || n > MAX_SAMPLES) {
    res.status(400).json({ error: `\`numSamples\` must be an integer between ${MIN_SAMPLES} and ${MAX_SAMPLES}.` });
    return;
  }
  const temp = temperature === undefined ? TEMPERATURE : Number(temperature);
  if (Number.isNaN(temp) || temp < MIN_TEMPERATURE || temp > MAX_TEMPERATURE) {
    res.status(400).json({ error: `\`temperature\` must be a number between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}.` });
    return;
  }
  const chosenModel = model === undefined ? MODEL : model;
  if (!MODEL_IDS.includes(chosenModel)) {
    res.status(400).json({ error: `\`model\` must be one of ${MODEL_IDS.join(", ")}.` });
    return;
  }

  try {
    const { single, paths, meta } = await runSingleAndSelfConsistency(question.trim(), n, temp, {
      model: chosenModel,
      adaptive: Boolean(adaptive),
    });
    res.status(200).json({ question: question.trim(), single, paths, meta });
  } catch (err) {
    console.error("self-consistency generation failed:", err);
    const { status, message } = friendlyError(err);
    res.status(status).json({ error: message });
  }
}
