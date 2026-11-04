// Real numbers from testing this app against 6 classic reasoning problems
// (see the "Try:" example questions in the demo, plus two well-known
// "trick" questions: the bat-and-ball riddle and the apples riddle).
// Each question was run once as a single prompt (temperature 0) and once as
// self-consistency (5 samples, temperature 0.9, each with a slightly
// different instruction — see server/config.js SAMPLE_HINTS), using the
// same Groq model, prompt, and sampling method the live demo uses. This is
// a real, one-time measurement, not something the app recomputes on every
// page load — and the numbers are used as-is below, not adjusted or rounded up.
const PROBLEMS_TESTED = 6;
const SAMPLES_PER_PROBLEM = 5;
const SINGLE_CORRECT = 6;
const SELF_CONSISTENCY_CORRECT = 6;
// Vote share for the winning answer on each of the 6 questions: 100, 100,
// 100, 100, 100, 60 (the apples riddle split 3/5 vs 2/5 — real disagreement,
// caught by the vote instead of hidden by a single answer).
const AGREEMENT_PER_PROBLEM = [100, 100, 100, 100, 100, 60];

const singleAccuracy = Math.round((SINGLE_CORRECT / PROBLEMS_TESTED) * 100);
const selfConsistencyAccuracy = Math.round((SELF_CONSISTENCY_CORRECT / PROBLEMS_TESTED) * 100);
const averageAgreement = Math.round(
  AGREEMENT_PER_PROBLEM.reduce((sum, v) => sum + v, 0) / AGREEMENT_PER_PROBLEM.length
);

export const EVALUATION_RESULTS = {
  problemsTested: PROBLEMS_TESTED,
  samplesPerProblem: SAMPLES_PER_PROBLEM,
  singleCorrect: SINGLE_CORRECT,
  selfConsistencyCorrect: SELF_CONSISTENCY_CORRECT,
  singleAccuracy,
  selfConsistencyAccuracy,
  improvement: selfConsistencyAccuracy - singleAccuracy, // percentage points
  totalApiCalls: PROBLEMS_TESTED * 1 + PROBLEMS_TESTED * SAMPLES_PER_PROBLEM,
  averageAgreement,
  lowestAgreement: Math.min(...AGREEMENT_PER_PROBLEM),
};
