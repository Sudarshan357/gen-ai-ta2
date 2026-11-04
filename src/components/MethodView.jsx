import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WhyItHelps from "./WhyItHelps.jsx";
import HowItWorks from "./HowItWorks.jsx";
import AccuracyComparison from "./AccuracyComparison.jsx";
import CostComparison from "./CostComparison.jsx";

const TABS = [
  { id: "how", label: "Pipeline", Component: HowItWorks },
  { id: "why", label: "Rationale", Component: WhyItHelps },
  { id: "accuracy", label: "Accuracy", Component: AccuracyComparison },
  { id: "cost", label: "Cost", Component: CostComparison },
];

/**
 * Reference material for the technique — kept as a second view inside the
 * app rather than a marketing page under the console.
 */
export default function MethodView() {
  const [active, setActive] = useState("how");
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-hairline bg-surface-card px-4 py-2.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            aria-pressed={active === t.id}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              active === t.id ? "bg-primary/12 text-primary" : "text-charcoal hover:bg-surface-bone hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-canvas">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl p-5 sm:p-6"
          >
            <tab.Component />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
