import { AlertTriangle, Loader2, MessageCircleQuestion } from "lucide-react";

/** Shown only when a run produced real disagreement — more than one distinct final answer. */
export default function DisagreementPanel({ voteResult, disagreement, onExplain }) {
  if (!voteResult || voteResult.entries.length < 2) return null;

  const dissenting = voteResult.entries.filter((e) => e.answer !== voteResult.winner);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        <span className="micro-label text-warning">Disagreement detected</span>
      </div>

      <div className="p-4">
        <p className="text-[12px] leading-relaxed text-charcoal">
          {dissenting.length} competing answer{dissenting.length > 1 ? "s" : ""}:{" "}
          {dissenting.map((e) => `${e.answer} (${e.votes})`).join(", ")} — against{" "}
          <span className="mono-tag text-ink">{voteResult.winner}</span> ({voteResult.winnerVotes}). A single
          prompt would have returned one of these with no indication the others existed.
        </p>

        <button type="button" onClick={onExplain} disabled={disagreement?.loading} className="btn-secondary mt-3">
          {disagreement?.loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <MessageCircleQuestion className="h-3 w-3" />
              Explain the divergence
            </>
          )}
        </button>

        {disagreement?.explanation && (
          <p className="row-tile mt-3 p-3 text-[12px] leading-relaxed text-body">{disagreement.explanation}</p>
        )}
        {disagreement?.error && <p className="mt-3 text-[12px] text-warning">{disagreement.error}</p>}
      </div>
    </div>
  );
}
