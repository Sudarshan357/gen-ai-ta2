import ReasoningPathCard from "./ReasoningPathCard.jsx";
import ConfidenceBarChart from "./charts/ConfidenceBarChart.jsx";

/** The independent reasoning paths and their extracted answers. */
export default function ReasoningPathsSection({ paths, visibleCount, stage, voteResult }) {
  if (paths.length === 0) return null;

  const votingDone = stage === "voting" || stage === "done";
  const majorityAnswer = votingDone ? voteResult?.winner ?? null : null;
  const judgePathNumber = votingDone && voteResult?.strategy === "judge" ? voteResult.judgePathNumber : null;

  const visible = paths.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-4">
      {visible.length === paths.length && <ConfidenceBarChart paths={paths} />}

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="micro-label">Sampled paths</span>
          <span className="font-mono text-[10px] text-ash">
            {visible.length}/{paths.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {visible.map((path) => (
            <ReasoningPathCard
              key={path.id}
              path={path}
              isMajority={majorityAnswer !== null && path.answer === majorityAnswer}
              isJudgePick={judgePathNumber !== null && path.pathNumber === judgePathNumber}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
