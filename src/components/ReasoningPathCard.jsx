import { motion } from "framer-motion";
import { Check, Gavel } from "lucide-react";

/** One sampled reasoning path, as a dense console row rather than a card. */
export default function ReasoningPathCard({ path, isMajority, isJudgePick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-md border bg-surface-bone p-3 ${
        isMajority ? "border-primary/35" : "border-hairline"
      }`}
    >
      {isMajority && <span className="absolute inset-y-0 left-0 w-[2px] bg-primary" />}

      <div className="flex items-center justify-between gap-2">
        <span className="micro-label">path {path.pathNumber}</span>
        <div className="flex items-center gap-2">
          {isJudgePick && (
            <span className="status-pill border border-info/30 text-info">
              <Gavel className="h-2.5 w-2.5" />
              judge
            </span>
          )}
          {typeof path.confidence === "number" && (
            <span className="font-mono text-[10px] text-ash">{path.confidence}%</span>
          )}
        </div>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-charcoal">{path.reasoning}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
        <span className="micro-label">answer</span>
        <span className="flex items-center gap-1.5">
          <span className={`mono-tag text-sm font-semibold ${isMajority ? "text-ink" : "text-charcoal"}`}>
            {path.answer}
          </span>
          {isMajority && <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />}
        </span>
      </div>
    </motion.div>
  );
}
