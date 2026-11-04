import { Shuffle, ShieldMinus, Users } from "lucide-react";
import Reveal from "./ui/Reveal.jsx";

const CARDS = [
  {
    icon: Shuffle,
    title: "Diverse Reasoning Paths",
    description: "Independent samples explore the problem in different ways instead of repeating one line of thought.",
  },
  {
    icon: ShieldMinus,
    title: "Reduced Effect of Individual Errors",
    description: "A mistake in one sample rarely repeats across the others, so it's unlikely to win the vote.",
  },
  {
    icon: Users,
    title: "Majority Consensus",
    description: "The answer most samples agree on is picked as the final, more trustworthy result.",
  },
];

/** Tab-panel content for the "Why It Helps" tab of EvaluationSection. */
export default function WhyItHelps() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {CARDS.map((card, i) => (
        <Reveal key={card.title} delay={i * 0.08} className="panel p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-ink/[0.04]">
            <card.icon className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink">{card.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">{card.description}</p>
        </Reveal>
      ))}
    </div>
  );
}
