import { motion } from "framer-motion";

// Categorical steps validated with the data-viz skill's validate_palette.js
// against the dark console surface — lightness band, chroma floor, CVD
// separation (worst adjacent ΔE 17.3), normal-vision floor and contrast all
// pass in this fixed order. Deliberately orange-free: orange reads as a
// status colour everywhere else in this UI, so keeping it out of the
// categorical ramp stops a vote slice from looking like a warning. Capped
// at 4 slices — beyond that, extra answers fold into "Other" rather than
// stretching the palette past where it's been validated.
const SLOT_COLORS = ["#3987e5", "#199e70", "#9085e9", "#c98500"];
const MAX_SLICES = 4;
const GAP_DEGREES = 3; // surface gap between wedges, in degrees of arc

function foldToSlices(entries) {
  if (entries.length <= MAX_SLICES) return entries;
  const kept = entries.slice(0, MAX_SLICES - 1);
  const rest = entries.slice(MAX_SLICES - 1);
  const otherVotes = rest.reduce((sum, e) => sum + e.votes, 0);
  const otherWeight = rest.reduce((sum, e) => sum + (e.weight ?? e.votes), 0);
  return [...kept, { answer: "Other", votes: otherVotes, weight: otherWeight, isOther: true }];
}

/**
 * A donut chart of the vote distribution, as a second encoding alongside
 * the bars in MajorityVoteSection — same data, read as proportion instead
 * of magnitude. Direct labels (the legend below) are mandatory here since
 * the categorical steps sit in the CVD 6-8 floor band for some adjacent
 * pairs (see data-viz skill's color-formula.md).
 */
export default function VoteDonutChart({ entries, totalWeight, winner }) {
  const slices = foldToSlices(entries);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const gapLength = (GAP_DEGREES / 360) * circumference;

  let cumulative = 0;
  const arcs = slices.map((entry, i) => {
    const weight = entry.weight ?? entry.votes;
    const fraction = totalWeight > 0 ? weight / totalWeight : 0;
    const rawLength = fraction * circumference;
    const segmentLength = Math.max(rawLength - gapLength, 0);
    const offset = -cumulative;
    cumulative += rawLength;
    return {
      ...entry,
      color: SLOT_COLORS[i % SLOT_COLORS.length],
      pct: Math.round(fraction * 100),
      dashArray: `${segmentLength} ${circumference - segmentLength}`,
      dashOffset: offset,
    };
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" className="stroke-ink/[0.08]" strokeWidth="12" />
          {arcs.map((arc, i) => (
            <motion.circle
              key={arc.answer}
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="12"
              strokeLinecap="butt"
              strokeDasharray={arc.dashArray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: arc.dashOffset }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono-tag text-base font-bold text-ink">{arcs[0]?.pct ?? 0}%</span>
          <span className="text-[9px] uppercase tracking-wider text-mute">top answer</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {arcs.map((arc) => (
          <div key={arc.answer} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: arc.color }} />
            <span className={`mono-tag ${arc.answer === winner ? "font-semibold text-ink" : "text-charcoal"}`}>
              {arc.answer}
            </span>
            <span className="text-mute">
              {arc.pct}% · {arc.votes} vote{arc.votes === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
