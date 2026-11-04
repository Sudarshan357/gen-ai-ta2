import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileText, GitBranch, Vote, Trophy, Activity } from "lucide-react";
import { STAGES } from "../hooks/useSelfConsistencyDemo.js";
import SinglePromptSection from "./SinglePromptSection.jsx";
import ReasoningPathsSection from "./ReasoningPathsSection.jsx";
import MajorityVoteSection from "./MajorityVoteSection.jsx";
import JudgePanel from "./JudgePanel.jsx";
import DisagreementPanel from "./DisagreementPanel.jsx";
import ResourceUsagePanel from "./ResourceUsagePanel.jsx";
import ShareExportBar from "./ShareExportBar.jsx";

const PAGES = [
  { id: "source", label: "Source", icon: FileText },
  { id: "paths", label: "Paths", icon: GitBranch },
  { id: "vote", label: "Vote", icon: Vote },
  { id: "consensus", label: "Consensus", icon: Trophy },
  { id: "telemetry", label: "Telemetry", icon: Activity },
];

/** Which page the run's current stage is "on", so the view follows execution. */
function pageForStage(stage) {
  switch (stage) {
    case STAGES.SENDING:
    case STAGES.GENERATING:
      return 0;
    case STAGES.REVEALING:
      return 1;
    case STAGES.VOTING:
      return 2;
    case STAGES.DONE:
      return 3;
    default:
      return 0;
  }
}

/**
 * The execution view, paged rather than scrolled: the run advances one
 * page at a time and you can turn back through completed pages. Keeps the
 * whole flow linear and forward-moving instead of stacking every result
 * into one long column.
 */
export default function StageView({ demo }) {
  const { stage, single, paths, voteResult, meta, correctness, disagreement, runExplainDisagreement } = demo;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const lastStageRef = useRef(stage);

  // Follow the run while it's executing; once it's done the reader drives.
  useEffect(() => {
    if (stage !== lastStageRef.current) {
      lastStageRef.current = stage;
      if (stage !== STAGES.IDLE) {
        const target = pageForStage(stage);
        setDirection(target >= index ? 1 : -1);
        setIndex(target);
      }
    }
  }, [stage, index]);

  const unlocked = (i) => {
    if (i === 0) return Boolean(single) || stage !== STAGES.IDLE;
    if (i === 1) return paths.length > 0;
    if (i === 2) return Boolean(voteResult);
    if (i === 3) return stage === STAGES.DONE;
    if (i === 4) return Boolean(meta);
    return false;
  };

  const goTo = (i) => {
    if (i < 0 || i >= PAGES.length || !unlocked(i)) return;
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const hasRun = stage !== STAGES.IDLE || Boolean(single);

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {/* Stage rail */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-hairline bg-surface-card px-4 py-2.5">
        {PAGES.map((p, i) => {
          const active = i === index;
          const open = unlocked(i);
          return (
            <div key={p.id} className="flex items-center">
              <button
                type="button"
                onClick={() => goTo(i)}
                disabled={!open}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-primary/12 text-primary"
                    : open
                    ? "text-charcoal hover:bg-surface-bone hover:text-ink"
                    : "text-stone"
                }`}
              >
                <p.icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
              {i < PAGES.length - 1 && (
                <span className={`mx-0.5 h-px w-4 ${unlocked(i + 1) ? "bg-primary/40" : "bg-hairline"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Page body */}
      <div className="relative min-h-0 flex-1 overflow-y-auto bg-canvas">
        {!hasRun ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={PAGES[index].id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-3xl p-5 sm:p-6"
            >
              <PageHeader page={PAGES[index]} index={index} />

              {index === 0 && (
                <div className="flex flex-col gap-4">
                  <RunParams demo={demo} />
                  <SinglePromptSection single={single} />
                </div>
              )}

              {index === 1 && (
                <ReasoningPathsSection
                  paths={paths}
                  visibleCount={demo.visibleCount}
                  stage={stage}
                  voteResult={voteResult}
                />
              )}

              {index === 2 && <MajorityVoteSection voteResult={voteResult} stage={stage} section="vote" />}

              {index === 3 && (
                <div className="flex flex-col gap-5">
                  <MajorityVoteSection
                    voteResult={voteResult}
                    stage={stage}
                    correctness={correctness}
                    section="consensus"
                  />
                  <JudgePanel voteResult={voteResult} />
                  <DisagreementPanel
                    voteResult={voteResult}
                    disagreement={disagreement}
                    onExplain={runExplainDisagreement}
                  />
                </div>
              )}

              {index === 4 && (
                <div className="flex flex-col gap-5">
                  <ResourceUsagePanel meta={meta} pathCount={paths.length} />
                  <ShareExportBar
                    getShareUrl={demo.getShareUrl}
                    exportMarkdown={demo.exportMarkdown}
                    exportJson={demo.exportJson}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Page turn */}
      <div className="flex shrink-0 items-center justify-between border-t border-hairline bg-surface-card px-4 py-2.5">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0 || !unlocked(index - 1)}
          className="btn-ghost"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span className="micro-label">
          {index + 1} / {PAGES.length} · {PAGES[index].label}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === PAGES.length - 1 || !unlocked(index + 1)}
          className="btn-ghost"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

function PageHeader({ page, index }) {
  return (
    <div className="mb-4 border-b border-hairline pb-3">
      <span className="micro-label">Step {index + 1}</span>
      <h2 className="mt-1 text-[15px] font-semibold text-ink">{page.label}</h2>
    </div>
  );
}

function RunParams({ demo }) {
  const { question, model, numSamples, temperature, votingStrategy, adaptive } = demo;
  const items = [
    ["model", model],
    ["samples", numSamples],
    ["temp", temperature.toFixed(1)],
    ["strategy", votingStrategy],
    ["adaptive", adaptive ? "on" : "off"],
  ];

  return (
    <div className="panel p-4">
      <span className="micro-label">Question</span>
      <p className="mt-1.5 text-[13px] leading-relaxed text-body">{question}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-hairline pt-3">
        {items.map(([k, v]) => (
          <span key={k} className="font-mono text-[10px] text-mute">
            {k}=<span className="text-charcoal">{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-grid-faint flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <GitBranch className="h-6 w-6 text-stone" />
      <p className="max-w-xs text-[12px] leading-relaxed text-mute">
        Set the parameters on the left and press <span className="text-body">Run</span>. The execution
        advances one step at a time — source, paths, vote, consensus.
      </p>
    </div>
  );
}
