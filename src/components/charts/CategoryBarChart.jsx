import { motion } from "framer-motion";

/**
 * A grouped vertical bar chart with a baseline and gridlines — magnitude
 * encoding for comparing a small set of named categories (per the data-viz
 * skill: one hue per bar where identity matters, gridlines recessive,
 * value labeled at the bar's cap rather than every tick).
 */
export default function CategoryBarChart({ data, maxValue, suffix = "", height = 180 }) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value)) * 1.15;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="panel p-4 sm:p-5">
      <div className="relative" style={{ height }}>
        {gridLines.map((g) => (
          <div
            key={g}
            className="absolute inset-x-0 border-t border-hairline"
            style={{ bottom: `${g * 100}%` }}
          />
        ))}

        <div className="absolute inset-0 flex items-end justify-around gap-6 px-2">
          {data.map((d, i) => {
            const pct = max > 0 ? (d.value / max) * 100 : 0;
            return (
              <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mono-tag mb-1.5 text-[13px] font-semibold text-ink">
                  {d.value}
                  {suffix}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${pct}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-full max-w-[48px] rounded-t-[4px] ${
                    d.highlight ? "bg-primary" : "bg-stone"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-around gap-6 px-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-charcoal">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
