// Pulls the "Final Answer: <x>" line the model was instructed to end with.
// Only matches lines that *start with* the phrase (anchored) — reasoning
// text often mentions "final answer" mid-sentence on the way there, and a
// loose match would grab that instead. Falls back to the last non-empty
// line if the model never produced a properly anchored final-answer line.
export function extractFinalAnswer(text) {
  const anchored = [...text.matchAll(/^\s*final answer:\s*(.+)$/gim)];
  let raw = anchored.length ? anchored[anchored.length - 1][1] : null;

  if (!raw) {
    const loose = [...text.matchAll(/final answer:\s*(.+)/gi)];
    raw = loose.length ? loose[loose.length - 1][1] : null;
  }

  if (!raw) {
    const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    raw = lines[lines.length - 1] || text.trim();
  }

  return raw
    .trim()
    .replace(/^[*\-\s"]+|[*\s".]+$/g, "")
    .trim();
}

// Pulls the model's self-reported "Confidence: <0-100>" line (see
// REASONING_SYSTEM_PROMPT in config.js). Returns null if the model never
// produced one or it doesn't parse as a number in range — callers treat a
// null confidence as "unknown", not zero.
export function extractConfidence(text) {
  const matches = [...text.matchAll(/^\s*confidence:\s*(\d{1,3})/gim)];
  if (!matches.length) return null;
  const n = parseInt(matches[matches.length - 1][1], 10);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

// Strips the "Final Answer:" and "Confidence:" lines back out of the full
// response so the reasoning preview shown in the UI doesn't duplicate them.
// Anchored to the start of a line — reasoning text that merely *mentions*
// "final answer" mid-sentence on the way to the conclusion is left alone.
export function summarizeReasoning(text, maxLength = 280) {
  const withoutAnswerLines = text
    .replace(/^\s*final answer:.*$/gim, "")
    .replace(/^\s*confidence:.*$/gim, "")
    .trim();
  const collapsed = withoutAnswerLines.replace(/\s+/g, " ").trim();
  if (!collapsed) return text.trim().slice(0, maxLength);
  return collapsed.length > maxLength
    ? `${collapsed.slice(0, maxLength - 1).trimEnd()}…`
    : collapsed;
}

// Canonicalizes an extracted answer for grouping/comparison: numeric answers
// collapse to a bare number ("9 sheep" / "9." / "$9" -> "9"); everything else
// is lowercased and trimmed of trailing punctuation.
export function normalizeAnswer(raw) {
  if (!raw) return "";
  const cleaned = raw.replace(/[$,]/g, "").trim();
  // Only treat it as numeric if a number leads the string (e.g. "9 sheep",
  // "40 mph") — avoids misreading something like "Route 66" as the number 66.
  const leadingNumber = cleaned.match(/^-?\d+(\.\d+)?/);
  if (leadingNumber) {
    return String(parseFloat(leadingNumber[0]));
  }
  return cleaned.toLowerCase().replace(/[.!?]+$/, "").trim();
}

export function isNumericKey(key) {
  return /^-?\d+(\.\d+)?$/.test(key);
}

// Parses the judge endpoint's "Best Path: <n>" / "Reason: ..." response.
export function parseJudgeResponse(text) {
  const pathMatch = text.match(/best path:\s*(\d+)/i);
  const reasonMatch = text.match(/reason:\s*([\s\S]+)/i);
  return {
    bestPathNumber: pathMatch ? parseInt(pathMatch[1], 10) : null,
    reason: reasonMatch ? reasonMatch[1].trim() : text.trim(),
  };
}

// Parses the grader endpoint's "Correct: yes/no" / "Expected: ..." / "Note: ..." response.
export function parseGraderResponse(text) {
  const correctMatch = text.match(/correct:\s*(yes|no|true|false)/i);
  const expectedMatch = text.match(/expected:\s*(.+)/i);
  const noteMatch = text.match(/note:\s*([\s\S]+)/i);
  const correct = correctMatch ? /yes|true/i.test(correctMatch[1]) : null;
  // The model sometimes runs "Expected: ... Note: ..." onto one line instead
  // of two — cut `expected` off at a trailing "Note:" if present so it
  // doesn't swallow the note text.
  const expected = expectedMatch ? expectedMatch[1].replace(/\s*note:.*$/i, "").trim() : null;
  return {
    correct,
    expected,
    note: noteMatch ? noteMatch[1].trim().split("\n")[0] : null,
  };
}
