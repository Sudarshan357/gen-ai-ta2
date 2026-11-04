import { motion } from "framer-motion";

/**
 * Self-reported confidence per path — one series, so it needs no legend
 * (per the data-viz skill, a single series takes its identity from the
 * chart's own label). Bars are thin, rounded at the data-end and square at
 * the baseline; only the extremes are direct-labeled.
 */
export default function ConfidenceBarChart({ paths }) {
  const withConfidence = paths.filter((p) => typeof p.confidence === "number");
  if (withConfidence.length < 2) return null;

  const max = Math.max(...withConfidence.map((p) => p.confidence));
  const min = Math.min(...withConfidence.map((p) => p.confidence));

  return (
    <div className="panel">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="micro-label">Confidence per path</span>
        <span className="font-mono text-[10px] text-ash">
          {min}–{max}%
        </span>
      </div>

      <div className="px-4 pb-3 pt-4">
        <div className="flex items-end gap-1.5" style={{ height: 56 }}>
          {withConfidence.map((p, i) => {
            const heightPct = Math.max(p.confidence, 6);
            const isExtreme = p.confidence === max || p.confidence === min;
            return (
              <div
                key={p.id}
                className="flex flex-1 flex-col items-center gap-1"
                title={`path ${p.pathNumber} — ${p.confidence}%`}
              >
                <div className="relative flex h-full w-full max-w-[20px] items-end justify-center">
                  {isExtreme && (
                    <span className="absolute -top-3.5 font-mono text-[9px] text-mute">{p.confidence}</span>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-t-[3px] bg-primary/70"
                  />
                </div>
                <span className="font-mono text-[9px] text-ash">{p.pathNumber}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
