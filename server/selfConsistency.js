import { callGroq } from "./groqClient.js";
import {
  extractFinalAnswer,
  extractConfidence,
  normalizeAnswer,
  summarizeReasoning,
  isNumericKey,
} from "./textUtils.js";
import {
  MODEL,
  MAX_TOKENS_PER_SAMPLE,
  REASONING_SYSTEM_PROMPT,
  SAMPLE_HINTS,
  ADAPTIVE_BATCH_SIZE,
  ADAPTIVE_MIN_SAMPLES,
  ADAPTIVE_AGREEMENT_THRESHOLD,
} from "./config.js";

const emptyUsage = () => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });

/** Adds b's token counts into a (in place) — null-safe since usage fields can come back null. */
function addUsage(a, b) {
  if (!b) return a;
  a.promptTokens += b.promptTokens || 0;
  a.completionTokens += b.completionTokens || 0;
  a.totalTokens += b.totalTokens || 0;
  return a;
}

/** Fires a single independent sample of the same prompt at the given temperature. */
export async function generateSample(question, temperature, { retries = 1, model = MODEL } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await callGroq({
        model,
        temperature,
        maxTokens: MAX_TOKENS_PER_SAMPLE,
        messages: [
          { role: "system", content: REASONING_SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
      });
    } catch (err) {
      const retryable = err?.status === 429 || err?.status >= 500;
      if (retryable && attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Groups raw sample results into display-ready reasoning paths: answers are
 * normalized so equivalent phrasings ("9", "9 sheep", "9.") land in the same
 * vote group and render with one shared, consistent display value.
 */
export function buildPaths(samples, { startIndex = 0 } = {}) {
  const extracted = samples.map((s) => {
    const rawAnswer = extractFinalAnswer(s.text);
    return {
      reasoning: summarizeReasoning(s.text),
      rawAnswer,
      key: normalizeAnswer(rawAnswer),
      confidence: extractConfidence(s.text),
      durationMs: s.durationMs,
      usage: s.usage,
    };
  });

  const representative = new Map();
  for (const e of extracted) {
    if (!representative.has(e.key)) {
      representative.set(e.key, isNumericKey(e.key) ? e.key : e.rawAnswer || e.key);
    }
  }

  return extracted.map((e, i) => ({
    id: `path-${startIndex + i + 1}`,
    pathNumber: startIndex + i + 1,
    reasoning: e.reasoning,
    answer: representative.get(e.key),
    confidence: e.confidence,
    durationMs: e.durationMs,
    usage: e.usage,
  }));
}

/** Leading answer's share of the vote so far, by raw sample count (not confidence-weighted). */
function leadingShare(paths) {
  if (paths.length === 0) return 0;
  const tally = new Map();
  for (const p of paths) tally.set(p.answer, (tally.get(p.answer) || 0) + 1);
  const top = Math.max(...tally.values());
  return top / paths.length;
}

/**
 * Generates up to `maxSamples` independent reasoning paths for `question` at
 * the given temperature, in parallel. Individual sample failures are
 * dropped (not retried into the result) as long as at least one sample in
 * the run succeeds. Each sample gets a slightly different instruction
 * appended to the question (see SAMPLE_HINTS) so the calls are genuinely
 * independent attempts, not just re-rolls of the same exact prompt.
 */
export async function generateReasoningPaths(question, maxSamples, temperature, { model = MODEL } = {}) {
  const settled = await Promise.allSettled(
    Array.from({ length: maxSamples }, (_, i) => {
      const hint = SAMPLE_HINTS[i % SAMPLE_HINTS.length];
      return generateSample(`${question}\n\n${hint}`, temperature, { model });
    })
  );

  const samples = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const failedCount = settled.length - samples.length;

  if (samples.length === 0) {
    const firstError = settled.find((r) => r.status === "rejected");
    throw firstError ? firstError.reason : new Error("All samples failed");
  }

  return { paths: buildPaths(samples), failedCount, requested: maxSamples };
}

/**
 * Same as generateReasoningPaths, but runs in small batches and stops early
 * once the leading answer's share of the votes so far clears
 * ADAPTIVE_AGREEMENT_THRESHOLD (and at least ADAPTIVE_MIN_SAMPLES have run) —
 * trading a slightly less certain stopping point for fewer API calls when
 * the model is already consistently agreeing with itself.
 */
export async function generateReasoningPathsAdaptive(question, maxSamples, temperature, { model = MODEL } = {}) {
  let allPaths = [];
  let failedCount = 0;
  let stoppedEarly = false;

  while (allPaths.length < maxSamples) {
    const batchSize = Math.min(ADAPTIVE_BATCH_SIZE, maxSamples - allPaths.length);
    const startIndex = allPaths.length;
    const settled = await Promise.allSettled(
      Array.from({ length: batchSize }, (_, i) => {
        const idx = startIndex + i;
        const hint = SAMPLE_HINTS[idx % SAMPLE_HINTS.length];
        return generateSample(`${question}\n\n${hint}`, temperature, { model });
      })
    );

    const samples = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
    failedCount += settled.length - samples.length;
    allPaths = allPaths.concat(buildPaths(samples, { startIndex }));

    if (allPaths.length >= ADAPTIVE_MIN_SAMPLES && leadingShare(allPaths) >= ADAPTIVE_AGREEMENT_THRESHOLD) {
      stoppedEarly = allPaths.length < maxSamples;
      break;
    }
  }

  if (allPaths.length === 0) {
    throw new Error("All samples failed");
  }

  return { paths: allPaths, failedCount, requested: maxSamples, stoppedEarly, used: allPaths.length };
}

/**
 * Runs both halves of the demo for one question: a single deterministic
 * call (temperature 0 — the normal, one-shot way of using an LLM) and the
 * self-consistency samples, in parallel. `adaptive` switches the
 * self-consistency half to generateReasoningPathsAdaptive.
 */
export async function runSingleAndSelfConsistency(
  question,
  numSamples,
  temperature,
  { model = MODEL, adaptive = false } = {}
) {
  const [singleResult, pathsResult] = await Promise.all([
    generateSample(question, 0, { model }),
    adaptive
      ? generateReasoningPathsAdaptive(question, numSamples, temperature, { model })
      : generateReasoningPaths(question, numSamples, temperature, { model }),
  ]);

  const single = {
    reasoning: summarizeReasoning(singleResult.text),
    answer: extractFinalAnswer(singleResult.text),
    confidence: extractConfidence(singleResult.text),
    durationMs: singleResult.durationMs,
    usage: singleResult.usage,
  };

  const usageTotal = addUsage(emptyUsage(), singleResult.usage);
  for (const p of pathsResult.paths) addUsage(usageTotal, p.usage);

  return {
    single,
    paths: pathsResult.paths,
    meta: {
      model,
      failedCount: pathsResult.failedCount,
      requested: pathsResult.requested,
      adaptive,
      stoppedEarly: pathsResult.stoppedEarly ?? false,
      usageTotal,
    },
  };
}
