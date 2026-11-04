import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { runSingleAndSelfConsistency } from "./selfConsistency.js";
import { judgeBestPath, explainDisagreement, gradeAnswer } from "./llmTasks.js";
import {
  TEMPERATURE,
  MIN_TEMPERATURE,
  MAX_TEMPERATURE,
  MIN_SAMPLES,
  MAX_SAMPLES,
  AVAILABLE_MODELS,
  MODEL_IDS,
  MODEL,
} from "./config.js";
import { friendlyError } from "./httpErrors.js";
import { rateLimit } from "./rateLimit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/models", (_req, res) => {
  res.json({ models: AVAILABLE_MODELS, defaultModel: MODEL });
});

/** Shared validation for the fields every Groq-calling route accepts. */
function parseRunOptions(body) {
  const { question, numSamples, temperature, model, adaptive } = body ?? {};

  if (typeof question !== "string" || !question.trim()) {
    return { error: "`question` is required." };
  }
  const n = Number(numSamples);
  if (!Number.isInteger(n) || n < MIN_SAMPLES || n > MAX_SAMPLES) {
    return { error: `\`numSamples\` must be an integer between ${MIN_SAMPLES} and ${MAX_SAMPLES}.` };
  }
  const temp = temperature === undefined ? TEMPERATURE : Number(temperature);
  if (Number.isNaN(temp) || temp < MIN_TEMPERATURE || temp > MAX_TEMPERATURE) {
    return { error: `\`temperature\` must be a number between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}.` };
  }
  const chosenModel = model === undefined ? MODEL : model;
  if (!MODEL_IDS.includes(chosenModel)) {
    return { error: `\`model\` must be one of ${MODEL_IDS.join(", ")}.` };
  }

  return { question: question.trim(), numSamples: n, temperature: temp, model: chosenModel, adaptive: Boolean(adaptive) };
}

app.post("/api/self-consistency", rateLimit, async (req, res) => {
  const parsed = parseRunOptions(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const { single, paths, meta } = await runSingleAndSelfConsistency(
      parsed.question,
      parsed.numSamples,
      parsed.temperature,
      { model: parsed.model, adaptive: parsed.adaptive }
    );
    res.json({ question: parsed.question, single, paths, meta });
  } catch (err) {
    console.error("self-consistency generation failed:", err);
    const { status, message } = friendlyError(err);
    res.status(status).json({ error: message });
  }
});

app.post("/api/judge", rateLimit, async (req, res) => {
  const { question, paths, model } = req.body ?? {};
  if (typeof question !== "string" || !question.trim() || !Array.isArray(paths) || paths.length < 2) {
    return res.status(400).json({ error: "`question` and at least 2 `paths` are required." });
  }
  const chosenModel = model === undefined ? MODEL : model;
  if (!MODEL_IDS.includes(chosenModel)) {
    return res.status(400).json({ error: `\`model\` must be one of ${MODEL_IDS.join(", ")}.` });
  }
  try {
    const result = await judgeBestPath(question.trim(), paths, { model: chosenModel });
    res.json(result);
  } catch (err) {
    console.error("judge call failed:", err);
    const { status, message } = friendlyError(err);
    res.status(status).json({ error: message });
  }
});

app.post("/api/explain-disagreement", rateLimit, async (req, res) => {
  const { question, paths, model } = req.body ?? {};
  if (typeof question !== "string" || !question.trim() || !Array.isArray(paths) || paths.length < 2) {
    return res.status(400).json({ error: "`question` and at least 2 `paths` are required." });
  }
  const chosenModel = model === undefined ? MODEL : model;
  if (!MODEL_IDS.includes(chosenModel)) {
    return res.status(400).json({ error: `\`model\` must be one of ${MODEL_IDS.join(", ")}.` });
  }
  try {
    const result = await explainDisagreement(question.trim(), paths, { model: chosenModel });
    res.json(result);
  } catch (err) {
    console.error("explain-disagreement call failed:", err);
    const { status, message } = friendlyError(err);
    res.status(status).json({ error: message });
  }
});

app.post("/api/grade", rateLimit, async (req, res) => {
  const { question, answer, model } = req.body ?? {};
  if (typeof question !== "string" || !question.trim() || typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({ error: "`question` and `answer` are required." });
  }
  const chosenModel = model === undefined ? MODEL : model;
  if (!MODEL_IDS.includes(chosenModel)) {
    return res.status(400).json({ error: `\`model\` must be one of ${MODEL_IDS.join(", ")}.` });
  }
  try {
    const result = await gradeAnswer(question.trim(), answer.trim(), { model: chosenModel });
    res.json(result);
  } catch (err) {
    console.error("grade call failed:", err);
    const { status, message } = friendlyError(err);
    res.status(status).json({ error: message });
  }
});

// Serve the built frontend in production (`npm run build` then `npm start`).
app.use(express.static(DIST_DIR));
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(path.join(DIST_DIR, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`ConsistAI backend listening on http://localhost:${PORT}`);
});
