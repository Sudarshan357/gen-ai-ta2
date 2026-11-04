import { Zap } from "lucide-react";
import Reveal from "./ui/Reveal.jsx";
import CategoryBarChart from "./charts/CategoryBarChart.jsx";

const ROWS = [
  { label: "Single Prompt", samples: 1, highlight: false },
  { label: "3 Samples", samples: 3, highlight: false },
  { label: "5 Samples", samples: 5, highlight: true },
  { label: "7 Samples", samples: 7, highlight: false },
];

/** Tab-panel content for the "Cost" tab of EvaluationSection. */
export default function CostComparison() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-center text-sm leading-relaxed text-charcoal">
        Every extra sample is one more call to the model — self-consistency trades API cost and a bit
        of response time for a more reliable answer.
      </p>

      <Reveal className="mt-10">
        <CategoryBarChart
          suffix=" calls"
          data={ROWS.map((r) => ({ label: r.label, value: r.samples, highlight: r.highlight }))}
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-5 panel flex items-start gap-3 p-4 text-sm leading-relaxed text-charcoal">
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p>
          More samples can improve reliability, but they increase API cost and response time —
          7 samples means 7x the calls (and roughly 7x the wait) of asking once.
        </p>
      </Reveal>
    </div>
  );
}
