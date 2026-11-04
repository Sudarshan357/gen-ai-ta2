// Secondary Groq calls that aren't part of the core sample-and-vote flow:
// a judge that picks the soundest reasoning path, an explainer for why
// paths disagreed, and a grader for free-text questions that don't have a
// locally-known reference answer. Kept separate from selfConsistency.js
// since these are "second opinion" calls, not samples that get voted on.
import { callGroq } from "./groqClient.js";
import { parseJudgeResponse, parseGraderResponse } from "./textUtils.js";
import {
  MODEL,
  JUDGE_SYSTEM_PROMPT,
  DISAGREEMENT_SYSTEM_PROMPT,
  GRADER_SYSTEM_PROMPT,
} from "./config.js";

/** Asks the model to pick which of several reasoning paths holds up best. */
export async function judgeBestPath(question, paths, { model = MODEL } = {}) {
  const transcript = paths
    .map((p) => `Path ${p.pathNumber}:\nReasoning: ${p.reasoning}\nFinal Answer: ${p.answer}`)
    .join("\n\n");

  const result = await callGroq({
    model,
    temperature: 0,
    maxTokens: 200,
    messages: [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      { role: "user", content: `Question: ${question}\n\n${transcript}` },
    ],
  });

  const { bestPathNumber, reason } = parseJudgeResponse(result.text);
  const chosen = paths.find((p) => p.pathNumber === bestPathNumber) ?? null;

  return {
    pathNumber: chosen?.pathNumber ?? null,
    answer: chosen?.answer ?? null,
    reason,
    usage: result.usage,
    durationMs: result.durationMs,
  };
}

/** Asks the model to explain, in plain terms, why independent paths landed on different answers. */
export async function explainDisagreement(question, paths, { model = MODEL } = {}) {
  const transcript = paths
    .map((p) => `Path ${p.pathNumber} (answer: ${p.answer}):\n${p.reasoning}`)
    .join("\n\n");

  const result = await callGroq({
    model,
    temperature: 0,
    maxTokens: 220,
    messages: [
      { role: "system", content: DISAGREEMENT_SYSTEM_PROMPT },
      { role: "user", content: `Question: ${question}\n\n${transcript}` },
    ],
  });

  return { explanation: result.text.trim(), usage: result.usage, durationMs: result.durationMs };
}

/**
 * Grades a candidate answer with an LLM-as-judge call. Used only for
 * free-text questions that have no locally-known reference answer (presets
 * ship with one — see src/data/presetProblems.js and the exact-match check
 * in src/lib/selfConsistencyEngine.js) — this is a second model's opinion,
 * not ground truth, and the UI labels it that way.
 */
export async function gradeAnswer(question, answer, { model = MODEL } = {}) {
  const result = await callGroq({
    model,
    temperature: 0,
    maxTokens: 150,
    messages: [
      { role: "system", content: GRADER_SYSTEM_PROMPT },
      { role: "user", content: `Question: ${question}\nCandidate answer: ${answer}` },
    ],
  });

  const { correct, expected, note } = parseGraderResponse(result.text);
  return { correct, expected, note, usage: result.usage, durationMs: result.durationMs };
}
