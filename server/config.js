// Settings for the self-consistency backend.

// Models actually live on this Groq account right now (checked against
// GET /openai/v1/models) — kept short and curated rather than listing every
// id Groq hosts, since several of those are audio/guard/non-chat models.
// Override the one used for a single run with the `model` field in the
// request body; this is just the default + the allow-list.
export const AVAILABLE_MODELS = [
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    description: "Smaller and fastest — the original default.",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    description: "Larger, generally stronger reasoning, slower per call.",
  },
  {
    id: "qwen/qwen3.8-27b",
    label: "Qwen3 27B",
    description: "Different model family, useful as a cross-check.",
  },
];
export const MODEL_IDS = AVAILABLE_MODELS.map((m) => m.id);
export const MODEL = process.env.GROQ_MODEL || AVAILABLE_MODELS[0].id;

// Generous enough that the "verify"/"double-check" style hints below don't
// get the model truncated mid-thought before it reaches its Final Answer line.
export const MAX_TOKENS_PER_SAMPLE = 450;

// Temperature controls how much the model's answers vary between samples.
// 0.9 is high enough that independent samples genuinely diverge in wording
// and approach, instead of all converging on nearly the same phrasing.
// Exposed to the client as a slider between these bounds.
export const TEMPERATURE = 0.9;
export const MIN_TEMPERATURE = 0.2;
export const MAX_TEMPERATURE = 1.3;

// How many independent samples a self-consistency run can request. The UI
// exposes this as a slider rather than a fixed {3,5,7} choice.
export const MIN_SAMPLES = 2;
export const MAX_SAMPLES = 9;
export const DEFAULT_SAMPLES = 5;

// Adaptive sampling: run in small batches and stop once the leading answer's
// vote share clears the threshold, instead of always spending the full
// requested sample budget.
export const ADAPTIVE_BATCH_SIZE = 2;
export const ADAPTIVE_MIN_SAMPLES = 3;
export const ADAPTIVE_AGREEMENT_THRESHOLD = 0.8;

// Appended to the question for each self-consistency sample, one per index
// (cycling if numSamples ever exceeds this list). Nudging each call toward a
// slightly different framing — on top of the higher temperature — is what
// makes the samples genuinely independent reasoning attempts rather than
// near-duplicates of the same completion.
export const SAMPLE_HINTS = [
  "Solve independently using your own approach.",
  "Try a different approach.",
  "Check carefully for common mistakes.",
  "Solve step by step and verify the result.",
  "Use an alternative reasoning approach.",
  "Reconsider the problem from scratch before answering.",
  "Work through it carefully, double-checking each step.",
  "Try solving it backwards from a guessed answer to verify.",
  "Re-read the question carefully before solving.",
];

// Every sample (single-prompt or self-consistency) ends with both a Final
// Answer line and a self-reported Confidence line. The confidence number is
// the model's own estimate, not a measured probability — it's used for the
// "confidence-weighted" voting strategy and shown as-is, not treated as
// ground truth.
export const REASONING_SYSTEM_PROMPT = `You are solving a short reasoning or word problem. Always write out your step-by-step reasoning in 2-4 full sentences before answering — never skip straight to the answer, and never reply with just a single word like "Yes" or "9". Then finish with exactly these two lines, in this order, each on its own line:
Final Answer: <answer>
Confidence: <0-100>

Rules for <answer>:
- State only the final value itself — a number, short phrase, or name.
- Do not repeat units, restate the question, or add extra commentary after it.
- Do not wrap it in markdown, quotes, or a full sentence.

Rules for <0-100>:
- Your own honest estimate of how likely this answer is correct, as a plain integer with no % sign.`;

// System prompt for the judge endpoint: given a question and the distinct
// reasoning paths produced, pick the one whose reasoning is most sound.
// This is a second opinion from the same kind of model, not a human-verified
// ground truth — framed that way in the UI.
export const JUDGE_SYSTEM_PROMPT = `You are reviewing several independent attempts at the same reasoning problem. Read each attempt's reasoning and final answer, decide which attempt reasoned most soundly (not necessarily the most common answer), and respond in exactly this format:
Best Path: <path number>
Reason: <one or two sentences on why that path's reasoning holds up best>`;

// System prompt for the disagreement-explanation endpoint: given a question
// and paths that landed on different final answers, explain why.
export const DISAGREEMENT_SYSTEM_PROMPT = `You are given a reasoning question and several independent attempts at it that disagree on the final answer. In 2-4 sentences, explain what specifically causes the disagreement — an ambiguity in the question, a step where approaches diverge, or a common mistake one group is making. Be concrete about which step the paths part ways on.`;

// System prompt for the free-text grading endpoint: used only when a
// question has no locally-known reference answer (presets ship with one in
// src/data/presetProblems.js) — an LLM-as-judge check, not a hardcoded key.
export const GRADER_SYSTEM_PROMPT = `You are grading whether a candidate final answer correctly answers a reasoning question. Work out the correct answer yourself first, then compare. Respond in exactly this format:
Correct: <yes/no>
Expected: <the correct answer, stated plainly>
Note: <one short sentence of justification>`;
