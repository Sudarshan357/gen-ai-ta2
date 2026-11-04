import { judgeBestPath } from "../server/llmTasks.js";
import { MODEL_IDS, MODEL } from "../server/config.js";
import { friendlyError } from "../server/httpErrors.js";
import { isRateLimited } from "../server/rateLimit.js";

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (isRateLimited(req, res)) return;

  const { question, paths, model } = req.body ?? {};
  if (typeof question !== "string" || !question.trim() || !Array.isArray(paths) || paths.length < 2) {
    res.status(400).json({ error: "`question` and at least 2 `paths` are required." });
    return;
  }
  const chosenModel = model === undefined ? MODEL : model;
  if (!MODEL_IDS.includes(chosenModel)) {
    res.status(400).json({ error: `\`model\` must be one of ${MODEL_IDS.join(", ")}.` });
    return;
  }

  try {
    const result = await judgeBestPath(question.trim(), paths, { model: chosenModel });
    res.status(200).json(result);
  } catch (err) {
    console.error("judge call failed:", err);
    const { status, message } = friendlyError(err);
    res.status(status).json({ error: message });
  }
}
