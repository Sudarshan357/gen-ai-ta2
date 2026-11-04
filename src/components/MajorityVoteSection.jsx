import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Vote } from "lucide-react";
import CorrectnessBadge from "./CorrectnessBadge.jsx";
import VoteDonutChart from "./charts/VoteDonutChart.jsx";

const STRATEGY_LABELS = {
  majority: "Majority Vote",
  confidence: "Confidence-Weighted Vote",
  judge: "LLM Judge Pick",
};

/**
 * The vote breakdown and the final consensus answer. `section` splits the
 * two across pages in StageView ("vote" | "consensus"); "both" renders the
 * pair together.
 */
export default function MajorityVoteSection({ voteResult, stage, correctness, section = "both" }) {
  if (!voteResult) return null;

  const showFinal = stage === "done" && section !== "vote";
  const showTally = section !== "consensus";

  if (!showTally) {
    return <ConsensusCard voteResult={voteResult} correctness={correctness} visible={showFinal} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="panel">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
          <Vote className="h-3.5 w-3.5 text-mute" />
          <span className="micro-label">{STRATEGY_LABELS[voteResult.strategy] ?? "Majority vote"}</span>
        </div>
        <div className="p-4">
          <VoteDonutChart
            entries={voteResult.entries}
            totalWeight={voteResult.totalWeight}
            winner={voteResult.winner}
          />
        </div>
      </div>

      <div className="panel">
        <div className="border-b border-hairline px-4 py-2.5">
          <span className="micro-label">Answer distribution</span>
        </div>
        <div className="flex flex-col gap-3.5 p-4">
          {voteResult.entries.map((entry, i) => {
            const weight = entry.weight ?? entry.votes;
            const pct = voteResult.totalWeight > 0 ? (weight / voteResult.totalWeight) * 100 : 0;
            const isWinner = entry.answer === voteResult.winner;
            return (
              <div key={entry.answer}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className={`mono-tag text-[13px] ${isWinner ? "font-semibold text-ink" : "text-charcoal"}`}>
                    {entry.answer}
                  </span>
                  <span className="font-mono text-[10px] text-mute">
                    {entry.votes} {entry.votes === 1 ? "vote" : "votes"} · {Math.round(pct)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${isWinner ? "bg-primary" : "bg-stone"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {section === "both" && (
        <div className="mt-4">
          <ConsensusCard voteResult={voteResult} correctness={correctness} visible={showFinal} />
        </div>
      )}
    </div>
  );
}

/**
 * The run's one headline figure. It's the only element in the console that
 * gets emphasis treatment — everything else stays a quiet panel.
 */
function ConsensusCard({ voteResult, correctness, visible }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="panel overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
            <Trophy className="h-3.5 w-3.5 text-success" />
            <span className="micro-label text-success">Consensus answer</span>
          </div>

          <div className="p-5">
            <p className="mono-tag break-words text-3xl font-semibold leading-tight text-ink">
              {voteResult.winner}
            </p>

            {correctness && (
              <div className="mt-3">
                <CorrectnessBadge correctness={correctness} />
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
              <div>
                <p className="mono-tag text-xl font-semibold text-ink">
                  {voteResult.winnerVotes}/{voteResult.total}
                </p>
                <p className="micro-label mt-1">Supporting votes</p>
              </div>
              <div>
                <p className="mono-tag text-xl font-semibold text-ink">{voteResult.confidence}%</p>
                <p className="micro-label mt-1">Agreement</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
