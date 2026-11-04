import { Target, Vote, TrendingUp } from "lucide-react";
import Reveal from "./ui/Reveal.jsx";
import CategoryBarChart from "./charts/CategoryBarChart.jsx";
import { EVALUATION_RESULTS } from "../data/evaluationResults.js";

const METRICS = [
  { key: "singleAccuracy", label: "Single Prompt Accuracy", icon: Target, tone: "text-body" },
  { key: "selfConsistencyAccuracy", label: "Self-Consistency Accuracy", icon: Vote, tone: "text-primary" },
  { key: "improvement", label: "Accuracy Improvement", icon: TrendingUp, tone: "text-success", signed: true },
];

/** Tab-panel content for the "Accuracy" tab of EvaluationSection — a real, one-time measurement, not a live recomputation. */
export default function AccuracyComparison() {
  const {
    problemsTested,
    samplesPerProblem,
    singleCorrect,
    selfConsistencyCorrect,
    singleAccuracy,
    selfConsistencyAccuracy,
    totalApiCalls,
    lowestAgreement,
  } = EVALUATION_RESULTS;

  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-charcoal">
        We ran {problemsTested} classic reasoning questions (including a couple of well-known
        &ldquo;trick&rdquo; ones) through both methods and checked every answer by hand.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {METRICS.map((m, i) => {
          const value = EVALUATION_RESULTS[m.key];
          return (
            <Reveal key={m.key} delay={i * 0.08} className="panel p-4">
              <m.icon className={`h-5 w-5 ${m.tone}`} />
              <p className={`mt-3 text-2xl font-semibold ${m.tone}`}>
                {m.signed && value >= 0 ? "+" : ""}
                {value}%
              </p>
              <p className="mt-1.5 text-sm text-mute">{m.label}</p>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.15} className="mt-6">
        <p className="mb-3 text-sm font-semibold text-body">Accuracy by Method</p>
        <CategoryBarChart
          suffix="%"
          maxValue={100}
          data={[
            { label: `Single Prompt (${singleCorrect}/${problemsTested})`, value: singleAccuracy, highlight: false },
            { label: `Self-Consistency (${selfConsistencyCorrect}/${problemsTested})`, value: selfConsistencyAccuracy, highlight: true },
          ]}
        />
      </Reveal>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Fact label="Problems Tested" value={problemsTested} />
        <Fact label="Samples per Problem" value={samplesPerProblem} />
        <Fact label="Total API Calls" value={totalApiCalls} />
      </div>

      <Reveal delay={0.2} className="mt-6 panel p-4 text-sm leading-relaxed text-charcoal">
        Both methods landed on the correct final answer for every question here, so the accuracy
        numbers tie. But self-consistency still gives us something a single answer can&apos;t: on
        one of the {problemsTested} questions, the {samplesPerProblem} samples only agreed{" "}
        {lowestAgreement}% of the time — real disagreement between independent attempts, caught by
        the vote instead of hidden behind one confident-sounding answer.
      </Reveal>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="panel p-4 text-center">
      <p className="mono-tag text-lg font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-mute">{label}</p>
    </div>
  );
}
