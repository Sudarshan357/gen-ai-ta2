// Client for the self-consistency backend (see server/index.js). One request
// runs both halves of the demo for the same question: a single deterministic
// call, and `numSamples` independent self-consistency samples.
export async function runSelfConsistency({ question, numSamples, temperature, model, adaptive }) {
  const res = await fetch("/api/self-consistency", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, numSamples, temperature, model, adaptive }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  const data = await res.json();
  return { question: data.question, single: data.single, paths: data.paths, meta: data.meta };
}

/** Fetches the list of models the backend will accept (see /api/models). */
export async function fetchModels() {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error(`Could not load model list (${res.status})`);
  return res.json();
}

/** Asks the backend for a second-opinion pick of the soundest reasoning path. */
export async function judgeBestPath({ question, paths, model }) {
  const res = await fetch("/api/judge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, paths, model }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/** Asks the backend to explain why independent paths landed on different answers. */
export async function explainDisagreement({ question, paths, model }) {
  const res = await fetch("/api/explain-disagreement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, paths, model }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/** LLM-as-judge grading for custom questions with no locally-known answer. */
export async function gradeAnswer({ question, answer, model }) {
  const res = await fetch("/api/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, model }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// Mirrors server/textUtils.js normalizeAnswer exactly, so a preset's known
// answer can be exact-matched against a live result without a network
// round trip. Kept in sync deliberately rather than shared via import,
// since the client bundle shouldn't pull in server-only modules.
export function normalizeAnswer(raw) {
  if (!raw) return "";
  const cleaned = String(raw).replace(/[$,]/g, "").trim();
  const leadingNumber = cleaned.match(/^-?\d+(\.\d+)?/);
  if (leadingNumber) return String(parseFloat(leadingNumber[0]));
  return cleaned.toLowerCase().replace(/[.!?]+$/, "").trim();
}

/** Tally answers across paths and compute the majority-vote result (equal weight per sample). */
function computeMajorityVotes(paths) {
  const tally = new Map();
  for (const p of paths) {
    tally.set(p.answer, (tally.get(p.answer) || 0) + 1);
  }
  const entries = Array.from(tally.entries())
    .map(([answer, votes]) => ({ answer, votes, weight: votes }))
    .sort((a, b) => b.votes - a.votes);

  const total = paths.length;
  const winner = entries[0];
  const confidence = total > 0 ? Math.round((winner.votes / total) * 100) : 0;

  return {
    strategy: "majority",
    entries,
    total,
    totalWeight: total,
    winner: winner?.answer ?? null,
    winnerVotes: winner?.votes ?? 0,
    confidence,
  };
}

/**
 * Weights each path's vote by its own self-reported confidence (see
 * server/config.js's REASONING_SYSTEM_PROMPT — the model states a 0-100
 * confidence alongside its final answer). Paths with no parsed confidence
 * fall back to a neutral weight of 50 so one malformed response doesn't
 * zero out an otherwise-reasonable answer.
 */
function computeConfidenceWeightedVotes(paths) {
  const tally = new Map();
  for (const p of paths) {
    const weight = typeof p.confidence === "number" ? p.confidence : 50;
    const prev = tally.get(p.answer) || { votes: 0, weight: 0 };
    tally.set(p.answer, { votes: prev.votes + 1, weight: prev.weight + weight });
  }
  const entries = Array.from(tally.entries())
    .map(([answer, { votes, weight }]) => ({ answer, votes, weight }))
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const winner = entries[0];
  const confidence = totalWeight > 0 ? Math.round((winner.weight / totalWeight) * 100) : 0;

  return {
    strategy: "confidence",
    entries,
    total: paths.length,
    totalWeight,
    winner: winner?.answer ?? null,
    winnerVotes: winner?.votes ?? 0,
    confidence,
  };
}

/**
 * Computes a vote result for the given strategy. "judge" is handled
 * separately (it needs a network call — see judgeBestPath above) and isn't
 * produced by this function; callers build its display-equivalent result
 * from the judge response directly.
 */
export function computeVotes(paths, strategy = "majority") {
  if (strategy === "confidence") return computeConfidenceWeightedVotes(paths);
  return computeMajorityVotes(paths);
}

/** Builds a vote-result shape from a judge response, for display alongside majority/confidence results. */
export function judgeResultToVote(judgeResponse, paths) {
  const majority = computeMajorityVotes(paths);
  return {
    strategy: "judge",
    entries: majority.entries,
    total: paths.length,
    totalWeight: majority.totalWeight,
    winner: judgeResponse.answer,
    winnerVotes: paths.filter((p) => p.answer === judgeResponse.answer).length,
    confidence: 100,
    judgePathNumber: judgeResponse.pathNumber,
    judgeReason: judgeResponse.reason,
  };
}

// ---- Difficulty heuristic (purely a UI suggestion, never auto-applied) ----

const MULTI_STEP_WORDS = [
  "then", "after", "remaining", "remainder", "left", "next", "each",
  "total", "percent", "%", "fraction", "ratio", "average", "per",
];

/**
 * Rough heuristic for how many samples a question "deserves" — longer,
 * multi-clause questions with several numeric steps tend to benefit more
 * from extra samples than a one-step arithmetic question. This is a
 * suggestion surfaced in the UI, not something the app decides for the
 * user or treats as authoritative.
 */
export function suggestSampleCount(question) {
  const text = question.toLowerCase();
  const numberCount = (text.match(/\d+(\.\d+)?/g) || []).length;
  const wordHits = MULTI_STEP_WORDS.filter((w) => text.includes(w)).length;
  const clauseCount = (text.match(/[.;]/g) || []).length;

  const score = numberCount + wordHits + clauseCount;
  if (score >= 7) return 9;
  if (score >= 4) return 7;
  if (score >= 2) return 5;
  return 3;
}

// ---- Share links ----

/** Encodes the run's settings (not results — those get regenerated) into a URL hash. */
export function buildShareUrl({ question, numSamples, temperature, model, votingStrategy, adaptive }) {
  const payload = { q: question, n: numSamples, t: temperature, m: model, v: votingStrategy, a: adaptive };
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  const url = new URL(window.location.href);
  url.hash = `run=${encoded}`;
  return url.toString();
}

/** Reads a shared run's settings back out of the current URL hash, if present. */
export function parseShareFromLocation() {
  const match = window.location.hash.match(/run=([^&]+)/);
  if (!match) return null;
  try {
    const payload = JSON.parse(decodeURIComponent(atob(match[1])));
    return {
      question: payload.q,
      numSamples: payload.n,
      temperature: payload.t,
      model: payload.m,
      votingStrategy: payload.v,
      adaptive: payload.a,
    };
  } catch {
    return null;
  }
}

// ---- Export ----

export function runToMarkdown({ question, single, paths, voteResult, meta }) {
  const lines = [
    `# Self-Consistency Run`,
    ``,
    `**Question:** ${question}`,
    ``,
    `## Single Prompt (baseline)`,
    ``,
    `Answer: \`${single?.answer ?? "n/a"}\``,
    ``,
    single?.reasoning ? `> ${single.reasoning}` : "",
    ``,
    `## Independent Reasoning Paths (${paths.length})`,
    ``,
  ];
  paths.forEach((p) => {
    lines.push(`### Path ${p.pathNumber} — \`${p.answer}\`${p.confidence != null ? ` (confidence: ${p.confidence})` : ""}`);
    lines.push(``);
    lines.push(`> ${p.reasoning}`);
    lines.push(``);
  });
  if (voteResult) {
    lines.push(`## Vote Result (${voteResult.strategy})`);
    lines.push(``);
    lines.push(`Winner: \`${voteResult.winner}\` — ${voteResult.confidence}% confidence (${voteResult.winnerVotes}/${voteResult.total})`);
    if (voteResult.judgeReason) lines.push(`Judge's reasoning: ${voteResult.judgeReason}`);
  }
  if (meta) {
    lines.push(``);
    lines.push(`---`);
    lines.push(`Model: ${meta.model} · Samples used: ${paths.length}/${meta.requested}${meta.stoppedEarly ? " (stopped early)" : ""} · Tokens: ${meta.usageTotal?.totalTokens ?? "n/a"}`);
  }
  return lines.filter((l) => l !== "").join("\n").replace(/\n{3,}/g, "\n\n");
}

export function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- History (per-browser, localStorage) ----

const HISTORY_KEY = "consistai:history";
const HISTORY_LIMIT = 20;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushHistory(entry) {
  try {
    const existing = loadHistory();
    const next = [{ ...entry, id: `${Date.now()}`, timestamp: Date.now() }, ...existing].slice(0, HISTORY_LIMIT);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadHistory();
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore — storage may be unavailable (private browsing, etc.)
  }
}
