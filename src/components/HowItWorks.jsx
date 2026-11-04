import {
  PenLine,
  GitBranch,
  ScanSearch,
  ListOrdered,
  Vote,
  Trophy,
} from "lucide-react";
import Reveal from "./ui/Reveal.jsx";

const STEPS = [
  {
    icon: PenLine,
    title: "Input a Reasoning Problem",
    description: "The user submits a question that requires step-by-step reasoning to solve.",
  },
  {
    icon: GitBranch,
    title: "Generate Multiple Independent Responses",
    description: "The same prompt is sent to the model several times, each producing its own reasoning path.",
  },
  {
    icon: ScanSearch,
    title: "Extract Final Answers",
    description: "The concluding answer is parsed out of each independent reasoning trace.",
  },
  {
    icon: ListOrdered,
    title: "Count Answer Frequency",
    description: "Extracted answers are grouped and tallied to see how often each one occurs.",
  },
  {
    icon: Vote,
    title: "Apply Majority Voting",
    description: "The answer with the highest vote count is identified as the consensus response.",
  },
  {
    icon: Trophy,
    title: "Return Most Consistent Answer",
    description: "The majority answer is returned as the final, most reliable output.",
  },
];

/** Tab-panel content for the "How It Works" tab of EvaluationSection. */
export default function HowItWorks() {
  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-primary-deep/40 to-transparent sm:left-7" />

      <div className="flex flex-col gap-8">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.05} className="relative flex gap-5 sm:gap-6">
            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-bone sm:h-14 sm:w-14">
              <step.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" strokeWidth={2} />
            </div>
            <div className="panel flex-1 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="mono-tag text-xs font-semibold text-ash">
                  STEP {i + 1}
                </span>
              </div>
              <h3 className="text-[13px] font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
