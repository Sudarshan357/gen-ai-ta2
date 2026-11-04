import { Gavel } from "lucide-react";

/** Shown only when the run used the "judge" strategy — the judge's rationale, not ground truth. */
export default function JudgePanel({ voteResult }) {
  if (!voteResult || voteResult.strategy !== "judge") return null;

  return (
    <div className="panel">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <Gavel className="h-3.5 w-3.5 text-info" />
        <span className="micro-label">Judge rationale</span>
      </div>
      <div className="p-4">
        <p className="font-mono text-[12px] font-medium text-ink">
          {voteResult.judgePathNumber ? `selected path ${voteResult.judgePathNumber}` : "could not parse a pick"}
        </p>
        {voteResult.judgeReason && (
          <p className="mt-2 text-[12px] leading-relaxed text-charcoal">{voteResult.judgeReason}</p>
        )}
        {voteResult.judgeError && (
          <p className="mt-2 text-[12px] text-warning">
            Judge call failed ({voteResult.judgeError}) — fell back to majority vote.
          </p>
        )}
      </div>
    </div>
  );
}
