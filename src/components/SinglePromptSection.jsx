import { motion } from "framer-motion";

/** The one-shot baseline answer — what self-consistency gets measured against. */
export default function SinglePromptSection({ single }) {
  if (!single) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="panel">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
          <span className="micro-label">Baseline · single prompt</span>
          <span className="font-mono text-[10px] text-ash">1 call</span>
        </div>
        <div className="p-4">
          <p className="text-[12px] leading-relaxed text-charcoal">{single.reasoning}</p>
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
            <span className="micro-label">answer</span>
            <span className="flex items-center gap-2">
              <span className="mono-tag text-sm font-semibold text-ink">{single.answer}</span>
              {typeof single.confidence === "number" && (
                <span className="font-mono text-[10px] text-ash">{single.confidence}%</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
