import { motion } from "framer-motion";
import { Check, ArrowRight, AlertTriangle, X } from "lucide-react";
import { STAGES } from "../hooks/useSelfConsistencyDemo.js";

const STATUS = {
  completed: { label: "Completed", icon: Check, text: "text-success", rail: "bg-success", chip: "text-success" },
  routed: { label: "Routed", icon: ArrowRight, text: "text-info", rail: "bg-info", chip: "text-info" },
  issue: { label: "Issue", icon: AlertTriangle, text: "text-warning", rail: "bg-warning", chip: "text-warning" },
  failed: { label: "Failed", icon: X, text: "text-danger", rail: "bg-danger", chip: "text-danger" },
};

/**
 * The run log — one row per completed step, in the order the run reached
 * them (see `events` in useSelfConsistencyDemo.js). Status carries colour
 * here; everything else in the console stays neutral.
 */
export default function RunTimeline({ events, stage, voteResult }) {
  const finished = stage === STAGES.DONE;

  return (
    <aside className="flex w-full shrink-0 flex-col border-hairline bg-surface-card lg:w-[320px] lg:border-l">
      <div className="shrink-0 border-b border-hairline px-4 py-3">
        <h2 className="text-[13px] font-semibold text-ink">Run timeline</h2>
        <p className="mt-0.5 text-[11px] text-mute">One row per completed step.</p>
        {finished && voteResult && (
          <p className="mt-2 font-mono text-[11px] text-success">
            Finished: {String(voteResult.winner).toUpperCase()}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {events.length === 0 ? (
          <p className="px-1 py-6 text-center text-[11px] text-ash">No run yet. Press Run to start.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {events.map((e) => {
              const s = STATUS[e.status] ?? STATUS.completed;
              const Icon = s.icon;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-hidden rounded-md border border-hairline bg-surface-bone py-2 pl-3 pr-2.5"
                >
                  <span className={`absolute inset-y-0 left-0 w-[2px] ${s.rail}`} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${s.text}`} strokeWidth={2.5} />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] font-medium text-ink">{e.label}</p>
                        {e.detail && <p className="truncate text-[10px] text-mute">{e.detail}</p>}
                      </div>
                    </div>
                    <span className={`status-pill shrink-0 ${s.chip}`}>{s.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
