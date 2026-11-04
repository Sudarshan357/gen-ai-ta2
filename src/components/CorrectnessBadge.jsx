import { CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";

/**
 * Shows whether a given answer was correct. For preset questions this is an
 * exact match against a locally-known answer (see src/data/presetProblems.js)
 * — for custom questions it's a second Groq call grading the answer (see
 * /api/grade), clearly labeled as a model's opinion, not ground truth. Sits
 * on the dark-inversion consensus card, so tones are picked for a dark
 * surface rather than the cream canvas.
 */
export default function CorrectnessBadge({ correctness }) {
  if (!correctness) return null;

  if (correctness.status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-hairline bg-surface-bone px-2 py-0.5 font-mono text-[10px] font-medium text-mute">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking with grader model…
      </span>
    );
  }

  if (correctness.status === "unverified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-hairline bg-surface-bone px-2 py-0.5 font-mono text-[10px] font-medium text-mute">
        <HelpCircle className="h-3 w-3" />
        Could not verify automatically
      </span>
    );
  }

  const isCorrect = correctness.status === "correct";
  const label =
    correctness.source === "known"
      ? isCorrect
        ? "Correct (matches known answer)"
        : `Incorrect — expected ${correctness.expected}`
      : isCorrect
      ? "Graded correct by LLM judge"
      : `Graded incorrect by LLM judge${correctness.expected ? ` — expected ${correctness.expected}` : ""}`;

  return (
    <span
      title={correctness.note || undefined}
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-medium ${
        isCorrect
          ? "border-success/30 bg-success/[0.1] text-success"
          : "border-danger/30 bg-danger/[0.1] text-danger"
      }`}
    >
      {isCorrect ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}
